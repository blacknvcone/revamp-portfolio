import type { KprLoan, KprRateTier, KprSchedule, KprExtraPayment, KprGoal } from '@/payload-types'

export const INSIGHT_PROMPT_VERSION = 'v1'

export interface NormalizedKprInsightInput {
  analysisDate: string
  loan: {
    id: string
    bankName: string
    loanAmount: number
    housePrice: number
    tenorMonths: number
    firstPayment: string
    minTenorMonths: number
    penaltyBeforeMinTenor: number
    penaltyAfterMinTenor: number
    minPartialPrepayment: number
  }
  currentStatus: {
    currentMonth: number
    currentRatePct: number
    currentInstallment: number
    outstandingBalance: number
    totalPaid: number
    totalPrincipalPaid: number
    totalInterestPaid: number
    progressPct: number
  }
  ratePhases: Array<{
    phase: number
    startMonth: number
    endMonth: number
    ratePct: number
    installment: number
  }>
  upcomingPayments: Array<{
    monthNumber: number
    date: string
    principal: number
    interest: number
    total: number
  }>
  extraPayments: Array<{ paymentDate: string; amount: number; note?: string | null }>
  goal: { targetDate: string; monthlyIncome?: number | null; monthlyExpenses?: number | null; notes?: string | null } | null
  existingComputedMetrics: {
    totalInterestFullTerm: number
    estimatedSavingsIfPaidOffNow: number
    monthsUntilNextRatePhase: number | null
  }
}

export interface AiInsightOutput {
  summary: string
  financialPosition: string
  risks: string[]
  opportunities: string[]
  actions: Array<{
    priority: 'high' | 'medium' | 'low'
    title: string
    reason: string
    estimatedImpact: string | null
  }>
  assumptions: string[]
  disclaimer: string
}

export function buildInsightSystemPrompt(): string {
  return `Anda adalah analis keuangan pribadi untuk dashboard KPR Monetalis.

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
}

export function buildInsightUserPrompt(input: NormalizedKprInsightInput): string {
  return `Analisis snapshot KPR berikut pada tanggal ${input.analysisDate}.

DATA KPR:
${JSON.stringify(input, null, 2)}

Kembalikan JSON dengan struktur berikut:
{
  "summary": "string, maksimal 500 karakter",
  "financialPosition": "string, maksimal 800 karakter",
  "risks": ["string"],
  "opportunities": ["string"],
  "actions": [
    {
      "priority": "high | medium | low",
      "title": "string",
      "reason": "string",
      "estimatedImpact": "string atau null"
    }
  ],
  "assumptions": ["string"],
  "disclaimer": "string"
}

Jangan gunakan markdown di dalam field dan jangan mengulang seluruh data input.`
}

export function normalizeKprInsightInput(args: {
  loan: KprLoan
  tiers: KprRateTier[]
  schedule: KprSchedule[]
  extraPayments: KprExtraPayment[]
  goal: KprGoal | null
  now?: Date
}): NormalizedKprInsightInput {
  const { loan, tiers, schedule, extraPayments, goal, now = new Date() } = args
  const firstPayment = new Date(loan.firstPayment)
  const monthStart = new Date(firstPayment.getFullYear(), firstPayment.getMonth(), 1)
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonth = Math.max(1, (currentStart.getFullYear() - monthStart.getFullYear()) * 12 + currentStart.getMonth() - monthStart.getMonth() + 1)
  const currentEntry = schedule.find((entry) => entry.monthNumber === currentMonth)
  const currentTier = tiers.find((tier) => currentMonth >= tier.startMonth && currentMonth <= tier.endMonth) ?? tiers[tiers.length - 1]
  const paidEntries = schedule.filter((entry) => entry.monthNumber <= currentMonth && entry.isPaid)
  const totalPaid = paidEntries.reduce((sum, entry) => sum + (entry.paidAmount ?? entry.totalInstallment), 0)
  const totalPrincipalPaid = paidEntries.reduce((sum, entry) => sum + entry.principalPortion, 0)
  const totalInterestPaid = paidEntries.reduce((sum, entry) => sum + entry.interestPortion, 0)
  const totalInterestFullTerm = schedule.reduce((sum, entry) => sum + entry.interestPortion, 0)
  const nextTier = tiers.find((tier) => tier.startMonth > currentMonth)
  const remainingInterest = schedule.filter((entry) => entry.monthNumber > currentMonth).reduce((sum, entry) => sum + entry.interestPortion, 0)
  const outstandingBalance = currentEntry?.outstandingBalance ?? loan.loanAmount
  const minTenorMonths = loan.minTenorMonths ?? 36
  const penaltyBeforeMinTenor = loan.penaltyBeforeMinTenor ?? 10
  const penaltyAfterMinTenor = loan.penaltyAfterMinTenor ?? 2.5
  const minPartialPrepayment = loan.minPartialPrepayment ?? 6
  const penaltyRate = currentMonth >= minTenorMonths ? penaltyAfterMinTenor : penaltyBeforeMinTenor
  const estimatedSavingsIfPaidOffNow = Math.max(0, remainingInterest - outstandingBalance * penaltyRate / 100)

  return {
    analysisDate: now.toISOString(),
    loan: {
      id: loan.id,
      bankName: loan.bankName,
      loanAmount: loan.loanAmount,
      housePrice: loan.housePrice,
      tenorMonths: loan.tenorMonths,
      firstPayment: loan.firstPayment,
      minTenorMonths,
      penaltyBeforeMinTenor,
      penaltyAfterMinTenor,
      minPartialPrepayment,
    },
    currentStatus: {
      currentMonth,
      currentRatePct: currentTier?.ratePct ?? currentEntry?.interestRate ?? 0,
      currentInstallment: currentTier?.installment ?? currentEntry?.totalInstallment ?? 0,
      outstandingBalance,
      totalPaid,
      totalPrincipalPaid,
      totalInterestPaid,
      progressPct: loan.loanAmount > 0 ? totalPrincipalPaid / loan.loanAmount * 100 : 0,
    },
    ratePhases: [...tiers].sort((a, b) => a.tierOrder - b.tierOrder).map((tier) => ({
      phase: tier.tierOrder,
      startMonth: tier.startMonth,
      endMonth: tier.endMonth,
      ratePct: tier.ratePct,
      installment: tier.installment,
    })),
    upcomingPayments: schedule.filter((entry) => entry.monthNumber > currentMonth).slice(0, 6).map((entry) => ({
      monthNumber: entry.monthNumber,
      date: entry.calendarDate,
      principal: entry.principalPortion,
      interest: entry.interestPortion,
      total: entry.totalInstallment,
    })),
    extraPayments: extraPayments.slice(0, 12).map((payment) => ({
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      note: payment.note,
    })),
    goal: goal ? {
      targetDate: goal.targetDate,
      monthlyIncome: goal.monthlyIncome,
      monthlyExpenses: goal.monthlyExpenses,
      notes: goal.notes,
    } : null,
    existingComputedMetrics: {
      totalInterestFullTerm,
      estimatedSavingsIfPaidOffNow,
      monthsUntilNextRatePhase: nextTier ? nextTier.startMonth - currentMonth : null,
    },
  }
}
