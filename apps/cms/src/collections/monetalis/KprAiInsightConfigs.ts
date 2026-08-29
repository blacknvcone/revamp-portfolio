import type { CollectionConfig } from 'payload'
import { aiInsightConfigAccess } from '@/access/monetalis'

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

export const KprAiInsightConfigs: CollectionConfig = {
  slug: 'kpr-ai-insight-configs',
  access: aiInsightConfigAccess,
  admin: {
    group: 'Monetalis',
    useAsTitle: 'name',
    description: 'Konfigurasi provider AI dan prompt insight global',
    defaultColumns: ['name', 'provider', 'model', 'isActive'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nama Konfigurasi',
    },
    {
      name: 'provider',
      type: 'select',
      required: true,
      defaultValue: 'suprlus-intelligents',
      label: 'AI Provider',
      options: [
        { label: 'SuprlusIntelligents', value: 'suprlus-intelligents' },
      ],
    },
    {
      name: 'endpoint',
      type: 'text',
      required: true,
      label: 'Provider Endpoint',
      admin: {
        description: 'URL endpoint server-side provider AI. Jangan gunakan URL frontend proxy.',
      },
    },
    {
      name: 'model',
      type: 'text',
      required: true,
      label: 'Model',
    },
    {
      name: 'apiToken',
      type: 'text',
      required: true,
      label: 'API Token',
      admin: {
        description: 'Token provider. Disimpan di CMS dan tidak pernah dikembalikan ke API/frontend.',
      },
    },
    {
      name: 'systemPrompt',
      type: 'textarea',
      label: 'System Prompt',
      defaultValue: DEFAULT_SYSTEM_PROMPT,
      admin: {
        description: 'Opsional. Jika kosong, CMS menggunakan system prompt default bawaan aplikasi.',
      },
    },
    {
      name: 'userPromptTemplate',
      type: 'textarea',
      label: 'User Prompt Template',
      defaultValue: DEFAULT_USER_PROMPT_TEMPLATE,
      admin: {
        description: 'Opsional. Jika kosong, CMS menggunakan template default. Placeholder: {{analysisDate}} dan {{normalizedKprSnapshot}}.',
      },
    },
    {
      name: 'promptVersion',
      type: 'text',
      required: true,
      defaultValue: 'v1',
      label: 'Prompt Version',
    },
    {
      name: 'temperature',
      type: 'number',
      required: true,
      defaultValue: 0.2,
      min: 0,
      max: 1,
      label: 'Temperature',
    },
    {
      name: 'timeoutMs',
      type: 'number',
      required: true,
      defaultValue: 30000,
      min: 1000,
      max: 120000,
      label: 'Timeout (ms)',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Aktif',
    },
  ],
}
