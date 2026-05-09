import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import SkillsSection from '@/components/sections/SkillsSection';
import AboutSection from '@/components/sections/AboutSection';
import ContactSection from '@/components/sections/ContactSection';
import {
  getProfile,
  getProjects,
  getExperiences,
  getSkills,
  getEducations,
  getCertifications,
} from '@/lib/cms';

export default async function Home() {
  const [profile, projects, experiences, skills, educations, certifications] = await Promise.all([
    getProfile(),
    getProjects(),
    getExperiences(),
    getSkills(),
    getEducations(),
    getCertifications(),
  ]);

  return (
    <>
      <Navbar />
      <main>
        <HeroSection profile={profile} />
        <ProjectsSection projects={projects} />
        <ExperienceSection experiences={experiences} />
        <SkillsSection skills={skills} />
        <AboutSection
          profile={profile}
          educations={educations}
          certifications={certifications}
        />
        <ContactSection profile={profile} />
      </main>
      <Footer />
    </>
  );
}
