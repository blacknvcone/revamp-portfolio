import type { PayloadRequest } from 'payload'
import { resolveMonetalisUser } from '@/middleware/logto-jwt'
import type { KprAiInsight } from '@/payload-types'
import { buildInsightSystemPrompt, buildInsightUserPrompt, normalizeKprInsightInput, type AiInsightOutput } from '@/services/kpr-insights'

const PROMPT_VERSION_FALLBACK = 'v1'

interface AiProviderConfig {
  endpoint: string
  model: string
  apiToken: string
  systemPrompt: string
  userPromptTemplate: string
  promptVersion: string
  temperature: number
  timeoutMs: number
}

const DEFAULT_SYSTEM_PROMPT = `Anda adalah analis keuangan pribadi untuk dashboard KPR Monetalis.

Tugas Anda adalah menganalisis snapshot data KPR yang diberikan dan menghasilkan ringkasan yang praktis, berbasis data, dan mudah dipahami dalam Bahasa Indonesia.

Aturan wajib:
1. Gunakan hanya data yang tersedia di input.
2. Jangan mengarang angka, tanggal, rate, biaya, atau kondisi yang tidak tersedia.
3. Bedakan fakta aktual, proyeksi, dan asumsi secara eksplisit.
4. Jika data tidak cukup untuk menyimpulkan sesuatu, katakan bahwa data tidak cukup.
5. Gunakan angka hanya jika tersedia atau dapat dihitung langsung dari input.
6. Prioritaskan risiko kenaikan bunga, penalti pelunasan, arus kas, sisa pokok, dan peluang pembayaran ekstra.
7. Jangan menjamin keuntungan investasi atau memberikan keputusan finansial absolut.
8. Setiap rekomendasi harus memiliki alasan yang merujuk ke data input.
9. Gunakan Bahasa Indonesia yang ringkas dan profesional.
10. Kembalikan JSON valid sesuai schema yang diminta. Jangan menambahkan teks di luar JSON.
11. Sertakan disclaimer bahwa output adalah analisis informasional dan perlu diverifikasi dengan bank atau penasihat keuangan.

Maksimum output: 5 risks, 5 opportunities, 5 actions, dan 3 assumptions.`

const DEFAULT_USER_PROMPT_TEMPLATE = `Analisis snapshot KPR berikut pada tanggal {{analysisDate}}.

DATA KPR:
{{normalizedKprSnapshot}}

Kembalikan JSON dengan struktur berikut:
{
  "summary": "string, maksimal 500 karakter",
  "financialPosition": "string, maksimal 800 karakter",
  "risks": ["string"],
  "opportunities": ["string"],
  "actions": [{
    "priority": "high | medium | low",
    "title": "string",
    "reason": "string",
    "estimatedImpact": "string atau null"
  }],
  "assumptions": ["string"],
  "disclaimer": "string"
}

Jangan gunakan markdown di dalam field dan jangan mengulang seluruh data input.`

async function getProviderConfig(req: PayloadRequest): Promise<AiProviderConfig> {
  const configs = await req.payload.find({
    collection: 'kpr-ai-insight-configs',
    where: { isActive: { equals: true } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const config = configs.docs[0] as unknown as Record<string, unknown> | undefined
  if (!config) throw new Error('AI provider configuration is not configured')

  const required = ['endpoint', 'model', 'apiToken']
  if (required.some((field) => typeof config[field] !== 'string' || !config[field])) {
    throw new Error('AI provider configuration is incomplete')
  }

  return {
    endpoint: config.endpoint as string,
    model: config.model as string,
    apiToken: config.apiToken as string,
    systemPrompt: typeof config.systemPrompt === 'string' && config.systemPrompt ? config.systemPrompt : DEFAULT_SYSTEM_PROMPT,
    userPromptTemplate: typeof config.userPromptTemplate === 'string' && config.userPromptTemplate ? config.userPromptTemplate : DEFAULT_USER_PROMPT_TEMPLATE,
    promptVersion: typeof config.promptVersion === 'string' && config.promptVersion ? config.promptVersion : PROMPT_VERSION_FALLBACK,
    temperature: typeof config.temperature === 'number' ? config.temperature : 0.2,
    timeoutMs: typeof config.timeoutMs === 'number' ? config.timeoutMs : 30000,
  }
}

function renderUserPrompt(template: string, input: ReturnType<typeof normalizeKprInsightInput>): string {
  return template
    .replaceAll('{{analysisDate}}', input.analysisDate)
    .replaceAll('{{normalizedKprSnapshot}}', JSON.stringify(input, null, 2))
}

function jsonError(error: string, code: string, status: number) {
  return Response.json({ error, code }, { status })
}

async function requireActiveSession(req: PayloadRequest) {
  const user = await resolveMonetalisUser(req as { headers: Headers }, req.payload)
  if (!user?.loanId) {
    throw new Response(JSON.stringify({ error: 'Unauthorized', code: 'NO_ACTIVE_LOAN_SESSION' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return user
}

async function loadInsightInput(req: PayloadRequest, loanId: string) {
  const [loans, tiers, schedule, extraPayments, goals] = await Promise.all([
    req.payload.find({ collection: 'kpr-loans', where: { id: { equals: loanId } }, limit: 1, depth: 0 }),
    req.payload.find({ collection: 'kpr-rate-tiers', where: { loan: { equals: loanId } }, sort: 'tierOrder', limit: 100, depth: 0 }),
    req.payload.find({ collection: 'kpr-schedule', where: { loan: { equals: loanId } }, sort: 'monthNumber', limit: 1000, depth: 0 }),
    req.payload.find({ collection: 'kpr-extra-payments', where: { loan: { equals: loanId } }, sort: '-paymentDate', limit: 100, depth: 0 }),
    req.payload.find({ collection: 'kpr-goals', where: { loan: { equals: loanId } }, sort: '-createdAt', limit: 1, depth: 0 }),
  ])

  const loan = loans.docs[0]
  if (!loan) return null

  return normalizeKprInsightInput({
    loan,
    tiers: tiers.docs,
    schedule: schedule.docs,
    extraPayments: extraPayments.docs,
    goal: goals.docs[0] ?? null,
  })
}

interface ProviderResponse {
  output?: unknown
  content?: unknown
  choices?: Array<{ message?: { content?: unknown } }>
  model?: string
}

function extractProviderOutput(response: ProviderResponse): { output: unknown; model?: string } {
  const output = response.output ?? response.content ?? response.choices?.[0]?.message?.content
  return { output, model: response.model }
}

function parseJsonOutput(output: unknown): unknown {
  if (typeof output === 'object' && output !== null) return output
  if (typeof output !== 'string') throw new Error('Provider output is not JSON')
  const cleaned = output.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(cleaned)
}

function validateAiOutput(value: unknown): AiInsightOutput {
  if (!value || typeof value !== 'object') throw new Error('AI output must be an object')
  const output = value as Record<string, unknown>
  const { summary, financialPosition, risks, opportunities, actions, assumptions, disclaimer } = output

  if (typeof summary !== 'string' || summary.length === 0 || summary.length > 2000) throw new Error('Invalid summary')
  if (typeof financialPosition !== 'string' || financialPosition.length === 0 || financialPosition.length > 3000) throw new Error('Invalid financialPosition')
  if (!Array.isArray(risks) || risks.length > 5 || risks.some((item) => typeof item !== 'string' || item.length > 1000)) throw new Error('Invalid risks')
  if (!Array.isArray(opportunities) || opportunities.length > 5 || opportunities.some((item) => typeof item !== 'string' || item.length > 1000)) throw new Error('Invalid opportunities')
  if (!Array.isArray(actions) || actions.length > 5) throw new Error('Invalid actions')
  if (!actions.every((item) => {
    if (!item || typeof item !== 'object') return false
    const action = item as Record<string, unknown>
    return ['high', 'medium', 'low'].includes(String(action.priority))
      && typeof action.title === 'string' && action.title.length <= 500
      && typeof action.reason === 'string' && action.reason.length <= 1500
      && (action.estimatedImpact == null || typeof action.estimatedImpact === 'string')
  })) throw new Error('Invalid action item')
  if (!Array.isArray(assumptions) || assumptions.length > 3 || assumptions.some((item) => typeof item !== 'string' || item.length > 1000)) throw new Error('Invalid assumptions')
  if (typeof disclaimer !== 'string' || disclaimer.length === 0 || disclaimer.length > 1000) throw new Error('Invalid disclaimer')

  return {
    summary,
    financialPosition,
    risks: risks as string[],
    opportunities: opportunities as string[],
    actions: actions as AiInsightOutput['actions'],
    assumptions: assumptions as string[],
    disclaimer,
  }
}

async function callSuprlusIntelligents(input: ReturnType<typeof normalizeKprInsightInput>, config: AiProviderConfig) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiToken}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: renderUserPrompt(config.userPromptTemplate, input) },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(`SuprlusIntelligents returned ${response.status}`)
    const providerResponse = await response.json() as ProviderResponse
    const extracted = extractProviderOutput(providerResponse)
    return { output: validateAiOutput(parseJsonOutput(extracted.output)), model: extracted.model ?? config.model }
  } finally {
    clearTimeout(timeout)
  }
}

const latestInsightHandler = async (req: PayloadRequest) => {
  try {
    const user = await requireActiveSession(req)
    const results = await req.payload.find({
      collection: 'kpr-ai-insights',
      where: { loan: { equals: user.loanId }, status: { equals: 'completed' } },
      sort: '-generatedAt',
      limit: 1,
      depth: 0,
    })

    if (!results.docs.length) return jsonError('No AI insight has been generated', 'INSIGHT_NOT_FOUND', 404)
    const insight = results.docs[0] as unknown as KprAiInsight
    return Response.json({ data: insight })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('[KPR AI Insight Latest Error]', error)
    return jsonError('Failed to load AI insight', 'INSIGHT_READ_FAILED', 500)
  }
}

const refreshInsightHandler = async (req: PayloadRequest) => {
  try {
    const user = await requireActiveSession(req)
    const input = await loadInsightInput(req, user.loanId)
    if (!input) return jsonError('Loan not found for active session', 'ACTIVE_LOAN_NOT_FOUND', 404)
    const providerConfig = await getProviderConfig(req)
    const generated = await callSuprlusIntelligents(input, providerConfig)

    const created = await req.payload.create({
      collection: 'kpr-ai-insights',
      data: {
        loan: user.loanId,
        generatedBy: user.sub,
        generatedAt: new Date().toISOString(),
        promptVersion: providerConfig.promptVersion,
        model: generated.model,
        sourceSnapshot: input.currentStatus,
        ...generated.output,
        status: 'completed',
      },
      overrideAccess: true,
    })

    return Response.json({ data: created }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[KPR AI Insight Refresh Error]', { message })
    if (message.includes('not configured') || message.includes('incomplete')) return jsonError('AI provider is not configured', 'AI_PROVIDER_NOT_CONFIGURED', 503)
    if (message.includes('AbortError') || message.includes('aborted')) return jsonError('AI provider timed out', 'AI_PROVIDER_TIMEOUT', 504)
    if (message.includes('Invalid ') || message.includes('not JSON')) return jsonError('AI provider returned invalid output', 'AI_OUTPUT_INVALID', 502)
    return jsonError('Failed to generate AI insight', 'AI_GENERATION_FAILED', 502)
  }
}

export const aiInsightEndpoints = [
  { path: '/kpr/insights/latest', method: 'get' as const, handler: latestInsightHandler },
  { path: '/kpr/insights/refresh', method: 'post' as const, handler: refreshInsightHandler },
]
