const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3001';

async function fetchCMS(path, options = {}) {
  const url = `${CMS_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      // For static export, data is fetched at build time
      // Use a reasonable cache duration for builds
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(`CMS fetch failed: ${url} (${res.status})`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn(`CMS fetch error: ${url}`, err.message);
    return null;
  }
}

// Profile (global)
export async function getProfile() {
  const data = await fetchCMS('/api/globals/profile');
  return data || null;
}

// Projects
export async function getProjects() {
  const data = await fetchCMS('/api/projects?limit=100&sort=-publishedAt');
  return data?.docs || [];
}

export async function getProjectBySlug(slug) {
  const data = await fetchCMS(`/api/projects?where[slug][equals]=${encodeURIComponent(slug)}`);
  return data?.docs?.[0] || null;
}

export async function getProjectSlugs() {
  const data = await fetchCMS('/api/projects?limit=100&select[slug]=true');
  return data?.docs?.map((doc) => doc.slug).filter(Boolean) || [];
}

// Experiences
export async function getExperiences() {
  const data = await fetchCMS('/api/experiences?limit=100&sort=-startDate');
  return data?.docs || [];
}

// Skills
export async function getSkills() {
  const data = await fetchCMS('/api/skills?limit=100');
  return data?.docs || [];
}

// Educations
export async function getEducations() {
  const data = await fetchCMS('/api/educations?limit=100');
  return data?.docs || [];
}

// Certifications
export async function getCertifications() {
  const data = await fetchCMS('/api/certifications?limit=100');
  return data?.docs || [];
}
