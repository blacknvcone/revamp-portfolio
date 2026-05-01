// Shared types generated from Payload CMS collections
// Re-export Payload-generated types here once they are generated

export interface Profile {
  id: string;
  name: string;
  headline: string;
  bio: unknown;
  avatar?: string;
  socialLinks?: SocialLink[];
  updatedAt: string;
  createdAt: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: unknown;
  thumbnail?: string;
  techStack?: string[];
  repoUrl?: string;
  liveUrl?: string;
  featured?: boolean;
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
}

export interface Experience {
  id: string;
  company: string;
  logo?: string;
  role: string;
  startDate: string;
  endDate?: string;
  description: unknown;
  contributions?: Contribution[];
  updatedAt: string;
  createdAt: string;
}

export interface Contribution {
  item: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'Frontend' | 'Backend' | 'DevOps' | 'Other';
  icon?: string;
  updatedAt: string;
  createdAt: string;
}

export interface Education {
  id: string;
  school: string;
  logo?: string;
  degree: string;
  period: string;
  gpa?: string;
  updatedAt: string;
  createdAt: string;
}

export interface Certification {
  id: string;
  name: string;
  year: string;
  issuer: string;
  credentialUrl?: string;
  updatedAt: string;
  createdAt: string;
}
