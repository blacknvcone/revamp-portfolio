import { postgresAdapter } from '@payloadcms/db-postgres';
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

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [Users, Media, Projects, Experiences, Skills, Educations, Certifications],
  globals: [Profile],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || 'postgresql://postgres:postgres@localhost:5432/portfolio_cms',
    },
  }),
  sharp,
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3001'].filter(Boolean),
});
