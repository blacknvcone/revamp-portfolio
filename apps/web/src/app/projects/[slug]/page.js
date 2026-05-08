import {
  Typography,
  Box,
  Button,
  Container,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import RootLayout from '@/components/layout/RootLayout';
import { getProfile, getProjectBySlug, getProjectSlugs } from '@/lib/cms';
import { richTextToPlainText } from '@/lib/richText';

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  // Next.js static export requires at least one param for dynamic routes.
  // When CMS is unreachable or empty, we return a placeholder.
  // In production, populate CMS first and ensure CMS_URL is reachable at build time.
  if (!slugs || slugs.length === 0) {
    return [{ slug: 'placeholder' }];
  }
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return {
    title: project?.title ? `${project.title} | Projects` : 'Project',
  };
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const profile = await getProfile();
  const project = await getProjectBySlug(slug);

  if (!project) {
    return (
      <RootLayout profile={profile}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Project
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography color="text.secondary">
            This project page is a placeholder. Populate the CMS with projects and rebuild to generate real project pages.
          </Typography>
        </Container>
      </RootLayout>
    );
  }

  return (
    <RootLayout profile={profile}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {project.title}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {project.thumbnail?.url && (
          <Box
            component="img"
            src={project.thumbnail.url}
            alt={project.title}
            sx={{
              width: '100%',
              maxHeight: 400,
              objectFit: 'cover',
              borderRadius: 2,
              mb: 3,
            }}
          />
        )}

        <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
          {richTextToPlainText(project.description)}
        </Typography>

        {project.techStack && project.techStack.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tech Stack
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {project.techStack.map((tech, i) => (
                <Chip key={i} label={tech.technology} size="small" />
              ))}
            </Stack>
          </Box>
        )}

        <Stack direction="row" spacing={2}>
          {project.liveUrl && (
            <Button
              variant="contained"
              component="a"
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Live
            </Button>
          )}
          {project.repoUrl && (
            <Button
              variant="outlined"
              component="a"
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Source Code
            </Button>
          )}
        </Stack>
      </Container>
    </RootLayout>
  );
}
