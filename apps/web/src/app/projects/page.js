import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SectionHeading from '@/components/ui/SectionHeading';
import ProjectCard from '@/components/ui/ProjectCard';
import { getProfile, getProjects } from '@/lib/cms';

export const metadata = {
  title: 'Projects | Dani Prasetya',
  description: 'Explore my portfolio of software engineering projects.',
};

export default async function ProjectsPage() {
  const [profile, projects] = await Promise.all([
    getProfile(),
    getProjects(),
  ]);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <SectionHeading subtitle="A complete collection of my work across backend systems, cloud infrastructure, and full-stack applications.">
            All Projects
          </SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length > 0 ? (
              projects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <p className="text-text-muted text-lg">
                  No projects found. Add them in the CMS.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
