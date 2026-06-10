import React from 'react';
import { Box } from '@mui/material';

const GlassCard = ({ children, className = '', ...props }) => {
  return (
    <Box
      className={`glass-container fade-in ${className}`}
      sx={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        background: 'rgba(18, 18, 38, 0.65)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        padding: { xs: '2rem 1.5rem', sm: '2.5rem' },
        width: '100%',
        maxWidth: '450px',
        margin: 'auto'
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default GlassCard;
