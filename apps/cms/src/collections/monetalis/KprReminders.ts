import type { CollectionConfig } from 'payload';

export const KprReminders: CollectionConfig = {
  slug: 'kpr-reminders',
  admin: {
    group: 'Monetalis',
    description: 'Konfigurasi email reminder angsuran',
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
      name: 'email',
      type: 'email',
      required: true,
      label: 'Email Penerima',
    },
    {
      name: 'reminderDay',
      type: 'number',
      required: true,
      min: 1,
      max: 28,
      label: 'Hari Reminder (tanggal berapa)',
      admin: {
        description: 'Reminder dikirim pada tanggal ini setiap bulan (1-28)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Aktif',
    },
    {
      name: 'lastSentAt',
      type: 'date',
      label: 'Terakhir Dikirim',
      admin: { readOnly: true },
    },
  ],
};
