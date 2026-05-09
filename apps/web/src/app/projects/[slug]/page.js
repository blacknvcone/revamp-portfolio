import Link from 'next/link';
import { ArrowLeft, ExternalLink, Code2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getProfile, getProjectBySlug, getProjectSlugs } from '@/lib/cms';

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  if (!slugs || slugs.length === 0) {
    return [{ slug: 'placeholder' }];
  }
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return {
    title: project?.title ? `${project.title} | Projects` : 'Project',
  };
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const [profile, project] = await Promise.all([
    getProfile(),
    getProjectBySlug(slug),
  ]);

  if (!project) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-16 px-6 min-h-screen">
          <div className="max-w-4xl mx-auto text-center py-24">
            <h1 className="text-3xl font-bold text-text-primary mb-4">Project Not Found</h1>
            <p className="text-text-secondary mb-8">
              This project page is a placeholder. Populate the CMS with projects and rebuild to generate real project pages.
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
            >
              <ArrowLeft size={18} /> Back to Projects
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const description = project.description
    ? typeof project.description === 'string'
      ? project.description
      : ''
    : '';

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft size={16} /> Back to Projects
          </Link>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            {project.title}
          </h1>

          {/* Thumbnail */}
          {project.thumbnail?.url && (
            <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden border border-border-subtle mb-8">
              <img
                src={project.thumbnail.url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-lg text-text-secondary leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          {/* Tech Stack */}
          {project.techStack && project.techStack.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="px-4 py-1.5 rounded-full bg-surface border border-border-subtle text-sm text-text-secondary"
                  >
                    {tech.technology}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-4">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-dark text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
              >
                <ExternalLink size={18} /> View Live
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:border-primary/50 text-text-primary font-medium transition-all duration-300 hover:bg-surface-elevated"
              >
                <Code2 size={18} /> Source Code
              </a>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
