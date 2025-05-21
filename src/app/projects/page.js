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

const projects = [
  {
    title: 'eFisheryKu',
    snapshot: '/assets/images/efishery.png',
    description:
      'A platform which farmer can buy some fish feed,vitamin, some tools, and farmer can sold their harvest result.',
    link: 'https://membership.efishery.com',
  },
  {
    title: 'Majoo POS',
    snapshot: '/assets/images/majoo.png',
    description:
      'The POS application provides detailed reports on sales performance, customer trends, and best-selling products.',
    link: 'https://majoo.id',
  },
  {
    title: 'Adalink (Kano)',
    snapshot: '/assets/images/adalink.png',
    description:
      'Link shortening app which has SEO optimization and analytics features. With these features the user will be able to analyze the URL it has.',
    link: '',
  },
  {
    title: 'Hasanah Mobile (Vascomm)',
    snapshot: '/assets/images/hasanah.png',
    description:
      'Hasanah Mobile is a banking application owned by BNI Syariah. In this application the user can make transactions digitally while still paying attention to security aspects.',
    link: 'https://vascomm.co.id',
  },
  {
    title: 'Simas Apps',
    snapshot: '/assets/images/simas.png',
    description:
      'Archives Management Information System and disposition.Is an working app to manage all outgoing and incoming mail as well as managing disposition needs.',
    link: 'https://polije.ac.id',
  },
  {
    title: 'Efinance Apps',
    snapshot: '/assets/images/efinance.png',
    description:
      'Budgeting and Cashflow Information System.Is an application that displays a summary of budget funds in an agency.',
    link: 'https://polije.ac.id',
  },
];

function ProjectCard({ title, snapshot, description, link }) {
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
        <Button
          size="small"
          component="a"
          href={link}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Project
        </Button>
      </CardActions>
    </Card>
  );
}

export default function ProjectsPage() {
  return (
    <RootLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          My Projects
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {projects.map((project, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx} sx={{ display: 'flex' }}>
              <ProjectCard {...project} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </RootLayout>
  );
}
