'use client';

import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, AppBar, Toolbar as MuiToolbar, Typography, Avatar, Box as MuiBox, IconButton } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';
import MenuIcon from '@mui/icons-material/Menu';
import { usePathname, useRouter } from 'next/navigation';

const menuItems = [
  { text: 'Overview', icon: <DashboardIcon />, href: '/dashboard/overview' },
  { text: 'Project', icon: <FolderIcon />, href: '/dashboard/project' },
  { text: 'Content', icon: <ArticleIcon />, href: '/dashboard/content' },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // Mock user data
  const user = {
    name: 'Dani Prasetya',
    avatar: '/assets/images/pp.jpg',
  };

  const expandedWidth = 200;
  const collapsedWidth = 60;
  const appBarHeight = 64;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: 1201, height: appBarHeight }}>
        <MuiToolbar sx={{ justifyContent: 'space-between', minHeight: appBarHeight }}>
          <MuiBox sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton edge="start" color="inherit" sx={{ mr: 2 }} onClick={() => setCollapsed((c) => !c)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ display: collapsed ? 'none' : 'block', transition: 'display 0.2s' }}>
              Dashboard
            </Typography>
          </MuiBox>
          <MuiBox sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={user.avatar} alt={user.name} sx={{ width: 32, height: 32, mr: 1 }} />
            <Typography variant="subtitle1" color="text.primary" sx={{ display: collapsed ? 'none' : 'block', transition: 'display 0.2s' }}>
              {user.name}
            </Typography>
          </MuiBox>
        </MuiToolbar>
      </AppBar>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? collapsedWidth : expandedWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: collapsed ? collapsedWidth : expandedWidth,
            boxSizing: 'border-box',
            top: appBarHeight,
            height: `calc(100vh - ${appBarHeight}px)`
          },
        }}
        PaperProps={{ style: { top: appBarHeight, height: `calc(100vh - ${appBarHeight}px)` } }}
      >
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ justifyContent: 'center' }}>
              <ListItemButton
                selected={pathname.startsWith(item.href)}
                onClick={() => router.push(item.href)}
                sx={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    display: collapsed ? 'none' : 'block',
                    transition: 'display 0.2s',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          mt: `${appBarHeight}px`,
          ml: collapsed ? '24px' : '48px',
          transition: 'margin-left 0.2s',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
