'use client';

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

export default function ContentPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Content Management
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Here you will be able to create, read, update, and delete content. (Feature coming soon)
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
