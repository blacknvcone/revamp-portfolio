import SectionHeading from '@/components/ui/SectionHeading';
import TimelineItem from '@/components/ui/TimelineItem';

export default function ExperienceSection({ experiences }) {
  return (
    <section id="experience" className="py-24 px-6 bg-surface/50">
      <div className="max-w-4xl mx-auto">
        <SectionHeading subtitle="My professional journey and the impactful work I've delivered across different companies and roles.">
          Work Experience
        </SectionHeading>

        <div className="mt-8">
          {experiences.length > 0 ? (
            experiences.map((exp, index) => (
              <TimelineItem key={exp.id} experience={exp} index={index} />
            ))
          ) : (
            <p className="text-text-muted text-center py-12">
              No experiences found. Add them in the CMS.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
