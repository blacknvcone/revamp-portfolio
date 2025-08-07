'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import Link from 'next/link';

const projects = [
  {
    title: 'eFisheryKu',
    description: 'A platform which farmer can buy some fish feed,vitamin, some tools, and farmer can sold their harvest result.',
    link: 'https://membership.efishery.com',
  },
  {
    title: 'Majoo POS',
    description: 'The POS application provides detailed reports on sales performance, customer trends, and best-selling products.',
    link: 'https://majoo.id',
  },
  {
    title: 'Adalink (Kano)',
    description: 'Link shortening app which has SEO optimization and analytics features. With these features the user will be able to analyze the URL it has.',
    link: '',
  },
  {
    title: 'Hasanah Mobile (Vascomm)',
    description: 'Hasanah Mobile is a banking application owned by BNI Syariah. In this application the user can make transactions digitally while still paying attention to security aspects.',
    link: 'https://vascomm.co.id',
  },
  {
    title: 'Simas Apps',
    description: 'Archives Management Information System and disposition.Is an working app to manage all outgoing and incoming mail as well as managing disposition needs.',
    link: 'https://polije.ac.id',
  },
  {
    title: 'Efinance Apps',
    description: 'Budgeting and Cashflow Information System.Is an application that displays a summary of budget funds in an agency.',
    link: 'https://polije.ac.id',
  },
];

export default function ProjectPage() {
  return (
    <Box sx={{ mx: 'auto', width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Project Management
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          href="/dashboard/project/add"
        >
          Add Project
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ mt: 0 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Link</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project, idx) => (
              <TableRow key={idx}>
                <TableCell>{project.title}</TableCell>
                <TableCell>{project.description}</TableCell>
                <TableCell>
                  {project.link ? (
                    <Button
                      variant="outlined"
                      size="small"
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      N/A
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    size="small"
                    component={Link}
                    href="/dashboard/project/edit"
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
