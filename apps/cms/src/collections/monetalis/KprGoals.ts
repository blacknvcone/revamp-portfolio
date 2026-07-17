import type { CollectionConfig } from 'payload';

export const KprGoals: CollectionConfig = {
  slug: 'kpr-goals',
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  admin: {
    group: 'Monetalis',
    description: 'Konfigurasi target pelunasan KPR',
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
      name: 'targetDate',
      type: 'date',
      required: true,
      label: 'Tanggal Target Pelunasan',
    },
    {
      name: 'monthlyIncome',
      type: 'number',
      label: 'Pemasukan Bulanan (Rp)',
    },
    {
      name: 'monthlyExpenses',
      type: 'number',
      label: 'Pengeluaran Tetap Bulanan (Rp)',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Catatan',
    },
  ],
};
