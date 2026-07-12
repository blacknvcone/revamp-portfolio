import type { CollectionConfig } from 'payload';

export const MonetalisUsers: CollectionConfig = {
  slug: 'monetalis-users',
  auth: {
    useAPIKey: true,
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
  },
  admin: {
    useAsTitle: 'email',
    group: 'Monetalis',
    description: 'User yang bisa mengakses dashboard Monetalis',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      label: 'Email',
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nama Lengkap',
    },
    {
      name: 'loan',
      type: 'relationship',
      relationTo: 'kpr-loans',
      required: true,
      label: 'KPR Loan',
      admin: {
        description: 'User hanya bisa mengakses data dari loan yang dipilih. 1 loan bisa dipakai banyak user.',
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'viewer',
      label: 'Role',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Viewer', value: 'viewer' },
      ],
      admin: {
        description: 'Admin bisa manage data via CMS. Viewer hanya bisa lihat dashboard.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Aktif',
      admin: {
        description: 'Nonaktifkan untuk memblokir akses tanpa menghapus user',
      },
    },
  ],
};
