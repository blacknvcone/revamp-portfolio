'use client';
import { Box, Button, Container, Typography } from '@mui/material';

export default function HeroSection() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        px: 3,
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h2" component="h1" gutterBottom>
          Hi, I&apos;m Dani Prasetya
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          color="text.secondary"
          gutterBottom
          sx={{ fontWeight: 'medium' }}
        >
          Software Engineer | Golang & JavaScript Specialist
        </Typography>
        <Typography
          variant="body1"
          paragraph
          sx={{ maxWidth: 700, mx: 'auto', mb: 3 }}
        >
          I have 7 years of experience building robust, scalable applications
          and managing databases like MySQL, MongoDB, and Redis. Skilled in
          cloud platforms such as AWS and GCP, I design solutions that perform
          seamlessly across platforms. Passionate about technology,
          problem-solving, and delivering high-quality software.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            sx={{ mr: 2 }}
            component="a"
            target="_blank"
            href="https://drive.google.com/file/d/1jF52uchT_5skrs3imoxYuaoJHS3XOsxA/view?usp=sharing"
            download
          >
            Download CV
          </Button>
          <Button
            variant="outlined"
            size="large"
            component="a"
            href="mailto:dani.prasetya.dev@gmail.com"
          >
            Contact Me
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
