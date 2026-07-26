import type { CollectionConfig } from 'payload';
import { resolveMonetalisUser } from '@/middleware/logto-jwt';

/** Resolve user from Logto Bearer token or admin panel cookie */
async function resolveUser(req: any): Promise<{ loanId: string; role: string } | null> {
  // 1. Try Logto Bearer token
  const resolved = await resolveMonetalisUser(req as { headers: Headers }, req.payload);
  if (resolved) return resolved;

  // 2. Fallback: admin panel auth
  if (req.user) {
    const logtoSub = (req.user as any).logtoSub;
    if (!logtoSub) return null;
    try {
      const result = await req.payload.find({
        collection: 'monetalis-users',
        where: { logtoSub: { equals: logtoSub } },
        limit: 1, depth: 0,
      });
      if (result.docs.length === 0) return null;
      const mu = result.docs[0] as any;
      if (!mu.isActive) return null;
      const loanId = typeof mu.loan === 'object' ? mu.loan?.id : mu.loan;
      if (!loanId) return null;
      return { loanId, role: mu.role || 'viewer' };
    } catch { return null; }
  }
  return null;
}

export const KprLoans: CollectionConfig = {
  slug: 'kpr-loans',
  access: {
    read: async ({ req }) => {
      const user = await resolveUser(req);
      if (!user) return false;
      return { id: { equals: user.loanId } } as import('payload').Where;
    },
    create: async ({ req }) => {
      const user = await resolveUser(req);
      return user?.role === 'admin';
    },
    update: async ({ req, id }) => {
      const user = await resolveUser(req);
      if (!user || user.role !== 'admin') return false;
      return id === user.loanId;
    },
    delete: async ({ req, id }) => {
      const user = await resolveUser(req);
      if (!user || user.role !== 'admin') return false;
      return id === user.loanId;
    },
  },
  admin: {
    useAsTitle: 'borrowerName',
    group: 'Monetalis',
    description: 'Metadata pinjaman KPR',
  },
  fields: [
    {
      name: 'borrowerName',
      type: 'text',
      required: true,
      label: 'Nama Peminjam',
    },
    {
      name: 'coBorrower',
      type: 'text',
      label: 'Co-Borrower',
    },
    {
      name: 'bankName',
      type: 'text',
      required: true,
      defaultValue: 'BRI',
      label: 'Nama Bank',
    },
    {
      name: 'branch',
      type: 'text',
      label: 'Cabang',
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Pinjaman',
          fields: [
            {
              name: 'loanAmount',
              type: 'number',
              required: true,
              min: 0,
              label: 'Jumlah Pinjaman (Rp)',
            },
            {
              name: 'housePrice',
              type: 'number',
              required: true,
              label: 'Harga Rumah (Rp)',
            },
            {
              name: 'downPayment',
              type: 'number',
              required: true,
              label: 'Uang Muka (Rp)',
            },
            {
              name: 'tenorMonths',
              type: 'number',
              required: true,
              defaultValue: 240,
              label: 'Tenor (bulan)',
            },
            {
              name: 'firstPayment',
              type: 'date',
              required: true,
              label: 'Pembayaran Pertama',
            },
          ],
        },
        {
          label: 'Dokumen',
          fields: [
            {
              name: 'offeringLetterRef',
              type: 'text',
              label: 'No. Offering Letter',
            },
            {
              name: 'propertyAddress',
              type: 'textarea',
              label: 'Alamat Properti',
            },
            {
              name: 'certificateNo',
              type: 'text',
              label: 'No. Sertifikat',
            },
            {
              name: 'collateralValue',
              type: 'number',
              label: 'Nilai Pengikatan Agunan (Rp)',
            },
          ],
        },
        {
          label: 'Aturan Penalti',
          fields: [
            {
              name: 'penaltyBeforeMinTenor',
              type: 'number',
              defaultValue: 10,
              label: 'Penalti sebelum tenor min (%)',
              admin: { description: 'Contoh: 10 = 10%' },
            },
            {
              name: 'penaltyAfterMinTenor',
              type: 'number',
              defaultValue: 2.5,
              label: 'Penalti setelah tenor min (%)',
              admin: { description: 'Contoh: 2.5 = 2.5%' },
            },
            {
              name: 'minTenorMonths',
              type: 'number',
              defaultValue: 36,
              label: 'Tenor minimum (bulan)',
              admin: { description: 'Setelah periode ini, penalti turun' },
            },
            {
              name: 'minPartialPrepayment',
              type: 'number',
              defaultValue: 6,
              label: 'Min pelunasan sebagian (x angsuran)',
            },
          ],
        },
      ],
    },
  ],
};
