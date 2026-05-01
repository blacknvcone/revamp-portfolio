import type { CollectionConfig } from 'payload';

export const Certifications: CollectionConfig = {
  slug: 'certifications',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'year',
      type: 'text',
      required: true,
    },
    {
      name: 'issuer',
      type: 'text',
      required: true,
    },
    {
      name: 'credentialUrl',
      type: 'text',
    },
  ],
};
