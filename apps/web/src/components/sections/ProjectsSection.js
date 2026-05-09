'use client';

import SectionHeading from '@/components/ui/SectionHeading';
import ProjectCard from '@/components/ui/ProjectCard';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function ProjectsSection({ projects }) {
  const featuredProjects = projects.slice(0, 6);

  return (
    <section id="projects" className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeading subtitle="A selection of projects I've worked on, showcasing my expertise in backend systems, cloud infrastructure, and full-stack development.">
          Selected Work
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>

        {projects.length > 6 && (
          <div className="mt-12 text-center">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:border-primary/50 text-text-primary font-medium transition-all duration-300 hover:bg-surface-elevated"
            >
              View All Projects <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
