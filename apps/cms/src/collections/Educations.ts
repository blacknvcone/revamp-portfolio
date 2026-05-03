import type { CollectionConfig } from 'payload';

export const Educations: CollectionConfig = {
  slug: 'educations',
  admin: {
    useAsTitle: 'school',
    group: 'Portfolio Web',
  },
  fields: [
    {
      name: 'school',
      type: 'text',
      required: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'degree',
      type: 'text',
      required: true,
    },
    {
      name: 'period',
      type: 'text',
      required: true,
    },
    {
      name: 'gpa',
      type: 'text',
    },
  ],
};
