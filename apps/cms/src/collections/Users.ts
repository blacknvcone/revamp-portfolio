import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    // Authenticated only — no public read
    read: ({ req: { user } }) => Boolean(user),
    create: () => false, // Users created via SSO flow only
    update: ({ req: { user } }) => (user as any)?.cmsRole === 'admin',
    delete: ({ req: { user } }) => (user as any)?.cmsRole === 'admin',
  },
  fields: [
    {
      name: 'logtoSub',
      type: 'text',
      required: true,
      unique: true,
      label: 'Logto User ID',
      admin: {
        description: 'User ID dari Logto (sub claim). Primary identifier dari SSO.',
      },
    },
    {
      name: 'email',
      type: 'text',
      label: 'Email',
    },
    {
      name: 'name',
      type: 'text',
      label: 'Name',
    },
    {
      name: 'cmsRole',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      label: 'CMS Role',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      admin: {
        description: 'Admin bisa manage semua data dan user. Editor hanya bisa edit data.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active',
      admin: {
        description: 'Nonaktifkan untuk memblokir akses tanpa menghapus user.',
      },
    },
  ],
};
