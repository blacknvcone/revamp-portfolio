'use client';

import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';

export default function AddProjectPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Title and Description are required.');
      return;
    }
    setError('');
    // Here you would handle the submit logic (API call, etc.)
    alert('Project added! (UI only)');
  };

  return (
    <Box sx={{ mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Add Project
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
            Add Project
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
