import type { CollectionConfig } from 'payload';

export const KprReminders: CollectionConfig = {
  slug: 'kpr-reminders',
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
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
      defaultValue: 1,
      label: 'Hari Reminder',
      admin: {
        description: 'Tanggal berapa reminder dikirim (1-28). Default: 1 (awal bulan)',
      },
    },
    {
      name: 'sendPaymentReminder',
      type: 'checkbox',
      defaultValue: true,
      label: 'Kirim Pengingat Pembayaran',
      admin: {
        description: 'Email pengingat angsuran sebelum jatuh tempo',
      },
    },
    {
      name: 'sendMonthlyInsight',
      type: 'checkbox',
      defaultValue: true,
      label: 'Kirim Laporan Bulanan',
      admin: {
        description: 'Email summary analisa insight setiap bulan',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Aktif',
    },
    {
      name: 'lastPaymentReminderSent',
      type: 'date',
      label: 'Terakhir Kirim Pengingat',
      admin: { readOnly: true },
    },
    {
      name: 'lastMonthlyInsightSent',
      type: 'date',
      label: 'Terakhir Kirim Laporan',
      admin: { readOnly: true },
    },
  ],
};
