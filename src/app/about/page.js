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

export default function AboutPage() {
  const workExperiences = [
    {
      company: 'Efishery',
      role: 'Backend Engineer',
      period: 'Jul 2022 – Feb 2025',
      avatar: '/assets/images/lg_efishery.png',
      stack: 'Golang, Redis, PostgreSQL, GraphQL, RabbitMQ',
      contributions: [
        'Improving transcation flow by integrating with some payment gateway module to ensure transaction was going flawlessly.',
        'Ensure All API services was having SLA 99% to make eFisheryku Apps run smoothly.',
        'Implemented caching strategies with Redis to optimize product listing response times.',
        'Refactored legacy modules resulting in more efficient and maintainable codebases.',
        'Commit to initialize unit testing for all existing module handled.',
      ],
    },
    {
      company: 'Majoo',
      role: 'Backend Engineer',
      period: 'Nov 2021 – Jul 2022',
      avatar: '/assets/images/lg_majoo.png',
      stack: 'Golang, PHP, Kafka, Redis',
      contributions: [
        'Maintained and extended Majoo POS, a Point of Sale application that generates real-time sales and customer analytics reports.',
        'Built new APIs for sales performance dashboards to give business owners better visibility into operations.',
        'Diagnosed and fixed issues with Kafka consumers, improving system stability and log accuracy.',
        'Participated in code refactoring sprints to clean and modularize legacy services.',
      ],
    },
    {
      company: 'Kano Solution',
      role: 'Full-stack Engineer',
      avatar: '/assets/images/lg_kano.png',
      period: 'Dec 2020 – Nov 2021',
      stack: 'Golang, React, RabbitMQ, AWS',
      contributions: [
        'Developed Adalink, a link-shortening application with Analytics dashboard showing click counts, referrers, and location insights',
        'Used AWS services for hosting and CI/CD integration, improving deployment reliability and speed.',
      ],
    },
    {
      company: 'Vascomm',
      role: 'Backend Supervisor',
      avatar: '/assets/images/lg_vascomm.png',
      period: 'Feb 2019 – Nov 2020',
      stack: 'Node.js, PHP, Laravel',
      contributions: [
        `Led backend development for Hasanah Mobile, a digital banking app for BNI Syariah
by Enabled secure digital transactions and account management`,
        `Supervised and mentored a team of 5 backend developers`,
        `Conducted regular code reviews and introduced automated testing practices using
PHPUnit and Mocha.`,
      ],
    },
    {
      company: 'Politeknik Negeri Jember',
      role: 'Network Administrator',
      avatar: '/assets/images/lg_polije.png',
      period: 'Feb 2015 – Jan 2018',
      stack: 'Cisco',
      contributions: [
        `Managed campus-wide network infrastructure, ensuring stable connectivity across
academic services.`,
        `Implemented network monitoring and incident response strategies, reducing downtime
by 40%.`,
        `Trained staff on basic network troubleshooting and maintenance.`,
      ],
    },
  ];

  const skills = [
    'Golang',
    'PHP',
    'JavaScript',
    'React',
    'Next.js',
    'Node.js',
    'Laravel',
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'Kafka',
    'RabbitMQ',
    'OpenTelemetry',
    'Elastic APM',
    'Git',
    'AWS',
    'GCP',
    'Cisco',
  ];

  const educations = [
    {
      school:
        'Electronic Engineering Polytechnic Institute of Surabaya (EEPIS)',
      avatar: '/assets/images/lg_pens.png',
      period: '2016 – 2019',
      degree: 'Bachelor’s in Informatics Engineering',
      gpa: '3.23',
    },
    {
      school: 'Politeknik Negeri Jember',
      avatar: '/assets/images/lg_polije.png',
      period: '2012 – 2015',
      degree: 'Diploma in Informatics Engineering',
      gpa: '3.50',
    },
  ];

  const certifications = [
    {
      name: 'Architecting with Google Compute Engine',
      year: '2020',
      issuer: 'Coursera (Google Cloud)',
      link_src:
        'https://www.coursera.org/account/accomplishments/specialization/certificate/7XBDDPF8ZYQ6',
    },
    {
      name: 'Elastic Cloud Infrastructure: Scaling and Automation',
      year: '2020',
      issuer: 'Coursera (Google Cloud)',
      link_src:
        'https://www.coursera.org/account/accomplishments/certificate/WMQSHFL4V9NX',
    },
  ];

  return (
    <RootLayout>
      <Box sx={{ p: 2 }}>
        <section id="about">
          <Typography variant="h3" gutterBottom>
            About Me
          </Typography>
        </section>

        <Divider sx={{ mb: 2 }} />

        <Typography align="justify" sx={{ mt: 2 }}>
          I am a dedicated software engineer with 7 years of experience in
          developing robust applications and managing relational database
          systems. My expertise includes Golang and JavaScript, with a strong
          foundation in MySQL, MongoDB, and Redis. I’ve built scalable solutions
          using AWS and GCP, and I thrive on solving problems, optimizing
          performance, and exploring new tech trends.
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
            {skills.map((skill) => (
              <Button
                key={skill}
                variant="outlined"
                size="small"
                color="text.primary"
                sx={{ borderRadius: 5, mb: 1 }}
              >
                {skill}
              </Button>
            ))}
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
            {workExperiences.map((exp, idx) => (
              <React.Fragment key={exp.company}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar alt={exp.company} src={exp.avatar} />
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
                        {` (${exp.period})`}
                        {exp.contributions && (
                          <Typography variant="body2" color="text.secondary">
                            <h5 style={{ margin: 2 }}>Key Contribution :</h5>
                            <ul style={{ margin: 0, paddingLeft: 24 }}>
                              {exp.contributions.map((c, i) => (
                                <li key={i}>{c}</li>
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
            ))}
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
            {educations.map((exp, idx) => (
              <React.Fragment key={exp.school}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar alt={exp.school} src={exp.avatar} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={exp.school}
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ color: 'text.primary', display: 'inline' }}
                        >
                          <b>{exp.degree}</b>
                        </Typography>
                        {` (${exp.period})`}
                        {exp.gpa && (
                          <Typography variant="body2" color="text.secondary">
                            <h5 style={{ margin: 2 }}>
                              GPA : {` (${exp.gpa})`}
                            </h5>
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
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
            {certifications.map((exp, idx) => (
              <React.Fragment key={exp.name}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar alt={exp.name} src={exp.avatar} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={exp.name}
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ color: 'text.primary', display: 'inline' }}
                        >
                          <b>{exp.issuer}</b>
                        </Typography>
                        {` (${exp.year})`}
                        {exp.link_src && (
                          <Typography>
                            <Button
                              my={1}
                              size="small"
                              color="text.primary"
                              variant="outlined"
                              startIcon={<LaunchTwoTone />}
                              component="a"
                              href={exp.link_src}
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
            ))}
          </List>
        </Box>
      </Box>
    </RootLayout>
  );
}
