import type { CollectionConfig } from 'payload';

export const KprRateTiers: CollectionConfig = {
  slug: 'kpr-rate-tiers',
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  admin: {
    group: 'Monetalis',
    description: 'Tier suku bunga berjenjang (stepped fixed rate)',
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
      name: 'tierOrder',
      type: 'number',
      required: true,
      label: 'Urutan Tier',
      admin: { description: '1, 2, 3, dst.' },
    },
    {
      name: 'startMonth',
      type: 'number',
      required: true,
      label: 'Mulai Bulan ke-',
    },
    {
      name: 'endMonth',
      type: 'number',
      required: true,
      label: 'Sampai Bulan ke-',
    },
    {
      name: 'ratePct',
      type: 'number',
      required: true,
      label: 'Suku Bunga (% p.a.)',
      admin: { description: 'Contoh: 4.75, 8.00, 10.25' },
    },
    {
      name: 'installment',
      type: 'number',
      required: true,
      label: 'Angsuran per Bulan (Rp)',
    },
  ],
};
