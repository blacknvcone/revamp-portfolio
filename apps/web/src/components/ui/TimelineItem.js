'use client';

import { motion } from 'framer-motion';

function formatPeriod(startDate, endDate) {
  if (!startDate) return '';
  const start = new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  const end = endDate
    ? new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : 'Present';
  return `${start} – ${end}`;
}

export default function TimelineItem({ experience, index = 0 }) {
  const { company, role, startDate, endDate, description, contributions, logo } = experience;
  const period = formatPeriod(startDate, endDate);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative pl-8 md:pl-12 pb-10 last:pb-0"
    >
      {/* Timeline line */}
      <div className="absolute left-0 top-2 bottom-0 w-px bg-border" />
      
      {/* Timeline dot */}
      <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-primary ring-4 ring-background" />

      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Logo */}
        {logo?.url && (
          <img
            src={logo.url}
            alt={company}
            className="w-12 h-12 rounded-lg object-cover border border-border-subtle bg-surface"
          />
        )}

        <div className="flex-grow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-2">
            <h3 className="text-lg font-semibold text-text-primary">{company}</h3>
            <span className="text-sm text-text-muted font-mono">{period}</span>
          </div>
          <p className="text-primary-light font-medium mb-2">{role}</p>

          {description && (
            <p className="text-sm text-text-secondary mb-3">
              {typeof description === 'string' ? description : ''}
            </p>
          )}

          {contributions && contributions.length > 0 && (
            <ul className="space-y-1.5">
              {contributions.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                  <span>{c.item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
