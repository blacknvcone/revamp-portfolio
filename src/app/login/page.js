'use client';

import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, CardActions } from '@mui/material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ minWidth: 350, p: 2 }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom align="center">
            Admin Login
          </Typography>
          <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </Box>
        </CardContent>
        <CardActions sx={{ justifyContent: 'center' }}>
          <Button variant="contained" color="primary" fullWidth>
            Login
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}
