'use client';

import React, { useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ProfileSidebar from './ProfileSidebar';

import { LayoutContext } from '@/context/LayoutContext';
import { ColorModeContext } from '../../app/providers';
import TableOfContents from './TableOfContent';

export default function RootLayout({ children }) {
  const drawerWidth = 280;
  const navWidth = 240;
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const colorMode = useContext(ColorModeContext);
  const pathname = usePathname();
  const contentRef = useRef();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isMobileRaw = useMediaQuery(theme.breakpoints.down('lg'));
  const isMobile = mounted ? isMobileRaw : false;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (!mounted) {
    return null;
  }

  return (
    <LayoutContext.Provider
      value={{
        drawerWidth,
        navWidth,
        isMobile,
      }}
    >
      <CssBaseline />

      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Mobile App Bar */}
        {isMobile && (
          <AppBar
            position="fixed"
            sx={{
              width: '100%',
              zIndex: theme.zIndex.drawer + 1,
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div">
                  Raven Portfolio
                </Typography>
              </Box>
            </Toolbar>
          </AppBar>
        )}

        {/* Profile Sidebar */}
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              mt: isMobile ? '64px' : 0,
              height: isMobile ? `calc(100% - 64px)` : '100%',
            },
          }}
        >
          <ProfileSidebar />
        </Drawer>

        {/* Main Content + TOC Wrapper */}
        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            flexDirection: 'row',
            pt: isMobile ? '64px' : 0,
            height: '100%',
          }}
        >
          {/* Main Scrollable Content */}
          <Box
            component="main"
            ref={contentRef}
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              px: 3,
              py: 3,
            }}
          >
            {children}
          </Box>

          {/* Sticky TOC */}
          {!isMobile && pathname.startsWith('/about') && (
            <Box
              sx={{
                width: navWidth,
                flexShrink: 0,
                px: 2,
              }}
            >
              <Box
                sx={{
                  position: 'sticky',
                  top: 80,
                }}
              >
                <TableOfContents scrollContainerRef={contentRef} />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </LayoutContext.Provider>
  );
}
