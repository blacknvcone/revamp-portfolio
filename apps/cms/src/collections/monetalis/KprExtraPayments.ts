import type { CollectionConfig } from 'payload';
import { loanScopedAccess } from '@/access/monetalis';

export const KprExtraPayments: CollectionConfig = {
  slug: 'kpr-extra-payments',
  access: {
    ...loanScopedAccess('kpr-extra-payments'),
  },
  admin: {
    group: 'Monetalis',
    description: 'Log pembayaran ekstra / pelunasan sebagian',
  },
  fields: [
    {
      name: 'loan',
      type: 'relationship',
      relationTo: 'kpr-loans',
      required: true,
      label: 'Pinjaman',
    },
    {
      name: 'paymentDate',
      type: 'date',
      required: true,
      label: 'Tanggal Pembayaran',
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      label: 'Jumlah (Rp)',
    },
    {
      name: 'note',
      type: 'text',
      label: 'Catatan',
    },
  ],
};
