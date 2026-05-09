'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Award, ExternalLink } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import { richTextToPlainText } from '@/lib/richText';

export default function AboutSection({ profile, educations, certifications }) {
  const bio = richTextToPlainText(profile?.bio) ||
    'I am a dedicated software engineer with 7 years of experience in developing robust applications and managing relational database systems. My expertise includes Golang and JavaScript, with a strong foundation in MySQL, MongoDB, and Redis.';

  const avatar = profile?.avatar?.url || '/assets/images/pp.jpg';

  return (
    <section id="about" className="py-24 px-6 bg-surface/50">
      <div className="max-w-6xl mx-auto">
        <SectionHeading subtitle="A little more about my background, education, and certifications.">
          About Me
        </SectionHeading>

        {/* Bio + Avatar */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-text-secondary leading-relaxed text-lg">
              {bio}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="w-64 h-64 rounded-2xl overflow-hidden border-2 border-border-subtle">
                <img
                  src={avatar}
                  alt={profile?.name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -inset-3 rounded-2xl border border-primary/20 -z-10" />
            </div>
          </motion.div>
        </div>

        {/* Education */}
        {educations && educations.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <GraduationCap className="text-primary" size={24} />
              Education
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {educations.map((edu) => (
                <motion.div
                  key={edu.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="p-5 rounded-xl bg-surface border border-border-subtle hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {edu.logo?.url && (
                      <img
                        src={edu.logo.url}
                        alt={edu.school}
                        className="w-12 h-12 rounded-lg object-cover border border-border-subtle"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold text-text-primary">{edu.school}</h4>
                      <p className="text-sm text-primary-light">{edu.degree}</p>
                      <p className="text-sm text-text-muted mt-1">{edu.period}</p>
                      {edu.gpa && (
                        <p className="text-sm text-text-muted">GPA: {edu.gpa}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <Award className="text-primary" size={24} />
              Certifications
            </h3>
            <div className="space-y-3">
              {certifications.map((cert) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border-subtle hover:border-primary/20 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-text-primary">{cert.name}</h4>
                    <p className="text-sm text-text-secondary">
                      {cert.issuer} &middot; {cert.year}
                    </p>
                  </div>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-light transition-colors"
                    >
                      <ExternalLink size={14} /> Credential
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
