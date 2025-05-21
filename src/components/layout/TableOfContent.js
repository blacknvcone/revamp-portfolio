'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';

const sections = [
  { label: 'About Me', id: 'about' },
  { label: 'Skills', id: 'skills' },
  { label: 'Work Experience', id: 'work' },
  { label: 'Educations', id: 'education' },
  { label: 'Certifications', id: 'certification' },
];

export default function TableOfContents({ scrollContainerRef }) {
  const [activeId, setActiveId] = useState('');
  const observer = useRef(null);
  const offset = 120; // can also be a prop for more flexibility

  useEffect(() => {
    const container = scrollContainerRef?.current || window;

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };

    // Clean up previous observer
    if (observer.current) {
      observer.current.disconnect();
    }

    // Create IntersectionObserver with rootMargin to offset detection point
    observer.current = new IntersectionObserver(handleIntersect, {
      root: scrollContainerRef?.current || null,
      rootMargin: `-${offset}px 0px 0px 0px`,
      threshold: 0,
    });

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.current.observe(el);
    });

    // Cleanup
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [scrollContainerRef]);

  // Smooth scrolling handler for links
  const handleClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    const container = scrollContainerRef?.current || window;

    if (!el) return;

    if (container === window) {
      window.scrollTo({
        top: el.offsetTop - offset,
        behavior: 'smooth',
      });
    } else {
      container.scrollTo({
        top: el.offsetTop - offset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 80,
        display: { xs: 'none', md: 'block' },
      }}
    >
      <Typography variant="h6" gutterBottom>
        Contents
      </Typography>
      <List>
        {sections.map(({ label, id }) => (
          <ListItemButton
            key={id}
            component="a"
            href={`#${id}`}
            onClick={(e) => handleClick(e, id)}
            selected={activeId === id}
            aria-current={activeId === id ? 'true' : undefined}
            sx={{
              position: 'relative',
              pl: 2, // padding left to make space for the left border
              borderLeft:
                activeId === id ? '3px solid #1976d2' : '3px solid transparent', // blue left border or transparent
              color: activeId === id ? '#1976d2' : 'inherit', // blue text or default
              fontWeight: activeId === id ? '600' : '400',
              '&:hover': {
                backgroundColor:
                  activeId === id ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                color: '#1976d2',
                borderLeftColor: '#1976d2',
              },
            }}
          >
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
