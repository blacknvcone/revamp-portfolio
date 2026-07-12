import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { s3Storage } from '@payloadcms/storage-s3';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

import { Profile } from './collections/Profile';
import { Projects } from './collections/Projects';
import { Experiences } from './collections/Experiences';
import { Skills } from './collections/Skills';
import { Media } from './collections/Media';
import { Users } from './collections/Users';
import { Educations } from './collections/Educations';
import { Certifications } from './collections/Certifications';

// Monetalis KPR collections
import {
  KprLoans,
  KprRateTiers,
  KprSchedule,
  KprExtraPayments,
  KprReminders,
  KprSimulations,
} from './collections/monetalis';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [
    // Shared
    Users,
    Media,
    // Portfolio Web
    Projects,
    Experiences,
    Skills,
    Educations,
    Certifications,
    // Monetalis KPR
    KprLoans,
    KprRateTiers,
    KprSchedule,
    KprExtraPayments,
    KprReminders,
    KprSimulations,
  ],
  globals: [Profile],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb://localhost:27017/portfolio_cms',
  }),
  plugins: [
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
          generateFileURL: ({ filename, prefix }) => {
            const publicUrl = process.env.S3_PUBLIC_URL || '';
            const pathPrefix = prefix ? `${prefix}/` : '';
            return `${publicUrl}/${pathPrefix}${filename}`;
          },
        },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        endpoint: process.env.S3_ENDPOINT || '',
        region: 'auto',
        forcePathStyle: true,
      },
    }),
  ],
  sharp,
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3001'].filter(Boolean),
});
