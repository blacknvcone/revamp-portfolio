import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Container,
  Divider,
  Grid,
} from '@mui/material';
import RootLayout from '@/components/layout/RootLayout';
import { getProfile, getProjects } from '@/lib/cms';
import { richTextToPlainText } from '@/lib/richText';

function ProjectCard({ title, snapshot, description, link, slug }) {
  return (
    <Card sx={{ height: '100%', maxWidth: 270, mx: 'auto' }}>
      <CardMedia
        sx={{ height: 140 }}
        image={snapshot}
        title={title}
        alt={title}
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {description}
        </Typography>
      </CardContent>
      <CardActions>
        {slug && (
          <Button size="small" href={`/projects/${slug}`}>
            Read More
          </Button>
        )}
        {link && (
          <Button
            size="small"
            component="a"
            href={link}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Live
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

export default async function ProjectsPage() {
  const profile = await getProfile();
  const projects = await getProjects();

  return (
    <RootLayout profile={profile}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          My Projects
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {projects.length > 0 ? (
            projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.id} sx={{ display: 'flex' }}>
                <ProjectCard
                  title={project.title}
                  snapshot={project.thumbnail?.url || '/assets/images/placeholder.png'}
                  description={richTextToPlainText(project.description)}
                  link={project.liveUrl}
                  slug={project.slug}
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography color="text.secondary">
                No projects found. Add them in the CMS.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Container>
    </RootLayout>
  );
}
