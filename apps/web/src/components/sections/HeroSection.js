'use client';

import { motion } from 'framer-motion';
import { ArrowDown, Download, Mail } from 'lucide-react';
import GradientBlur from '@/components/ui/GradientBlur';
import { richTextToPlainText } from '@/lib/richText';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HeroSection({ profile }) {
  const name = profile?.name || 'Dani Prasetya';
  const headline = profile?.headline || 'Software Engineer | Golang & JavaScript Specialist';
  const bio = richTextToPlainText(profile?.bio) ||
    'I have 7 years of experience building robust, scalable applications and managing databases like MySQL, MongoDB, and Redis. Skilled in cloud platforms such as AWS and GCP, I design solutions that perform seamlessly across platforms.';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      {/* Decorative blurs */}
      <GradientBlur className="w-96 h-96 -top-20 -left-20 animate-float" />
      <GradientBlur className="w-80 h-80 top-1/3 right-0 animate-float-delayed" />
      <GradientBlur className="w-64 h-64 bottom-20 left-1/4 opacity-10" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        <motion.p
          variants={itemVariants}
          className="text-accent font-medium mb-4 tracking-wide uppercase text-sm"
        >
          Welcome to my portfolio
        </motion.p>

        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
        >
          <span className="gradient-text">{name}</span>
        </motion.h1>

        <motion.h2
          variants={itemVariants}
          className="text-xl md:text-2xl lg:text-3xl font-medium text-text-secondary mb-6"
        >
          {headline}
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-base md:text-lg text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {bio}
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-dark text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
          >
            View Projects <ArrowDown size={18} />
          </a>
          <a
            href="mailto:dani.prasetya.dev@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:border-primary/50 text-text-primary font-medium transition-all duration-300 hover:bg-surface-elevated"
          >
            <Mail size={18} /> Contact Me
          </a>
          <a
            href="https://drive.google.com/file/d/1jF52uchT_5skrs3imoxYuaoJHS3XOsxA/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:border-primary/50 text-text-primary font-medium transition-all duration-300 hover:bg-surface-elevated"
          >
            <Download size={18} /> Download CV
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-text-muted flex items-start justify-center p-1"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-text-muted"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
