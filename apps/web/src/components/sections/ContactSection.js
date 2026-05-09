'use client';

import { motion } from 'framer-motion';
import { Mail, Code2, Briefcase, MessageCircle, ExternalLink } from 'lucide-react';

const iconMap = {
  email: Mail,
  github: Code2,
  linkedin: Briefcase,
  twitter: MessageCircle,
};

export default function ContactSection({ profile }) {
  const socialLinks = profile?.socialLinks || [];
  const email = socialLinks.find((l) => l.platform === 'email')?.url || 'dani.prasetya.dev@gmail.com';

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Let&apos;s Work Together
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
            I&apos;m always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
          </p>

          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary hover:bg-primary-dark text-white font-medium text-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/25"
          >
            <Mail size={20} /> Get In Touch
          </a>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              {socialLinks
                .filter((link) => link.platform !== 'email' && link.platform !== 'location')
                .map((link) => {
                  const Icon = iconMap[link.platform?.toLowerCase()] || ExternalLink;
                  return (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-full border border-border hover:border-primary/50 text-text-muted hover:text-text-primary transition-all duration-300 hover:bg-surface-elevated"
                      aria-label={link.platform}
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Background decoration */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)',
        }}
      />
    </section>
  );
}
