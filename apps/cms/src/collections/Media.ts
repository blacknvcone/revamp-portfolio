import path from 'path';
import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/*'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
};
