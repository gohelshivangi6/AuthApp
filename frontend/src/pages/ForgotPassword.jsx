import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import axios from 'axios';
import GlassCard from '../components/GlassCard';

const API_URL = 'http://localhost:5000/api/auth/forgot-password';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post(API_URL, { email });
      if (res.data.success) {
        setSuccess(res.data.message || 'If that email is registered, a password reset link has been sent to it.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" minHeight="90vh" alignItems="center" justifyContent="center">
      <GlassCard>
        <Box textAlign="center" mb={3}>
          <ContactSupportIcon sx={{ fontSize: 40, color: '#6366f1', mb: 1 }} />
          <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Forgot Password?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Enter your email to receive a password reset link
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, background: 'rgba(239, 68, 68, 0.1)', color: '#ff8a8a', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3, background: 'rgba(16, 185, 129, 0.1)', color: '#a7f3d0', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            {success}
          </Alert>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              variant="outlined"
              className="custom-textfield"
              disabled={loading}
              autoComplete="email"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="custom-btn"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Submitting request...' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <Box mt={2} textAlign="center">
          <Typography variant="body2" color="textSecondary">
            Remember your credentials?{' '}
            <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>
              Log In
            </Link>
          </Typography>
        </Box>
      </GlassCard>
    </Box>
  );
};

export default ForgotPassword;
