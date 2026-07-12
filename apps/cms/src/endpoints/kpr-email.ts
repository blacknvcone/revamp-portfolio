/**
 * KPR Email Endpoints for Monetalis
 *
 * Provides payment reminder and monthly insight summary email sending
 * via Nodemailer + Google SMTP. Uses Payload CMS 3.x local API.
 */

import type { PayloadRequest } from 'payload'
import nodemailer from 'nodemailer'

// ─── SMTP Transporter ────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Get all user emails for a loan ─────────────────────────────────────────
async function getLoanUserEmails(payload: any, loanId: string): Promise<string[]> {
  // Get emails from monetalis-users linked to this loan
  const users = await payload.find({
    collection: 'monetalis-users',
    where: {
      and: [
        { loan: { equals: loanId } },
        { isActive: { equals: true } },
      ],
    },
    limit: 100,
    depth: 0,
  })
  return users.docs.map((u: any) => u.email).filter(Boolean)
}


function getRateForMonth(
  tiers: any[],
  month: number,
): { rate: number; installment: number; tier: any } {
  const tier = tiers.find((t: any) => month >= t.startMonth && month <= t.endMonth)
  if (!tier) {
    const last = tiers[tiers.length - 1]
    return { rate: last.ratePct, installment: last.installment, tier: last }
  }
  return { rate: tier.ratePct, installment: tier.installment, tier }
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function formatMonthYear(d: Date): string {
  return `${INDONESIAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}

// ─── Email HTML Templates ────────────────────────────────────────────────────

function paymentReminderHTML(params: {
  borrowerName: string
  bankName: string
  monthYear: string
  dueDate: string
  amount: number
  principalPortion: number
  interestPortion: number
  interestRate: number
  outstandingBalance: number
  progressPct: number
  monthNumber: number
  tenorMonths: number
}): string {
  const {
    borrowerName,
    bankName,
    monthYear,
    dueDate,
    amount,
    principalPortion,
    interestPortion,
    interestRate,
    outstandingBalance,
    progressPct,
    monthNumber,
    tenorMonths,
  } = params

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengingat Angsuran KPR</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a56db,#3b82f6);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">MONETALIS</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;">KPR MANAGEMENT</p>
            </td>
          </tr>
          <!-- Intro -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">🔔 Pengingat Angsuran</h2>
              <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
                Halo <strong style="color:#1e293b;">${borrowerName}</strong>,<br>
                Berikut adalah pengingat angsuran KPR Anda di <strong>${bankName}</strong> untuk bulan <strong>${monthYear}</strong>.
              </p>
            </td>
          </tr>
          <!-- Due Date Banner -->
          <tr>
            <td style="padding:24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border:2px solid #bfdbfe;border-radius:10px;">
                <tr>
                  <td align="center" style="padding:20px;">
                    <p style="margin:0 0 4px;color:#1d4ed8;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Jatuh Tempo</p>
                    <p style="margin:0;color:#1e3a8a;font-size:22px;font-weight:700;">${dueDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Amount Highlight -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                <tr>
                  <td align="center" style="padding:24px;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:13px;">Total Angsuran Bulan Ini</p>
                    <p style="margin:0;color:#1a56db;font-size:32px;font-weight:800;">${formatRupiah(amount)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Breakdown -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 20px;background-color:#f8fafc;border-bottom:1px solid #e2e8f0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#64748b;font-size:13px;">Pokok</td>
                        <td align="right" style="color:#1e293b;font-size:14px;font-weight:600;">${formatRupiah(principalPortion)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#64748b;font-size:13px;">Bunga (${interestRate}%)</td>
                        <td align="right" style="color:#dc2626;font-size:14px;font-weight:600;">${formatRupiah(interestPortion)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;background-color:#f0fdf4;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#15803d;font-size:13px;font-weight:600;">Sisa Pokok</td>
                        <td align="right" style="color:#15803d;font-size:14px;font-weight:700;">${formatRupiah(outstandingBalance)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Progress -->
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:600;letter-spacing:0.5px;">
                PROGRESS PEMBAYARAN &mdash; BULAN ${monthNumber}/${tenorMonths}
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#e2e8f0;border-radius:6px;height:12px;overflow:hidden;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(90deg,#1a56db,#3b82f6);border-radius:6px;height:12px;width:${progressPct * 3}px;"></td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding-left:12px;color:#1a56db;font-size:14px;font-weight:700;white-space:nowrap;">${progressPct}%</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                Email ini dikirim otomatis oleh <strong>Monetalis</strong>.<br>
                Pastikan pembayaran dilakukan sebelum tanggal jatuh tempo untuk menghindari denda keterlambatan.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function monthlyInsightHTML(params: {
  borrowerName: string
  bankName: string
  monthYear: string
  // This month
  installmentAmount: number
  principalPortion: number
  interestPortion: number
  interestRate: number
  outstandingBalance: number
  progressPct: number
  monthNumber: number
  tenorMonths: number
  // Cumulative
  totalPrincipalPaid: number
  totalInterestPaid: number
  cumulativeRatio: string
  // Milestones
  upcomingMilestones: Array<{ month: number; label: string; type: string }>
  // Recommendations
  recommendations: string[]
  // Quick stats
  totalInterestFullTenor: number
  currentPhase: string
  monthsUntilNextPhase: number | null
  nextPhaseRate: number | null
}): string {
  const {
    borrowerName,
    bankName,
    monthYear,
    installmentAmount,
    principalPortion,
    interestPortion,
    interestRate,
    outstandingBalance,
    progressPct,
    monthNumber,
    tenorMonths,
    totalPrincipalPaid,
    totalInterestPaid,
    cumulativeRatio,
    upcomingMilestones,
    recommendations,
    totalInterestFullTenor,
    currentPhase,
    monthsUntilNextPhase,
    nextPhaseRate,
  } = params

  const milestoneRows = upcomingMilestones.length > 0
    ? upcomingMilestones.slice(0, 5).map((m) => {
        const icon = m.type === 'rate_change' ? '📈' : m.type === 'penalty_change' ? '⚖️' : '🎯'
        return `<tr>
          <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#1e293b;font-size:13px;width:24px;vertical-align:top;">${icon}</td>
                <td style="color:#1e293b;font-size:13px;">${m.label}</td>
                <td align="right" style="color:#059669;font-size:12px;font-weight:600;white-space:nowrap;">Bulan ${m.month}</td>
              </tr>
            </table>
          </td>
        </tr>`
      }).join('\n')
    : `<tr><td style="padding:12px 16px;color:#94a3b8;font-size:13px;text-align:center;">Tidak ada milestone mendatang</td></tr>`

  const recommendationItems = recommendations.map((r) =>
    `<li style="margin-bottom:8px;color:#374151;font-size:13px;line-height:1.6;">${r}</li>`
  ).join('\n')

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Bulanan KPR</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#047857,#10b981);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">MONETALIS</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;">LAPORAN BULANAN KPR</p>
            </td>
          </tr>
          <!-- Intro -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700;">📊 Laporan Bulan ${monthYear}</h2>
              <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
                Halo <strong style="color:#1e293b;">${borrowerName}</strong>,<br>
                Berikut ringkasan KPR Anda di <strong>${bankName}</strong> untuk bulan ini.
              </p>
            </td>
          </tr>

          <!-- Section 1: Ringkasan Bulan Ini -->
          <tr>
            <td style="padding:24px 40px 0;">
              <h3 style="margin:0 0 16px;color:#047857;font-size:15px;font-weight:700;border-bottom:2px solid #d1fae5;padding-bottom:8px;">
                📋 Ringkasan Bulan Ini
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 20px;background-color:#f0fdf4;border-bottom:1px solid #d1fae5;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#15803d;font-size:13px;">Total Angsuran</td>
                        <td align="right" style="color:#047857;font-size:16px;font-weight:700;">${formatRupiah(installmentAmount)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;background-color:#ffffff;border-bottom:1px solid #f1f5f9;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#64748b;font-size:13px;">Pokok</td>
                        <td align="right" style="color:#1e293b;font-size:14px;font-weight:600;">${formatRupiah(principalPortion)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;background-color:#ffffff;border-bottom:1px solid #f1f5f9;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#64748b;font-size:13px;">Bunga (${interestRate}%)</td>
                        <td align="right" style="color:#dc2626;font-size:14px;font-weight:600;">${formatRupiah(interestPortion)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;background-color:#f8fafc;border-bottom:1px solid #f1f5f9;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#64748b;font-size:13px;">Sisa Pokok</td>
                        <td align="right" style="color:#1e293b;font-size:14px;font-weight:600;">${formatRupiah(outstandingBalance)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;background-color:#eff6ff;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#1d4ed8;font-size:13px;font-weight:600;">Progress Pelunasan</td>
                        <td align="right" style="color:#1d4ed8;font-size:16px;font-weight:800;">${progressPct}%</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Progress bar -->
              <div style="margin-top:12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#e2e8f0;border-radius:6px;height:10px;overflow:hidden;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background:linear-gradient(90deg,#047857,#10b981);border-radius:6px;height:10px;width:${progressPct * 3}px;"></td>
                        </tr>
                      </table>
                    </td>
                    <td style="padding-left:8px;color:#64748b;font-size:11px;white-space:nowrap;">Bulan ${monthNumber}/${tenorMonths}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Section 2: Akumulasi Pembayaran -->
          <tr>
            <td style="padding:28px 40px 0;">
              <h3 style="margin:0 0 16px;color:#047857;font-size:15px;font-weight:700;border-bottom:2px solid #d1fae5;padding-bottom:8px;">
                💰 Akumulasi Pembayaran
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 20px;background-color:#f0fdf4;border-bottom:1px solid #d1fae5;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#15803d;font-size:13px;">Total Pokok Terbayar</td>
                        <td align="right" style="color:#047857;font-size:14px;font-weight:700;">${formatRupiah(totalPrincipalPaid)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;background-color:#ffffff;border-bottom:1px solid #f1f5f9;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#64748b;font-size:13px;">Total Bunga Terbayar</td>
                        <td align="right" style="color:#dc2626;font-size:14px;font-weight:600;">${formatRupiah(totalInterestPaid)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;background-color:#f8fafc;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#64748b;font-size:13px;">Rasio Bunga : Pokok</td>
                        <td align="right" style="color:#7c3aed;font-size:14px;font-weight:700;">${cumulativeRatio}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section 3: Milestone Mendatang -->
          <tr>
            <td style="padding:28px 40px 0;">
              <h3 style="margin:0 0 16px;color:#047857;font-size:15px;font-weight:700;border-bottom:2px solid #d1fae5;padding-bottom:8px;">
                🏁 Milestone Mendatang
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                ${milestoneRows}
              </table>
            </td>
          </tr>

          <!-- Section 4: Rekomendasi Strategi -->
          <tr>
            <td style="padding:28px 40px 0;">
              <h3 style="margin:0 0 16px;color:#047857;font-size:15px;font-weight:700;border-bottom:2px solid #d1fae5;padding-bottom:8px;">
                💡 Rekomendasi Strategi
              </h3>
              <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;">
                <ul style="margin:0;padding-left:20px;">
                  ${recommendationItems}
                </ul>
              </div>
            </td>
          </tr>

          <!-- Section 5: Quick Stats -->
          <tr>
            <td style="padding:28px 40px 0;">
              <h3 style="margin:0 0 16px;color:#047857;font-size:15px;font-weight:700;border-bottom:2px solid #d1fae5;padding-bottom:8px;">
                ⚡ Quick Stats
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 20px;background-color:#fef2f2;border-bottom:1px solid #fecaca;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#991b1b;font-size:13px;">Total Bunga Selama Tenor</td>
                        <td align="right" style="color:#dc2626;font-size:14px;font-weight:700;">${formatRupiah(totalInterestFullTenor)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;background-color:#ffffff;border-bottom:1px solid #f1f5f9;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#64748b;font-size:13px;">Fase Saat Ini</td>
                        <td align="right" style="color:#7c3aed;font-size:14px;font-weight:600;">${currentPhase}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${monthsUntilNextPhase !== null ? `
                <tr>
                  <td style="padding:14px 20px;background-color:#f8fafc;border-bottom:1px solid #f1f5f9;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#64748b;font-size:13px;">Perubahan Bunga Berikutnya</td>
                        <td align="right" style="color:#ea580c;font-size:14px;font-weight:600;">${monthsUntilNextPhase} bulan lagi → ${nextPhaseRate}%</td>
                      </tr>
                    </table>
                  </td>
                </tr>` : ''}
                <tr>
                  <td style="padding:14px 20px;background-color:#f0fdf4;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#15803d;font-size:13px;">Suku Bunga Aktif</td>
                        <td align="right" style="color:#047857;font-size:16px;font-weight:800;">${interestRate}% / tahun</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#ecfdf5;border:2px solid #a7f3d0;border-radius:10px;padding:20px;">
                    <p style="margin:0;color:#065f46;font-size:14px;font-weight:600;">
                      Ingin melunasi lebih cepat? Gunakan simulasi pembayaran ekstra di dashboard Monetalis Anda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 4px;color:#047857;font-size:14px;font-weight:700;">MONETALIS</p>
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                Email ini dikirim otomatis oleh Monetalis KPR Management.<br>
                Data dihitung berdasarkan jadwal amortisasi tercatat.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── 1. POST /api/kpr/send-payment-reminder ─────────────────────────────────

const sendPaymentReminderHandler = async (req: PayloadRequest) => {
  try {
    const body = await req.json?.() ?? {}
    const { loanId, reminderId } = body

    if (!loanId || !reminderId) {
      return Response.json(
        { error: 'loanId and reminderId are required' },
        { status: 400 },
      )
    }

    // Fetch reminder config
    const reminders = await req.payload.find({
      collection: 'kpr-reminders',
      where: { id: { equals: reminderId } },
      limit: 1,
      depth: 0,
    })

    if (!reminders.docs.length) {
      return Response.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const reminder = reminders.docs[0]

    if (!reminder.isActive) {
      return Response.json({ error: 'Reminder is not active' }, { status: 400 })
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
    const currentMonth = Math.max(
      1,
      monthsBetween(firstOfMonth(firstPayment), firstOfMonth(now)) + 1,
    )

    // Find the next unpaid schedule entry (current or next month)
    const nextUnpaid =
      schedule.find(
        (s: any) => s.monthNumber === currentMonth && !s.isPaid,
      ) || schedule.find((s: any) => s.monthNumber === currentMonth + 1 && !s.isPaid)

    if (!nextUnpaid) {
      return Response.json(
        { error: 'No upcoming unpaid schedule entry found' },
        { status: 404 },
      )
    }

    const dueDate = new Date(nextUnpaid.calendarDate)
    const monthYear = formatMonthYear(dueDate)
    const outstandingBalance =
      nextUnpaid.outstandingBalance ||
      schedule.find((s: any) => s.monthNumber === nextUnpaid.monthNumber - 1)
        ?.outstandingBalance ||
      loan.loanAmount

    const { rate: interestRate } = getRateForMonth(tiers, nextUnpaid.monthNumber)
    const progressPct =
      Math.round(
        ((loan.loanAmount - outstandingBalance) / loan.loanAmount) * 100 * 100,
      ) / 100

    // Build HTML email
    const html = paymentReminderHTML({
      borrowerName: loan.borrowerName,
      bankName: loan.bankName,
      monthYear,
      dueDate: fmtDate(dueDate),
      amount: nextUnpaid.totalInstallment,
      principalPortion: nextUnpaid.principalPortion,
      interestPortion: nextUnpaid.interestPortion,
      interestRate,
      outstandingBalance,
      progressPct,
      monthNumber: nextUnpaid.monthNumber,
      tenorMonths: loan.tenorMonths,
    })

    // Get all users for this loan
    // loanId already available from body destructuring
    const recipients = await getLoanUserEmails(req.payload, loanId)

    if (recipients.length === 0) {
      return Response.json({ error: 'No active users found for this loan' }, { status: 404 })
    }

    // Send email to all users
    const results = []
    for (const email of recipients) {
      const info = await transporter.sendMail({
        from: `"Monetalis" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `🔔 Pengingat Angsuran KPR - ${monthYear}`,
        html,
      })
      results.push({ email, messageId: info.messageId })
    }

    // Update last sent timestamp
    await req.payload.update({
      collection: 'kpr-reminders',
      id: reminderId,
      data: { lastPaymentReminderSent: now.toISOString() },
    })

    return Response.json({
      success: true,
      message: `Payment reminder sent to ${recipients.length} user(s)`,
      recipients: results,
      monthYear,
      amount: nextUnpaid.totalInstallment,
    })
  } catch (err: any) {
    console.error('[KPR Email - Payment Reminder Error]', err)
    return Response.json(
      { error: err.message || 'Internal server error' },
      { status: 500 },
    )
  }
}

// ─── 2. POST /api/kpr/send-monthly-insight ───────────────────────────────────

const sendMonthlyInsightHandler = async (req: PayloadRequest) => {
  try {
    const body = await req.json?.() ?? {}
    const { loanId, reminderId } = body

    if (!loanId || !reminderId) {
      return Response.json(
        { error: 'loanId and reminderId are required' },
        { status: 400 },
      )
    }

    // Fetch reminder config
    const reminders = await req.payload.find({
      collection: 'kpr-reminders',
      where: { id: { equals: reminderId } },
      limit: 1,
      depth: 0,
    })

    if (!reminders.docs.length) {
      return Response.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const reminder = reminders.docs[0]

    if (!reminder.isActive) {
      return Response.json({ error: 'Reminder is not active' }, { status: 400 })
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
    const currentMonth = Math.max(
      1,
      monthsBetween(firstOfMonth(firstPayment), firstOfMonth(now)) + 1,
    )

    const currentEntry = schedule.find((s: any) => s.monthNumber === currentMonth)
    const outstandingBalance = currentEntry
      ? currentEntry.outstandingBalance
      : schedule.length > 0
        ? schedule[schedule.length - 1].outstandingBalance
        : loan.loanAmount

    // ── Cumulative stats ─────────────────────────────────────────────────
    const totalPrincipalPaid = schedule
      .filter((s: any) => s.monthNumber <= currentMonth)
      .reduce((sum: number, s: any) => sum + s.principalPortion, 0)

    const totalInterestPaid = schedule
      .filter((s: any) => s.monthNumber <= currentMonth)
      .reduce((sum: number, s: any) => sum + s.interestPortion, 0)

    const totalInterestFull = schedule.reduce(
      (sum: number, s: any) => sum + s.interestPortion,
      0,
    )

    const cumulativeRatio =
      totalPrincipalPaid > 0
        ? `1 : ${(totalInterestPaid / totalPrincipalPaid).toFixed(2)}`
        : '1 : 0'

    // ── Current phase & next rate change ─────────────────────────────────
    const { rate: currentRate, tier: currentTier } = getRateForMonth(tiers, currentMonth)
    const currentPhase = currentTier
      ? `Bulan ${currentTier.startMonth}-${currentTier.endMonth} (${currentTier.ratePct}%)`
      : 'Unknown'

    let monthsUntilNextPhase: number | null = null
    let nextPhaseRate: number | null = null
    if (currentTier && currentMonth < currentTier.endMonth) {
      monthsUntilNextPhase = currentTier.endMonth - currentMonth
      const nextTier = tiers.find((t: any) => t.startMonth > currentMonth)
      nextPhaseRate = nextTier ? nextTier.ratePct : null
    }

    // ── Milestones ──────────────────────────────────────────────────────
    const milestones: Array<{ month: number; label: string; type: string }> = []

    // Rate tier changes
    tiers.forEach((tier: any) => {
      if (tier.startMonth > currentMonth) {
        milestones.push({
          month: tier.startMonth,
          label: `Suku bunga berubah ke ${tier.ratePct}% (angsuran ${formatRupiah(tier.installment)})`,
          type: 'rate_change',
        })
      }
    })

    // Penalty threshold
    const minTenor = loan.minTenorMonths || 36
    if (minTenor > currentMonth) {
      milestones.push({
        month: minTenor,
        label: `Penalti pelunasan turun ke ${loan.penaltyAfterMinTenor || 2.5}%`,
        type: 'penalty_change',
      })
    }

    // Percentage milestones
    const principalMilestones = [25, 50, 75]
    for (const pct of principalMilestones) {
      const targetPrincipal = loan.loanAmount * (pct / 100)
      let cumPrincipal = 0
      for (const entry of schedule) {
        cumPrincipal += entry.principalPortion
        if (cumPrincipal >= targetPrincipal && entry.monthNumber > currentMonth) {
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

    // ── Recommendations ─────────────────────────────────────────────────
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

    const nextTier = tiers.find((t: any) => t.startMonth > currentMonth)
    if (nextTier && nextTier.ratePct > currentRate) {
      const monthsAway = nextTier.startMonth - currentMonth
      recommendations.push(
        `Suku bunga akan naik ke ${nextTier.ratePct}% dalam ${monthsAway} bulan. Pertimbangkan pembayaran ekstra sekarang.`,
      )
    }

    const totalInterestPctOfLoan = Math.round((totalInterestFull / loan.loanAmount) * 100)
    recommendations.push(
      `Total bunga selama tenor: ${formatRupiah(totalInterestFull)} (${totalInterestPctOfLoan}% dari pokok pinjaman).`,
    )

    if (currentRate > 7) {
      recommendations.push(
        `Dengan suku bunga ${currentRate}%, pembayaran ekstra Rp 500.000/bulan dapat menghemat bunga secara signifikan.`,
      )
    }

    // ── Build current month data ────────────────────────────────────────
    const nextPayment = schedule.find(
      (s: any) => s.monthNumber === currentMonth && !s.isPaid,
    ) || schedule.find((s: any) => s.monthNumber === currentMonth + 1)

    const progressPct =
      Math.round(
        ((loan.loanAmount - outstandingBalance) / loan.loanAmount) * 100 * 100,
      ) / 100

    const monthYear = formatMonthYear(now)

    // Build HTML email
    const html = monthlyInsightHTML({
      borrowerName: loan.borrowerName,
      bankName: loan.bankName,
      monthYear,
      installmentAmount: nextPayment
        ? nextPayment.totalInstallment
        : 0,
      principalPortion: nextPayment ? nextPayment.principalPortion : 0,
      interestPortion: nextPayment ? nextPayment.interestPortion : 0,
      interestRate: currentRate,
      outstandingBalance,
      progressPct,
      monthNumber: currentMonth,
      tenorMonths: loan.tenorMonths,
      totalPrincipalPaid,
      totalInterestPaid,
      cumulativeRatio,
      upcomingMilestones: milestones.slice(0, 5),
      recommendations,
      totalInterestFullTenor: totalInterestFull,
      currentPhase: `Fase ${currentPhase} (${currentRate}%)`,

      monthsUntilNextPhase,
      nextPhaseRate,
    })

    // Get all users for this loan
    // loanId already available from body destructuring
    const recipients = await getLoanUserEmails(req.payload, loanId)

    if (recipients.length === 0) {
      return Response.json({ error: 'No active users found for this loan' }, { status: 404 })
    }

    // Send email to all users
    const results = []
    for (const email of recipients) {
      const info = await transporter.sendMail({
        from: `"Monetalis" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `📊 Laporan Bulanan KPR - ${monthYear}`,
        html,
      })
      results.push({ email, messageId: info.messageId })
    }

    // Update last sent timestamp
    await req.payload.update({
      collection: 'kpr-reminders',
      id: reminderId,
      data: { lastMonthlyInsightSent: now.toISOString() },
    })

    return Response.json({
      success: true,
      message: `Monthly insight sent to ${recipients.length} user(s)`,
      recipients: results,
      monthYear,
      progressPct,
      upcomingMilestones: milestones.slice(0, 5),
    })
  } catch (err: any) {
    console.error('[KPR Email - Monthly Insight Error]', err)
    return Response.json(
      { error: err.message || 'Internal server error' },
      { status: 500 },
    )
  }
}

// ─── Export endpoints array ──────────────────────────────────────────────────

export const kprEmailEndpoints = [
  {
    path: '/kpr/send-payment-reminder',
    method: 'post' as const,
    handler: sendPaymentReminderHandler,
  },
  {
    path: '/kpr/send-monthly-insight',
    method: 'post' as const,
    handler: sendMonthlyInsightHandler,
  },
]

// ─── Test endpoints: send to specific email ──────────────────────────────────

export const kprEmailTestEndpoints = [
  {
    path: '/kpr/send-payment-reminder-test',
    method: 'post' as const,
    handler: async (req: PayloadRequest) => {
      try {
        const body = await req.json?.() ?? {}
        const { email, loanId } = body
        if (!email || !loanId) {
          return Response.json({ error: 'email and loanId are required' }, { status: 400 })
        }

        const loans = await req.payload.find({
          collection: 'kpr-loans',
          where: { id: { equals: loanId } },
          limit: 1, depth: 0,
        })
        if (!loans.docs.length) return Response.json({ error: 'Loan not found' }, { status: 404 })

        const loan = loans.docs[0]
        const schedule = await req.payload.find({
          collection: 'kpr-schedule',
          where: { and: [{ loan: { equals: loanId } }, { isPaid: { equals: false } }] },
          sort: 'monthNumber', limit: 1, depth: 0,
        })
        if (!schedule.docs.length) return Response.json({ error: 'No unpaid entries' }, { status: 404 })

        const nextUnpaid = schedule.docs[0]
        const now = new Date()
        const monthYear = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        const dueDate = new Date(nextUnpaid.calendarDate)
        const outstandingBalance = nextUnpaid.outstandingBalance
        const progressPct = (((loan.loanAmount - outstandingBalance) / loan.loanAmount) * 100).toFixed(1)

        const html = paymentReminderHTML({
          borrowerName: loan.borrowerName,
          bankName: loan.bankName,
          monthYear,
          dueDate: fmtDate(dueDate),
          amount: nextUnpaid.totalInstallment,
          principalPortion: nextUnpaid.principalPortion,
          interestPortion: nextUnpaid.interestPortion,
          interestRate: nextUnpaid.interestRate,
          outstandingBalance,
          progressPct: Number(progressPct),
          monthNumber: nextUnpaid.monthNumber,
          tenorMonths: loan.tenorMonths,
        })

        const info = await transporter.sendMail({
          from: `"Monetalis" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `🔔 Pengingat Angsuran KPR - ${monthYear}`,
          html,
        })

        return Response.json({ success: true, message: 'Test payment reminder sent', messageId: info.messageId, recipient: email })
      } catch (err: any) {
        console.error('[KPR Email Test - Payment Reminder Error]', err)
        return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
      }
    },
  },
  {
    path: '/kpr/send-monthly-insight-test',
    method: 'post' as const,
    handler: async (req: PayloadRequest) => {
      try {
        const body = await req.json?.() ?? {}
        const { email, loanId } = body
        if (!email || !loanId) {
          return Response.json({ error: 'email and loanId are required' }, { status: 400 })
        }

        // Reuse the same logic as the main monthly insight handler
        const loans = await req.payload.find({
          collection: 'kpr-loans',
          where: { id: { equals: loanId } },
          limit: 1, depth: 0,
        })
        if (!loans.docs.length) return Response.json({ error: 'Loan not found' }, { status: 404 })

        const loan = loans.docs[0]
        const scheduleRes = await req.payload.find({
          collection: 'kpr-schedule',
          where: { loan: { equals: loanId } },
          sort: 'monthNumber', limit: 250, depth: 0,
        })
        const schedule = scheduleRes.docs

        const firstPayment = new Date(loan.firstPayment)
        const now = new Date()
        const currentMonth = monthsBetween(firstPayment, now) + 1
        const monthYear = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

        const paidEntries = schedule.filter((e: any) => e.isPaid)
        const unpaidEntries = schedule.filter((e: any) => !e.isPaid)
        const currentEntry = schedule.find((e: any) => e.monthNumber === currentMonth)
        const outstandingBalance = currentEntry ? currentEntry.outstandingBalance : schedule[schedule.length - 1]?.outstandingBalance || 0

        const totalPrincipalPaid = paidEntries.reduce((s: number, e: any) => s + e.principalPortion, 0)
        const totalInterestPaid = paidEntries.reduce((s: number, e: any) => s + e.interestPortion, 0)
        const totalPaid = totalPrincipalPaid + totalInterestPaid
        const progressPct = Number(((loan.loanAmount - outstandingBalance) / loan.loanAmount * 100).toFixed(1))

        const currentTier = schedule.find((e: any) => e.monthNumber === currentMonth)
        const currentRate = currentTier ? currentTier.interestRate : 0
        const currentPhase = currentMonth <= 36 ? 1 : currentMonth <= 72 ? 2 : 3
        const totalInterest20yr = schedule.reduce((s: number, e: any) => s + e.interestPortion, 0)

        const milestones: any[] = []
        if (currentMonth <= 36) milestones.push({ month: 36, label: 'Penalti pelunasan turun ke 2.5%', type: 'penalty_change' })
        if (currentMonth <= 37) milestones.push({ month: 37, label: `Suku bunga berubah ke 8% (angsuran Rp 3.367.400)`, type: 'rate_change' })
        if (currentMonth <= 73) milestones.push({ month: 73, label: `Suku bunga berubah ke 10.25% (angsuran Rp 3.815.600)`, type: 'rate_change' })
        const nextQuarter = Math.ceil(progressPct / 25) * 25
        if (nextQuarter <= 100) {
          const targetMonth = Math.ceil((loan.loanAmount * nextQuarter / 100) / (loan.loanAmount / 240))
          if (targetMonth > currentMonth) milestones.push({ month: targetMonth, label: `${nextQuarter}% pokok terbayar`, type: 'progress' })
        }

        const nextPhaseRate = currentPhase === 1 ? 8 : currentPhase === 2 ? 10.25 : null
        const nextPhaseMonth = currentPhase === 1 ? 37 : currentPhase === 2 ? 73 : null

        const html = monthlyInsightHTML({
          borrowerName: loan.borrowerName,
          bankName: loan.bankName,
          monthYear,
          installmentAmount: currentEntry ? currentEntry.totalInstallment : 0,
          principalPortion: currentEntry ? currentEntry.principalPortion : 0,
          interestPortion: currentEntry ? currentEntry.interestPortion : 0,
          interestRate: currentEntry ? currentEntry.interestRate : 0,
          outstandingBalance,
          progressPct,
          monthNumber: currentMonth,
          tenorMonths: loan.tenorMonths,
          totalPrincipalPaid,
          totalInterestPaid,
          cumulativeRatio: totalPrincipalPaid > 0 ? (totalInterestPaid / totalPrincipalPaid * 100).toFixed(1) + '%' : '0%',
          upcomingMilestones: milestones.slice(0, 5),
          recommendations: [
            progressPct < 10 ? 'Pertimbangkan pelunasan di akhir tahun ke-3 (Oktober 2026) untuk hemat 44%' : '',
            currentPhase >= 3 ? 'Bunga 10.25% lebih tinggi dari deposito. Prioritaskan pelunasan.' : '',
          ].filter(Boolean),
          totalInterestFullTenor: totalInterest20yr,
          currentPhase: `Fase ${currentPhase} (${currentRate}%)`,
          monthsUntilNextPhase: nextPhaseMonth ? nextPhaseMonth - currentMonth : null,
          nextPhaseRate: nextPhaseRate,
        })

        const info = await transporter.sendMail({
          from: `"Monetalis" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `📊 Laporan Bulanan KPR - ${monthYear}`,
          html,
        })

        return Response.json({ success: true, message: 'Test monthly insight sent', messageId: info.messageId, recipient: email })
      } catch (err: any) {
        console.error('[KPR Email Test - Monthly Insight Error]', err)
        return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
      }
    },
  },
]

