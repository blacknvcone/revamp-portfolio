import type { CollectionConfig } from 'payload';

export const KprSchedule: CollectionConfig = {
  slug: 'kpr-schedule',
  admin: {
    group: 'Monetalis',
    description: 'Jadwal angsuran 240 bulan (seeded from CSV)',
    listSearchableFields: ['calendarDate'],
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
      name: 'monthNumber',
      type: 'number',
      required: true,
      label: 'Bulan ke-',
    },
    {
      name: 'calendarDate',
      type: 'date',
      required: true,
      label: 'Tanggal',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'principalPortion',
          type: 'number',
          required: true,
          label: 'Angsuran Pokok (Rp)',
        },
        {
          name: 'interestPortion',
          type: 'number',
          required: true,
          label: 'Angsuran Bunga (Rp)',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'totalInstallment',
          type: 'number',
          required: true,
          label: 'Total Angsuran (Rp)',
        },
        {
          name: 'outstandingBalance',
          type: 'number',
          required: true,
          label: 'Saldo Pinjaman (Rp)',
        },
      ],
    },
    {
      name: 'interestRate',
      type: 'number',
      required: true,
      label: 'Suku Bunga (%)',
    },
    {
      type: 'collapsible',
      label: 'Status Pembayaran',
      fields: [
        {
          name: 'isPaid',
          type: 'checkbox',
          defaultValue: false,
          label: 'Sudah Dibayar',
        },
        {
          name: 'paidDate',
          type: 'date',
          label: 'Tanggal Bayar',
        },
        {
          name: 'paidAmount',
          type: 'number',
          label: 'Jumlah Dibayar (Rp)',
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Catatan',
        },
      ],
    },
  ],
  indexes: [
    {
      fields: ['loan', 'monthNumber'],
      unique: true,
    },
  ],
};
