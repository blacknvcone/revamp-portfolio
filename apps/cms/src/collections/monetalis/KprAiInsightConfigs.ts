import type { CollectionConfig } from 'payload'
import { aiInsightAccess, aiInsightConfigAccess } from '@/access/monetalis'

export const KprAiInsightConfigs: CollectionConfig = {
  slug: 'kpr-ai-insight-configs',
  access: aiInsightConfigAccess,
  admin: {
    group: 'Monetalis',
    useAsTitle: 'name',
    description: 'Konfigurasi provider AI dan prompt insight per loan',
    defaultColumns: ['name', 'loan', 'provider', 'model', 'isActive'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nama Konfigurasi',
    },
    {
      name: 'loan',
      type: 'relationship',
      relationTo: 'kpr-loans',
      required: true,
      unique: true,
      label: 'Pinjaman',
      admin: {
        description: 'Satu konfigurasi aktif per loan. Insight selalu menggunakan active loan dari session.',
      },
    },
    {
      name: 'provider',
      type: 'select',
      required: true,
      defaultValue: 'suprlus-intelligents',
      label: 'AI Provider',
      options: [
        { label: 'SuprlusIntelligents', value: 'suprlus-intelligents' },
      ],
    },
    {
      name: 'endpoint',
      type: 'text',
      required: true,
      label: 'Provider Endpoint',
      admin: {
        description: 'URL endpoint server-side provider AI. Jangan gunakan URL frontend proxy.',
      },
    },
    {
      name: 'model',
      type: 'text',
      required: true,
      label: 'Model',
    },
    {
      name: 'apiToken',
      type: 'text',
      required: true,
      label: 'API Token',
      access: {
        read: () => false,
      },
      admin: {
        description: 'Token provider. Disimpan di CMS dan tidak pernah dikembalikan ke API/frontend.',
      },
    },
    {
      name: 'systemPrompt',
      type: 'textarea',
      required: true,
      label: 'System Prompt',
      admin: {
        description: 'Prompt instruksi utama untuk AI.',
      },
    },
    {
      name: 'userPromptTemplate',
      type: 'textarea',
      required: true,
      label: 'User Prompt Template',
      admin: {
        description: 'Gunakan placeholder {{analysisDate}} dan {{normalizedKprSnapshot}}.',
      },
    },
    {
      name: 'promptVersion',
      type: 'text',
      required: true,
      defaultValue: 'v1',
      label: 'Prompt Version',
    },
    {
      name: 'temperature',
      type: 'number',
      required: true,
      defaultValue: 0.2,
      min: 0,
      max: 1,
      label: 'Temperature',
    },
    {
      name: 'timeoutMs',
      type: 'number',
      required: true,
      defaultValue: 30000,
      min: 1000,
      max: 120000,
      label: 'Timeout (ms)',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Aktif',
    },
  ],
}
