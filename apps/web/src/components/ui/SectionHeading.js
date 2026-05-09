'use client';

import { motion } from 'framer-motion';

export default function SectionHeading({ children, subtitle, align = 'center' }) {
  const alignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className={`mb-12 ${alignClass}`}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
        {children}
      </h2>
      {subtitle && (
        <p className="text-text-secondary max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      <div className={`mt-4 flex ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-primary to-accent" />
      </div>
    </motion.div>
  );
}
