'use client';

import { motion } from 'framer-motion';
import { ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ProjectCard({ project, index = 0 }) {
  const { title, description, thumbnail, techStack, liveUrl, slug } = project;
  const imageUrl = thumbnail?.url || '/assets/images/placeholder.png';
  const shortDesc = description
    ? typeof description === 'string'
      ? description.slice(0, 120) + (description.length > 120 ? '...' : '')
      : ''
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="group relative flex flex-col h-full bg-surface rounded-2xl border border-border-subtle overflow-hidden hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-60" />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow p-5">
          <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary-light transition-colors">
            {title}
          </h3>
          <p className="text-sm text-text-secondary mb-4 line-clamp-2 flex-grow">
            {shortDesc}
          </p>

          {/* Tech stack */}
          {techStack && techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {techStack.slice(0, 4).map((tech, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full bg-border-subtle text-text-muted border border-border"
                >
                  {tech.technology}
                </span>
              ))}
              {techStack.length > 4 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-border-subtle text-text-muted border border-border">
                  +{techStack.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-auto">
            {slug && (
              <Link
                href={`/projects/${slug}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-light transition-colors"
              >
                Details <ArrowRight size={14} />
              </Link>
            )}
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-text-muted hover:text-text-secondary transition-colors"
              >
                <ExternalLink size={14} /> Live
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
