// src/context/LayoutContext.js
'use client';
import { createContext } from 'react';

export const LayoutContext = createContext({
  drawerWidth: 240,
  navWidth: 200,
  isMobile: false,
});
