import type { CollectionConfig } from 'payload';

export const Skills: CollectionConfig = {
  slug: 'skills',
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
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Frontend', value: 'Frontend' },
        { label: 'Backend', value: 'Backend' },
        { label: 'DevOps', value: 'DevOps' },
        { label: 'Other', value: 'Other' },
      ],
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
    },
  ],
};
