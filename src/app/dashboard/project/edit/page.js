'use client';

import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';

// Mock project data to edit
const mockProject = {
  title: 'Majoo POS',
  description: 'The POS application provides detailed reports on sales performance, customer trends, and best-selling products.',
  link: 'https://majoo.id',
};

export default function EditProjectPage() {
  const [title, setTitle] = useState(mockProject.title);
  const [description, setDescription] = useState(mockProject.description);
  const [link, setLink] = useState(mockProject.link);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Title and Description are required.');
      return;
    }
    setError('');
    // Here you would handle the submit logic (API call, etc.)
    alert('Project updated! (UI only)');
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Edit Project
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            minRows={3}
            required
          />
          <TextField
            label="Link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            fullWidth
            margin="normal"
            type="url"
          />
          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button type="submit" variant="contained" sx={{ mt: 2 }} fullWidth>
            Update Project
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
