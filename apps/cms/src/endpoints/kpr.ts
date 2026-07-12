/**
 * KPR Custom Endpoints for Monetalis
 *
 * Provides status, simulations, insights, and seeding for KPR loan data.
 * Uses Payload CMS 3.x local API (req.payload.find / create / etc.)
 */

import type { PayloadRequest } from 'payload'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d)
  r.setMonth(r.getMonth() + n)
  return r
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

function getRateForMonth(tiers: any[], month: number): { rate: number; installment: number; tier: any } {
  const tier = tiers.find((t: any) => month >= t.startMonth && month <= t.endMonth)
  if (!tier) {
    const last = tiers[tiers.length - 1]
    return { rate: last.ratePct, installment: last.installment, tier: last }
  }
  return { rate: tier.ratePct, installment: tier.installment, tier }
}

/**
 * Generate full amortisation schedule from loan params + rate tiers.
 */
function generateSchedule(
  loanAmount: number,
  firstPayment: Date,
  tiers: any[],
  tenorMonths: number,
): Array<{
  monthNumber: number
  calendarDate: string
  principalPortion: number
  interestPortion: number
  totalInstallment: number
  outstandingBalance: number
  interestRate: number
}> {
  const schedule: any[] = []
  let balance = loanAmount

  for (let m = 1; m <= tenorMonths; m++) {
    const { rate, installment } = getRateForMonth(tiers, m)
    const monthlyRate = rate / 100 / 12

    let interest = Math.round(balance * monthlyRate)
    let principal = installment - interest

    // Last month: pay remaining balance
    if (m === tenorMonths) {
      principal = balance
      interest = Math.round(balance * monthlyRate)
    }

    // Clamp principal to remaining balance
    if (principal > balance) {
      principal = balance
      interest = Math.round(balance * monthlyRate)
    }

    balance = Math.max(0, balance - principal)
    const calDate = addMonths(firstPayment, m - 1)

    schedule.push({
      monthNumber: m,
      calendarDate: fmtDate(calDate),
      principalPortion: principal,
      interestPortion: interest,
      totalInstallment: principal + interest,
      outstandingBalance: balance,
      interestRate: rate,
    })
  }

  return schedule
}

// ─── 1. GET /api/kpr/status ──────────────────────────────────────────────────

const statusHandler = async (req: PayloadRequest) => {
  try {
    const url = new URL(req.url!)
    const loanId = url.searchParams.get('loanId')

    if (!loanId) {
      return Response.json({ error: 'loanId query parameter is required' }, { status: 400 })
    }

    // Fetch loan
    const loans = await req.payload.find({
      collection: 'kpr-loans',
      where: { id: { equals: loanId } },
      limit: 1,
      depth: 0,
    })

    if (!loans.docs.length) {
      return Response.json({ error: 'Loan not found' }, { status: 404 })
    }

    const loan = loans.docs[0]

    // Fetch rate tiers
    const tiersRes = await req.payload.find({
      collection: 'kpr-rate-tiers',
      where: { loan: { equals: loanId } },
      sort: 'tierOrder',
      limit: 10,
      depth: 0,
    })
    const tiers = tiersRes.docs

    // Fetch schedule
    const scheduleRes = await req.payload.find({
      collection: 'kpr-schedule',
      where: { loan: { equals: loanId } },
      sort: 'monthNumber',
      limit: 300,
      depth: 0,
    })
    const schedule = scheduleRes.docs

    const now = new Date()
    const firstPayment = new Date(loan.firstPayment)
    const currentMonth = Math.max(1, monthsBetween(firstOfMonth(firstPayment), firstOfMonth(now)) + 1)

    // Find current and next schedule entries
    const currentEntry = schedule.find((s: any) => s.monthNumber === currentMonth)
    const nextEntry = schedule.find((s: any) => s.monthNumber === currentMonth + 1)

    // Outstanding balance from schedule
    const outstandingBalance = currentEntry
      ? currentEntry.outstandingBalance
      : schedule.length > 0
        ? schedule[schedule.length - 1].outstandingBalance
        : loan.loanAmount

    // Totals
    const totalPaid = schedule
      .filter((s: any) => s.monthNumber <= currentMonth)
      .reduce((sum: number, s: any) => sum + (s.paidAmount || s.totalInstallment), 0)

    const totalPrincipalPaid = schedule
      .filter((s: any) => s.monthNumber <= currentMonth)
      .reduce((sum: number, s: any) => sum + s.principalPortion, 0)

    const totalInterestPaid = schedule
      .filter((s: any) => s.monthNumber <= currentMonth)
      .reduce((sum: number, s: any) => sum + s.interestPortion, 0)

    // Current phase info
    const { rate: currentRate, installment: currentInstallment, tier: currentTier } =
      getRateForMonth(tiers, currentMonth)

    // Months until next rate change
    let monthsUntilNextPhase: number | null = null
    if (currentTier && currentMonth < currentTier.endMonth) {
      monthsUntilNextPhase = currentTier.endMonth - currentMonth
    }

    // Next phase rate
    const nextTier = tiers.find((t: any) => t.startMonth > currentMonth)
    const nextPhaseRate = nextTier ? nextTier.ratePct : null

    return Response.json({
      loanId,
      borrowerName: loan.borrowerName,
      bankName: loan.bankName,
      loanAmount: loan.loanAmount,
      tenorMonths: loan.tenorMonths,
      currentMonth,
      outstandingBalance,
      totalPaid,
      totalPrincipalPaid,
      totalInterestPaid,
      currentPhase: currentTier
        ? `Bulan ${currentTier.startMonth}-${currentTier.endMonth}`
        : 'Unknown',
      currentRate,
      currentInstallment,
      nextPayment: nextEntry
        ? {
            monthNumber: nextEntry.monthNumber,
            date: nextEntry.calendarDate,
            principal: nextEntry.principalPortion,
            interest: nextEntry.interestPortion,
            total: nextEntry.totalInstallment,
          }
        : null,
      monthsUntilNextPhase,
      nextPhaseRate,
      progressPct: Math.round(((loan.loanAmount - outstandingBalance) / loan.loanAmount) * 100 * 100) / 100,
    })
  } catch (err: any) {
    console.error('[KPR Status Error]', err)
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// ─── 2. POST /api/kpr/simulate/early-payoff ──────────────────────────────────

const earlyPayoffHandler = async (req: PayloadRequest) => {
  try {
    const body = await req.json?.() ?? {}
    const { loanId, targetMonth } = body

    if (!loanId || !targetMonth) {
      return Response.json(
        { error: 'loanId and targetMonth are required' },
        { status: 400 },
      )
    }

    // Fetch loan
    const loans = await req.payload.find({
      collection: 'kpr-loans',
      where: { id: { equals: loanId } },
      limit: 1,
      depth: 0,
    })

    if (!loans.docs.length) {
      return Response.json({ error: 'Loan not found' }, { status: 404 })
    }

    const loan = loans.docs[0]

    // Fetch schedule
    const scheduleRes = await req.payload.find({
      collection: 'kpr-schedule',
      where: { loan: { equals: loanId } },
      sort: 'monthNumber',
      limit: 300,
      depth: 0,
    })
    const schedule = scheduleRes.docs

    // Fetch rate tiers
    const tiersRes = await req.payload.find({
      collection: 'kpr-rate-tiers',
      where: { loan: { equals: loanId } },
      sort: 'tierOrder',
      limit: 10,
      depth: 0,
    })
    const tiers = tiersRes.docs

    const targetEntry = schedule.find((s: any) => s.monthNumber === targetMonth)

    if (!targetEntry) {
      return Response.json({ error: `Schedule entry for month ${targetMonth} not found` }, { status: 404 })
    }

    const outstandingBalance = targetEntry.outstandingBalance

    // Determine penalty
    const isBeforeMinTenor = targetMonth < (loan.minTenorMonths || 36)
    const penaltyPct = isBeforeMinTenor
      ? loan.penaltyBeforeMinTenor || 10
      : loan.penaltyAfterMinTenor || 2.5

    const penaltyAmount = Math.round(outstandingBalance * (penaltyPct / 100))
    const totalToPayBank = outstandingBalance + penaltyAmount

    // Already paid up to targetMonth
    const alreadyPaid = schedule
      .filter((s: any) => s.monthNumber <= targetMonth)
      .reduce((sum: number, s: any) => sum + (s.paidAmount || s.totalInstallment), 0)

    // Total interest that would have been paid without early payoff
    const fullTotalPayments = schedule.reduce(
      (sum: number, s: any) => sum + s.totalInstallment,
      0,
    )
    const grandTotal = alreadyPaid + totalToPayBank
    const savingsVsFull = fullTotalPayments - grandTotal

    // Break-even: how many months of interest saved to recoup the penalty
    const currentScheduleEntry = schedule.find((s: any) => s.monthNumber === targetMonth)
    const monthlyInterest = currentScheduleEntry
      ? currentScheduleEntry.interestPortion
      : Math.round(outstandingBalance * getRateForMonth(tiers, targetMonth).rate / 100 / 12)

    const breakEvenMonths = monthlyInterest > 0 ? Math.ceil(penaltyAmount / monthlyInterest) : 0

    return Response.json({
      loanId,
      targetMonth,
      outstandingBalance,
      penaltyPct,
      penaltyAmount,
      totalToPayBank,
      alreadyPaid,
      grandTotal,
      fullTotalPayments,
      savingsVsFull,
      breakEvenMonths,
      isBeforeMinTenor,
    })
  } catch (err: any) {
    console.error('[KPR Early Payoff Error]', err)
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// ─── 3. POST /api/kpr/simulate/extra-payment ─────────────────────────────────

const extraPaymentHandler = async (req: PayloadRequest) => {
  try {
    const body = await req.json?.() ?? {}
    const { loanId, monthlyExtra, startMonth } = body

    if (!loanId || monthlyExtra == null || !startMonth) {
      return Response.json(
        { error: 'loanId, monthlyExtra, and startMonth are required' },
        { status: 400 },
      )
    }

    // Fetch loan
    const loans = await req.payload.find({
      collection: 'kpr-loans',
      where: { id: { equals: loanId } },
      limit: 1,
      depth: 0,
    })

    if (!loans.docs.length) {
      return Response.json({ error: 'Loan not found' }, { status: 404 })
    }

    const loan = loans.docs[0]

    // Fetch schedule
    const scheduleRes = await req.payload.find({
      collection: 'kpr-schedule',
      where: { loan: { equals: loanId } },
      sort: 'monthNumber',
      limit: 300,
      depth: 0,
    })
    const schedule = scheduleRes.docs

    // Fetch rate tiers
    const tiersRes = await req.payload.find({
      collection: 'kpr-rate-tiers',
      where: { loan: { equals: loanId } },
      sort: 'tierOrder',
      limit: 10,
      depth: 0,
    })
    const tiers = tiersRes.docs

    // Starting balance from schedule
    const startEntry = schedule.find((s: any) => s.monthNumber === startMonth)
    if (!startEntry) {
      return Response.json({ error: `Schedule entry for month ${startMonth} not found` }, { status: 404 })
    }

    let balance = startEntry.outstandingBalance
    let newMonth = startMonth
    const originalTenor = loan.tenorMonths

    // Simulate: continue from startMonth with extra payment applied to principal
    while (balance > 0 && newMonth <= originalTenor + 120) {
      const { rate, installment } = getRateForMonth(tiers, newMonth)
      const monthlyRate = rate / 100 / 12

      let interest = Math.round(balance * monthlyRate)
      let principal = installment - interest + (newMonth >= startMonth ? monthlyExtra : 0)

      if (principal > balance) {
        principal = balance
      }

      balance = Math.max(0, balance - principal)
      newMonth++

      if (balance <= 0) break
    }

    const newTenorMonths = newMonth - 1
    const monthsSaved = originalTenor - newTenorMonths

    // Calculate total payments with extra
    const paidBeforeExtra = schedule
      .filter((s: any) => s.monthNumber < startMonth)
      .reduce((sum: number, s: any) => sum + s.totalInstallment, 0)

    const { installment: currentInstallment } = getRateForMonth(tiers, startMonth)
    const monthsWithExtra = newTenorMonths - startMonth + 1
    const paidDuringExtra = monthsWithExtra * (currentInstallment + monthlyExtra)

    const totalPaidWithExtra = paidBeforeExtra + paidDuringExtra

    // Total paid without extra (original schedule)
    const totalPaidOriginal = schedule.reduce(
      (sum: number, s: any) => sum + s.totalInstallment,
      0,
    )

    const interestSaved = totalPaidOriginal - totalPaidWithExtra

    return Response.json({
      loanId,
      monthlyExtra,
      startMonth,
      originalTenor,
      newTenorMonths,
      monthsSaved,
      interestSaved: Math.round(interestSaved),
      totalPaidOriginal: Math.round(totalPaidOriginal),
      totalPaidWithExtra: Math.round(totalPaidWithExtra),
    })
  } catch (err: any) {
    console.error('[KPR Extra Payment Error]', err)
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// ─── 4. GET /api/kpr/insights ─────────────────────────────────────────────────

const insightsHandler = async (req: PayloadRequest) => {
  try {
    const url = new URL(req.url!)
    const loanId = url.searchParams.get('loanId')

    if (!loanId) {
      return Response.json({ error: 'loanId query parameter is required' }, { status: 400 })
    }

    // Fetch loan
    const loans = await req.payload.find({
      collection: 'kpr-loans',
      where: { id: { equals: loanId } },
      limit: 1,
      depth: 0,
    })

    if (!loans.docs.length) {
      return Response.json({ error: 'Loan not found' }, { status: 404 })
    }

    const loan = loans.docs[0]

    // Fetch rate tiers
    const tiersRes = await req.payload.find({
      collection: 'kpr-rate-tiers',
      where: { loan: { equals: loanId } },
      sort: 'tierOrder',
      limit: 10,
      depth: 0,
    })
    const tiers = tiersRes.docs

    // Fetch schedule
    const scheduleRes = await req.payload.find({
      collection: 'kpr-schedule',
      where: { loan: { equals: loanId } },
      sort: 'monthNumber',
      limit: 300,
      depth: 0,
    })
    const schedule = scheduleRes.docs

    const now = new Date()
    const firstPayment = new Date(loan.firstPayment)
    const currentMonth = Math.max(1, monthsBetween(firstOfMonth(firstPayment), firstOfMonth(now)) + 1)
    const currentEntry = schedule.find((s: any) => s.monthNumber === currentMonth)
    const outstandingBalance = currentEntry ? currentEntry.outstandingBalance : loan.loanAmount

    const totalInterestPaid = schedule
      .filter((s: any) => s.monthNumber <= currentMonth)
      .reduce((sum: number, s: any) => sum + s.interestPortion, 0)

    const totalInterestFull = schedule.reduce(
      (sum: number, s: any) => sum + s.interestPortion,
      0,
    )

    // ── Milestones ──────────────────────────────────────────────────────────
    const milestones: Array<{ month: number; label: string; type: string }> = []

    // Rate tier changes
    tiers.forEach((tier: any) => {
      milestones.push({
        month: tier.startMonth,
        label: `Suku bunga berubah ke ${tier.ratePct}% (angsuran Rp ${tier.installment.toLocaleString('id-ID')})`,
        type: 'rate_change',
      })
    })

    // Penalty threshold
    const minTenor = loan.minTenorMonths || 36
    milestones.push({
      month: minTenor,
      label: `Penalti pelunasan turun dari ${loan.penaltyBeforeMinTenor || 10}% ke ${loan.penaltyAfterMinTenor || 2.5}%`,
      type: 'penalty_change',
    })

    // Percentage milestones (25%, 50%, 75% paid)
    const principalMilestones = [25, 50, 75]
    for (const pct of principalMilestones) {
      const targetPrincipal = loan.loanAmount * (pct / 100)
      let cumPrincipal = 0
      for (const entry of schedule) {
        cumPrincipal += entry.principalPortion
        if (cumPrincipal >= targetPrincipal) {
          milestones.push({
            month: entry.monthNumber,
            label: `${pct}% pokok terbayar`,
            type: 'progress',
          })
          break
        }
      }
    }

    milestones.sort((a, b) => a.month - b.month)

    // ── Opportunity Cost Analysis ───────────────────────────────────────────
    const investments = [
      { name: 'Deposito', annualRate: 5.2 },
      { name: 'Obligasi', annualRate: 6.5 },
      { name: 'Reksadana', annualRate: 10.0 },
    ]

    const opportunityCosts = investments.map((inv) => {
      // If the outstanding balance were invested instead of being used to prepay KPR
      const investmentEarnings = Math.round(
        outstandingBalance * (inv.annualRate / 100) * ((loan.tenorMonths - currentMonth) / 12),
      )

      const kprInterestRemaining = schedule
        .filter((s: any) => s.monthNumber > currentMonth)
        .reduce((sum: number, s: any) => sum + s.interestPortion, 0)

      // Effective KPR cost comparison
      const { rate: currentRate } = getRateForMonth(tiers, currentMonth)

      return {
        investment: inv.name,
        annualRate: inv.annualRate,
        hypotheticalEarnings: investmentEarnings,
        kprInterestRemaining,
        verdict:
          currentRate > inv.annualRate
            ? `Bayar KPR lebih menguntungkan (bunga KPR ${currentRate}% > imbalan ${inv.name} ${inv.annualRate}%)`
            : `Investasi ${inv.name} lebih menguntungkan (imbalan ${inv.annualRate}% > bunga KPR ${currentRate}%)`,
      }
    })

    // ── Recommendations ─────────────────────────────────────────────────────
    const { rate: currentRate } = getRateForMonth(tiers, currentMonth)
    const recommendations: string[] = []

    if (currentMonth < minTenor) {
      recommendations.push(
        `Tunggu hingga bulan ke-${minTenor} untuk pelunasan dipercepat agar penalti turun ke ${loan.penaltyAfterMinTenor || 2.5}%.`,
      )
    } else {
      recommendations.push(
        `Anda sudah melewati tenor minimum (${minTenor} bulan). Penalti pelunasan hanya ${loan.penaltyAfterMinTenor || 2.5}%.`,
      )
    }

    // Check if rate will increase
    const nextTier = tiers.find((t: any) => t.startMonth > currentMonth)
    if (nextTier && nextTier.ratePct > currentRate) {
      const monthsAway = nextTier.startMonth - currentMonth
      recommendations.push(
        `Suku bunga akan naik ke ${nextTier.ratePct}% dalam ${monthsAway} bulan. Pertimbangkan pembayaran ekstra sekarang untuk mengurangi pokok.`,
      )
    }

    // Extra payment recommendation
    const totalInterestPctOfLoan = Math.round((totalInterestFull / loan.loanAmount) * 100)
    recommendations.push(
      `Total bunga selama tenor: Rp ${totalInterestFull.toLocaleString('id-ID')} (${totalInterestPctOfLoan}% dari pokok pinjaman).`,
    )

    if (currentRate > 7) {
      recommendations.push(
        `Dengan suku bunga ${currentRate}%, pembayaran ekstra Rp 500.000/bulan dapat menghemat bunga secara signifikan. Gunakan endpoint /api/kpr/simulate/extra-payment untuk simulasi.`,
      )
    }

    return Response.json({
      loanId,
      currentMonth,
      outstandingBalance,
      totalInterestPaidSoFar: totalInterestPaid,
      totalInterestFullTenor: totalInterestFull,
      milestones,
      opportunityCosts,
      recommendations,
    })
  } catch (err: any) {
    console.error('[KPR Insights Error]', err)
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// ─── 5. POST /api/kpr/seed ────────────────────────────────────────────────────

const seedHandler = async (req: PayloadRequest) => {
  try {
    // Check if loan already exists
    const existing = await req.payload.find({
      collection: 'kpr-loans',
      where: { borrowerName: { equals: 'Fachrul Dani Prasetya' } },
      limit: 1,
      depth: 0,
    })

    let loan: any

    if (existing.docs.length > 0) {
      // Delete old data
      loan = existing.docs[0]

      // Delete existing schedule
      const oldSchedule = await req.payload.find({
        collection: 'kpr-schedule',
        where: { loan: { equals: loan.id } },
        limit: 300,
        depth: 0,
      })
      for (const entry of oldSchedule.docs) {
        await req.payload.delete({ collection: 'kpr-schedule', id: entry.id })
      }

      // Delete existing tiers
      const oldTiers = await req.payload.find({
        collection: 'kpr-rate-tiers',
        where: { loan: { equals: loan.id } },
        limit: 10,
        depth: 0,
      })
      for (const tier of oldTiers.docs) {
        await req.payload.delete({ collection: 'kpr-rate-tiers', id: tier.id })
      }

      // Update loan
      loan = await req.payload.update({
        collection: 'kpr-loans',
        id: loan.id,
        data: {
          borrowerName: 'Fachrul Dani Prasetya',
          bankName: 'BRI',
          loanAmount: 415000000,
          housePrice: 500000000,
          downPayment: 85000000,
          tenorMonths: 240,
          firstPayment: '2023-11-01T00:00:00.000Z',
          penaltyBeforeMinTenor: 10,
          penaltyAfterMinTenor: 2.5,
          minTenorMonths: 36,
          minPartialPrepayment: 6,
        },
      })
    } else {
      // Create loan
      loan = await req.payload.create({
        collection: 'kpr-loans',
        data: {
          borrowerName: 'Fachrul Dani Prasetya',
          bankName: 'BRI',
          loanAmount: 415000000,
          housePrice: 500000000,
          downPayment: 85000000,
          tenorMonths: 240,
          firstPayment: '2023-11-01T00:00:00.000Z',
          penaltyBeforeMinTenor: 10,
          penaltyAfterMinTenor: 2.5,
          minTenorMonths: 36,
          minPartialPrepayment: 6,
        },
      })
    }

    // ── Create rate tiers ─────────────────────────────────────────────────
    const tierData = [
      { tierOrder: 1, startMonth: 1, endMonth: 36, ratePct: 4.75, installment: 2681900 },
      { tierOrder: 2, startMonth: 37, endMonth: 72, ratePct: 8.0, installment: 3367400 },
      { tierOrder: 3, startMonth: 73, endMonth: 240, ratePct: 10.25, installment: 3815600 },
    ]

    const createdTiers: any[] = []
    for (const tier of tierData) {
      const created = await req.payload.create({
        collection: 'kpr-rate-tiers',
        data: {
          loan: loan.id,
          ...tier,
        },
      })
      createdTiers.push(created)
    }

    // ── Generate and create schedule entries ──────────────────────────────
    const firstPayment = new Date('2023-11-01')
    const scheduleEntries = generateSchedule(
      415000000,
      firstPayment,
      tierData,
      240,
    )

    // Calculate current month to mark paid entries
    const now = new Date()
    const currentMonth = Math.max(1, monthsBetween(firstPayment, now) + 1)

    // Create in batches of 50 for performance
    const BATCH_SIZE = 50
    let createdCount = 0

    for (let i = 0; i < scheduleEntries.length; i += BATCH_SIZE) {
      const batch = scheduleEntries.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map((entry) => {
          const entryDate = new Date(entry.calendarDate)
          const isPaid = entry.monthNumber < currentMonth
          return req.payload.create({
            collection: 'kpr-schedule',
            data: {
              loan: loan.id,
              ...entry,
              isPaid,
              paidDate: isPaid ? entry.calendarDate : undefined,
              paidAmount: isPaid ? entry.totalInstallment : undefined,
            },
          })
        }),
      )
      createdCount += batch.length
    }

    return Response.json({
      success: true,
      message: 'KPR data seeded successfully',
      loan: {
        id: loan.id,
        borrowerName: loan.borrowerName,
        bankName: loan.bankName,
        loanAmount: loan.loanAmount,
        tenorMonths: loan.tenorMonths,
      },
      rateTiers: createdTiers.map((t) => ({
        id: t.id,
        tierOrder: t.tierOrder,
        startMonth: t.startMonth,
        endMonth: t.endMonth,
        ratePct: t.ratePct,
        installment: t.installment,
      })),
      scheduleEntriesCreated: createdCount,
    })
  } catch (err: any) {
    console.error('[KPR Seed Error]', err)
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// ─── Export endpoints array ───────────────────────────────────────────────────

export const kprEndpoints = [
  {
    path: '/kpr/status',
    method: 'get' as const,
    handler: statusHandler,
  },
  {
    path: '/kpr/simulate/early-payoff',
    method: 'post' as const,
    handler: earlyPayoffHandler,
  },
  {
    path: '/kpr/simulate/extra-payment',
    method: 'post' as const,
    handler: extraPaymentHandler,
  },
  {
    path: '/kpr/insights',
    method: 'get' as const,
    handler: insightsHandler,
  },
  {
    path: '/kpr/seed',
    method: 'post' as const,
    handler: seedHandler,
  },
]
