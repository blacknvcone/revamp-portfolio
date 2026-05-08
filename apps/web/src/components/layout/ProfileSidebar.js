'use client';
import React, { useContext } from 'react';
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  useTheme,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { Home, Person, Work, Email } from '@mui/icons-material';
import Image from 'next/image';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ColorModeContext } from '../../app/providers';

export default function ProfileSidebar({ profile }) {
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();

  const name = profile?.name || 'Dani Prasetya';
  const headline = profile?.headline || 'Software Engineer | Backend Developer';
  const avatar = profile?.avatar?.url || '/assets/images/pp.jpg';
  const email = profile?.socialLinks?.find((l) => l.platform === 'email')?.url || 'dani.prasetya.dev@gmail.com';
  const location = profile?.socialLinks?.find((l) => l.platform === 'location')?.url || 'Surabaya, Indonesia';

  return (
    <Box
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 100,
            height: 100,
            mb: 2,
            border: '3px solid',
            borderColor: 'primary.main',
            borderRadius: '50%',
            overflow: 'hidden',
          }}
        >
          <Image
            src={avatar}
            alt={name}
            width={100}
            height={100}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            priority
          />
        </Box>

        <Typography variant="h6" component="h1" fontWeight="bold">
          {name}
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" mb={3}>
          {headline}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Table size="small" sx={{ width: 'auto', mx: 'auto' }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: 0, pr: 1 }}>📧</TableCell>
                <TableCell sx={{ border: 0, p: 0 }}>
                  <Typography variant="body2" color="text.primary">
                    {email}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ border: 0, pr: 1 }}>🌍</TableCell>
                <TableCell sx={{ border: 0, p: 0 }}>
                  <Typography variant="body2" color="text.primary">
                    {location}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ width: '100%', my: 2 }} />
      </Box>

      <List sx={{ flexGrow: 1 }}>
        {[
          { text: 'Home', icon: <Home />, href: '/' },
          { text: 'About', icon: <Person />, href: '/about' },
          { text: 'Projects', icon: <Work />, href: '/projects' },
        ].map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton href={item.href}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          pt: 1,
          mt: 2,
        }}
      >
        <IconButton onClick={colorMode.toggleColorMode} color="inherit">
          {theme.palette.mode === 'dark' ? (
            <Brightness7Icon />
          ) : (
            <Brightness4Icon />
          )}
        </IconButton>
      </Box>
    </Box>
  );
}
