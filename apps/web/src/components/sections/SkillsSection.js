'use client';

import { motion } from 'framer-motion';
import SectionHeading from '@/components/ui/SectionHeading';
import SkillBadge from '@/components/ui/SkillBadge';

const categoryLabels = {
  Frontend: 'Frontend Development',
  Backend: 'Backend & APIs',
  DevOps: 'DevOps & Cloud',
  Other: 'Tools & Others',
};

const categoryOrder = ['Frontend', 'Backend', 'DevOps', 'Other'];

export default function SkillsSection({ skills }) {
  const grouped = skills.reduce((acc, skill) => {
    const cat = skill.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  return (
    <section id="skills" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeading subtitle="Technologies and tools I use to build scalable, high-performance applications.">
          Skills & Technologies
        </SectionHeading>

        <div className="space-y-12">
          {categoryOrder.map((category) => {
            const items = grouped[category];
            if (!items || items.length === 0) return null;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  {categoryLabels[category] || category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((skill) => (
                    <SkillBadge
                      key={skill.id}
                      name={skill.name}
                      icon={skill.icon?.url}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
