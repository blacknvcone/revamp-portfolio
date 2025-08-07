'use client';

import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';

export default function OverviewPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Content</Typography>
              <Typography variant="h3" color="primary">12</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Projects</Typography>
              <Typography variant="h3" color="primary">6</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
