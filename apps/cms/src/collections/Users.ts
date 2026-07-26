import type { CollectionConfig } from 'payload';

/**
 * Access mapping table — NOT a user management collection.
 *
 * Payload 3.x requires `admin.user` to point to an auth collection
 * for the admin panel to function. This collection satisfies that
 * constraint while being minimal.
 *
 * Users and roles are managed entirely by Logto (identity provider).
 * CMS trusts the Logto access token (Custom JWT with logtoRoles).
 * This collection is just the link between logtoSub and Payload's
 * internal user ID.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    disableLocalStrategy: true,
    strategies: [
      {
        name: 'logto-jwt',
        authenticate: async ({ headers, payload }) => {
          // Validate Logto access token from payload-token cookie
          const cookieHeader = headers.get('cookie') || '';
          const match = cookieHeader.match(/payload-token=([^;]+)/);
          if (!match) {
            return { user: null };
          }

          try {
            const { jwtVerify } = await import('jose');

            const secret = new TextEncoder().encode(
              process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
            );

            const { payload: tokenPayload } = await jwtVerify(match[1], secret);

            const userId = tokenPayload.id as string;
            if (!userId) {
              return { user: null };
            }

            const result = await payload.find({
              collection: 'users',
              where: { id: { equals: userId } },
              limit: 1,
            });

            if (result.docs.length === 0) {
              return { user: null };
            }

            const user = result.docs[0];
            return {
              user: {
                ...user,
                collection: 'users',
                _strategy: 'logto-jwt',
              } as any,
            };
          } catch {
            return { user: null };
          }
        },
      },
    ],
  },
  admin: {
    useAsTitle: 'logtoSub',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => false,
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'logtoSub',
      type: 'text',
      required: true,
      unique: true,
      label: 'Logto User ID',
      admin: {
        description: 'User ID dari identity provider. Link ke Payload internal ID.',
      },
    },
    {
      name: 'email',
      type: 'text',
      label: 'Email',
      validate: () => true as const,
    },
    {
      name: 'name',
      type: 'text',
      label: 'Name',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active',
      admin: {
        description: 'Nonaktifkan untuk memblokir akses.',
      },
    },
  ],
};
