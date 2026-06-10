import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Tooltip,
  Paper,
  CircularProgress
} from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import LinkIcon from '@mui/icons-material/Link';
import axios from 'axios';

const DEV_API_URL = 'http://localhost:5000/api/auth/dev/emails';

const DevMailbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchEmails = async () => {
    try {
      setError(false);
      const res = await axios.get(DEV_API_URL);
      if (res.data && res.data.success) {
        setEmails(res.data.emails);
      }
    } catch (err) {
      console.warn('Developer Mailbox failed to fetch emails (server offline?)');
      setError(true);
    }
  };

  const clearMailbox = async () => {
    try {
      setLoading(true);
      await axios.post(`${DEV_API_URL}/clear`);
      setEmails([]);
    } catch (err) {
      console.error('Failed to clear mailbox', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for new emails every 5 seconds when drawer is open, or on mount for badge counts
  // useEffect(() => {
  //   fetchEmails();
  //   const interval = setInterval(fetchEmails, 5000);
  //   return () => clearInterval(interval);
  // }, []);

  useEffect(() => {
  if (!isOpen) return;

  fetchEmails();

  const interval = setInterval(fetchEmails, 5000);

  return () => clearInterval(interval);
}, [isOpen]);

  // Helper to extract clickable URLs from plain text
  const extractUrl = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  };

  return (
    <>
      {/* Floating Badge button */}
      <Tooltip title="Developer Mailbox (Simulated SMTP)" placement="left">
        <IconButton
          onClick={() => {
            setIsOpen(true);
            fetchEmails();
          }}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            zIndex: 1300,
            background: 'linear-gradient(135deg, #10b981, #6366f1)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            animation: 'pulseGlow 3s infinite',
            '&:hover': {
              transform: 'scale(1.05)',
              filter: 'brightness(1.1)'
            }
          }}
        >
          <Badge badgeContent={emails.length} color="error" max={9}>
            <MailIcon fontSize="large" />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            background: 'rgba(10, 10, 22, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#f8fafc',
            padding: 3
          }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
              Simulated Mailbox
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Catching verification OTPs & links
            </Typography>
          </Box>
          <IconButton onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box display="flex" gap={1} mb={2}>
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            size="small"
            onClick={fetchEmails}
            sx={{
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              '&:hover': { borderColor: '#6366f1' }
            }}
          >
            Refresh
          </Button>
          <Button
            startIcon={<DeleteSweepIcon />}
            variant="outlined"
            color="error"
            size="small"
            disabled={emails.length === 0 || loading}
            onClick={clearMailbox}
          >
            Clear
          </Button>
        </Box>

        {error && (
          <Typography variant="body2" color="error" mb={2}>
            * Backend server seems offline. Run the server to fetch emails.
          </Typography>
        )}

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress color="secondary" />
          </Box>
        ) : emails.length === 0 ? (
          <Box py={8} textAlign="center">
            <MailIcon sx={{ fontSize: 48, color: '#334155', mb: 2 }} />
            <Typography variant="body2" color="textSecondary">
              No emails sent yet. Trigger signup or forgot-password to see verification links.
            </Typography>
          </Box>
        ) : (
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
            {emails.map((email) => {
              const resetUrl = extractUrl(email.text);
              return (
                <ListItem
                  key={email.id}
                  component={Paper}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    p: 2,
                    color: 'white'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                    <Typography variant="caption" color="#10b981" fontWeight="bold">
                      To: {email.to}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(email.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold" mb={1} sx={{ fontFamily: 'Outfit' }}>
                    {email.subject}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                    {email.text}
                  </Typography>
                  
                  {resetUrl && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<LinkIcon />}
                      href={resetUrl.replace('http://localhost:5173', window.location.origin)}
                      target="_blank"
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        '&:hover': { filter: 'brightness(1.1)' }
                      }}
                    >
                      Follow Reset Link
                    </Button>
                  )}
                </ListItem>
              );
            })}
          </List>
        )}
      </Drawer>
    </>
  );
};

export default DevMailbox;
