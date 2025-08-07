'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';

export default function DashboardPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 4,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Welcome, Admin!</Typography>
              <Typography variant="body2" color="text.secondary">
                This is your dashboard. Here you can manage your portfolio content and view analytics (feature coming soon).
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* Placeholder for future widgets or admin features */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6">Feature Placeholder</Typography>
              <Typography variant="body2" color="text.secondary">
                Add new admin features here, such as project management, stats, or notifications.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
