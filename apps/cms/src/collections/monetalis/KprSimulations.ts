import type { CollectionConfig } from 'payload';

export const KprSimulations: CollectionConfig = {
  slug: 'kpr-simulations',
  admin: {
    group: 'Monetalis',
    description: 'Skenario simulasi pembayaran yang tersimpan',
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
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nama Skenario',
    },
    {
      name: 'scenarioType',
      type: 'select',
      required: true,
      label: 'Tipe Skenario',
      options: [
        { label: 'Pelunasan Dipercepat (Full)', value: 'early_payoff' },
        { label: 'Pembayaran Ekstra', value: 'extra_payment' },
        { label: 'Refinancing', value: 'refinance' },
      ],
    },
    {
      name: 'params',
      type: 'json',
      required: true,
      label: 'Parameter',
      admin: { description: 'Input parameter simulasi (JSON)' },
    },
    {
      name: 'results',
      type: 'json',
      required: true,
      label: 'Hasil',
      admin: { description: 'Hasil perhitungan simulasi (JSON)' },
    },
  ],
};
