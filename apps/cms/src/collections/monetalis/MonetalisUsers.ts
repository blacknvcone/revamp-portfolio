import type { CollectionConfig } from 'payload';

const INTERNAL_AUTH_TOKEN = process.env.INTERNAL_AUTH_TOKEN || '';

export const MonetalisUsers: CollectionConfig = {
  slug: 'monetalis-users',
  auth: {
    useAPIKey: true,
  },
  admin: {
    useAsTitle: 'email',
    group: 'Monetalis',
    description: 'User yang bisa mengakses dashboard Monetalis',
  },
  fields: [
    {
      name: 'logtoSub',
      type: 'text',
      required: true,
      unique: true,
      label: 'Logto User ID',
      admin: {
        description: 'User ID dari Logto (sub claim). Primary identifier.',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
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
  endpoints: [
    {
      path: '/user-loan',
      method: 'get',
      handler: async (req) => {
        // Validate internal token (called by Bifrost)
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '');
        if (!token || token !== INTERNAL_AUTH_TOKEN) {
          return Response.json(
            { error: 'Unauthorized', code: 'INVALID_INTERNAL_TOKEN' },
            { status: 401 },
          );
        }

        // Get logtoSub from query
        const logtoSub = req.query?.logtoSub as string;
        if (!logtoSub) {
          return Response.json(
            { error: 'Missing logtoSub parameter', code: 'MISSING_LOGTO_SUB' },
            { status: 400 },
          );
        }

        // Look up user by logtoSub
        const users = await req.payload.find({
          collection: 'monetalis-users',
          where: { logtoSub: { equals: logtoSub } },
          limit: 1,
          depth: 0,
        });

        if (users.docs.length === 0) {
          return Response.json(
            { error: 'User not found', code: 'USER_NOT_FOUND' },
            { status: 404 },
          );
        }

        const user = users.docs[0];

        // Check if user is active
        if (!user.isActive) {
          return Response.json(
            { error: 'User inactive', code: 'USER_INACTIVE' },
            { status: 403 },
          );
        }

        // Return minimal data for token claims
        return Response.json({
          loanId: (user.loan as any)?.id || user.loan,
          role: user.role || 'viewer',
        });
      },
    },
  ],
};
