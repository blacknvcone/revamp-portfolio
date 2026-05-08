import React from 'react';
import {
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Button,
  Avatar,
  Stack,
} from '@mui/material';
import RootLayout from '@/components/layout/RootLayout';
import {
  WorkTwoTone,
  SchoolTwoTone,
  WorkspacePremiumTwoTone,
  LaunchTwoTone,
  AutoFixHighTwoTone,
} from '@mui/icons-material';
import { getProfile, getExperiences, getSkills, getEducations, getCertifications } from '@/lib/cms';
import { richTextToPlainText } from '@/lib/richText';

export default async function AboutPage() {
  const profile = await getProfile();
  const experiences = await getExperiences();
  const skills = await getSkills();
  const educations = await getEducations();
  const certifications = await getCertifications();

  const bio = richTextToPlainText(profile?.bio) ||
    "I am a dedicated software engineer with 7 years of experience in developing robust applications and managing relational database systems. My expertise includes Golang and JavaScript, with a strong foundation in MySQL, MongoDB, and Redis. I've built scalable solutions using AWS and GCP, and I thrive on solving problems, optimizing performance, and exploring new tech trends.";

  function formatPeriod(startDate, endDate) {
    if (!startDate) return '';
    const start = new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    const end = endDate
      ? new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      : 'Present';
    return `${start} – ${end}`;
  }

  return (
    <RootLayout profile={profile}>
      <Box sx={{ p: 2 }}>
        <section id="about">
          <Typography variant="h3" gutterBottom>
            About Me
          </Typography>
        </section>

        <Divider sx={{ mb: 2 }} />

        <Typography align="justify" sx={{ mt: 2 }}>
          {bio}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ my: 4 }}>
          <section id="skills">
            <Typography sx={{ my: 4 }} variant="h4" gutterBottom>
              <AutoFixHighTwoTone
                sx={{ fontSize: 'inherit', verticalAlign: 'middle', mr: 1 }}
              />
              Skills
            </Typography>
          </section>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {skills.length > 0 ? (
              skills.map((skill) => (
                <Button
                  key={skill.id}
                  variant="outlined"
                  size="small"
                  color="text.primary"
                  sx={{ borderRadius: 5, mb: 1 }}
                >
                  {skill.name}
                </Button>
              ))
            ) : (
              <Typography color="text.secondary">No skills found. Add them in the CMS.</Typography>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ my: 4 }}>
          <section id="work">
            <Typography variant="h4" gutterBottom>
              <WorkTwoTone
                sx={{ fontSize: 'inherit', verticalAlign: 'middle', mr: 1 }}
              />
              Work Experience
            </Typography>
          </section>

          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {experiences.length > 0 ? (
              experiences.map((exp) => (
                <React.Fragment key={exp.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar
                        alt={exp.company}
                        src={exp.logo?.url || '/assets/images/placeholder.png'}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={exp.company}
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{ color: 'text.primary', display: 'inline' }}
                          >
                            <b>{exp.role}</b>
                          </Typography>
                          {` (${formatPeriod(exp.startDate, exp.endDate)})`}
                          {exp.contributions && exp.contributions.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                              <h5 style={{ margin: 2 }}>Key Contribution :</h5>
                              <ul style={{ margin: 0, paddingLeft: 24 }}>
                                {exp.contributions.map((c, i) => (
                                  <li key={i}>{c.item}</li>
                                ))}
                              </ul>
                            </Typography>
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText secondary="No experiences found. Add them in the CMS." />
              </ListItem>
            )}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ my: 4 }}>
          <section id="education">
            <Typography variant="h4" gutterBottom>
              <SchoolTwoTone
                sx={{ fontSize: 'inherit', verticalAlign: 'middle', mr: 1 }}
              />
              Educations
            </Typography>
          </section>

          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {educations.length > 0 ? (
              educations.map((edu) => (
                <React.Fragment key={edu.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar alt={edu.school} src={edu.logo?.url || '/assets/images/placeholder.png'} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={edu.school}
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{ color: 'text.primary', display: 'inline' }}
                          >
                            <b>{edu.degree}</b>
                          </Typography>
                          {` (${edu.period})`}
                          {edu.gpa && (
                            <Typography variant="body2" color="text.secondary">
                              <h5 style={{ margin: 2 }}>
                                GPA : {` (${edu.gpa})`}
                              </h5>
                            </Typography>
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText secondary="No educations found. Add them in the CMS." />
              </ListItem>
            )}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ my: 4 }}>
          <section id="certification">
            <Typography variant="h4" gutterBottom>
              <WorkspacePremiumTwoTone
                sx={{ fontSize: 'inherit', verticalAlign: 'middle', mr: 1 }}
              />
              Certifications
            </Typography>
          </section>

          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {certifications.length > 0 ? (
              certifications.map((cert) => (
                <React.Fragment key={cert.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar alt={cert.name} src={cert.logo?.url || '/assets/images/placeholder.png'} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={cert.name}
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{ color: 'text.primary', display: 'inline' }}
                          >
                            <b>{cert.issuer}</b>
                          </Typography>
                          {` (${cert.year})`}
                          {cert.credentialUrl && (
                            <Typography>
                              <Button
                                my={1}
                                size="small"
                                color="text.primary"
                                variant="outlined"
                                startIcon={<LaunchTwoTone />}
                                component="a"
                                href={cert.credentialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Show Credential
                              </Button>
                            </Typography>
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText secondary="No certifications found. Add them in the CMS." />
              </ListItem>
            )}
          </List>
        </Box>
      </Box>
    </RootLayout>
  );
}
