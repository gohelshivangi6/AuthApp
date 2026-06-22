import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../routes/AuthContext';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess } from '../redux/slices/authSlice';
import { verify2FASetup } from '../services/authService';

const Setup2FA = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // const { setUser } = useAuth();
  // Extract state passed from Signup or Login
  const { tempToken, qrCodeUrl, manualSecret, email } = location.state || {};

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Crash protection: If accessed without token, redirect to login
  useEffect(() => {
    if (!tempToken) {
      navigate('/login', {
        state: { alertMessage: 'Please sign up or log in first to configure 2FA.' }
      });
    }
  }, [tempToken, navigate]);

  const handleChange = (e) => {
    const val = e.target.value;
    // Allow only numeric digits up to 6 characters
    if (/^\d*$/.test(val) && val.length <= 6) {
      setCode(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Verification code must be exactly 6 digits.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      dispatch(loginStart());
      const res = await verify2FASetup(code, tempToken);
      console.log('2FA verification response:', res.data);
      if (res.data.success) {
        setError('');
        dispatch(loginSuccess({ user: res.data.user, token: res.data.token }));
        // setUser(res.data.user);
        setSuccess('2FA Setup completed successfully! Redirecting...');
        setTimeout(() => {
          // Redirect to dashboard (full session exists via cookies)
          navigate('/dashboards');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tempToken) return null; // Avoid rendering content if redirecting

  return (
    <Box display="flex" minHeight="90vh" alignItems="center" justifyContent="center">
      <GlassCard>
        <Box textAlign="center" mb={3}>
          <ShieldIcon sx={{ fontSize: 40, color: '#10b981', mb: 1 }} />
          <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Enable 2FA
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Two-Factor Authentication is required for email:
          </Typography>
          <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
            {email}
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

        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Typography variant="body2" color="textSecondary" textAlign="center" mb={2}>
            Scan the QR code below using your Google Authenticator or Authy app:
          </Typography>

          <Paper
            elevation={4}
            sx={{
              p: 1.5,
              background: 'white',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2
            }}
          >
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="2FA QR Code" style={{ width: '180px', height: '180px' }} />
            )}
          </Paper>

          <Divider sx={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

          <Typography variant="caption" color="textSecondary" mt={1}>
            Can't scan? Enter this code manually:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              background: 'rgba(255, 255, 255, 0.05)',
              px: 2,
              py: 0.5,
              borderRadius: '4px',
              letterSpacing: '0.1em',
              fontWeight: 'bold',
              color: '#a855f7',
              mt: 0.5
            }}
          >
            {manualSecret}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="6-Digit Verification Code"
            variant="outlined"
            className="custom-textfield"
            value={code}
            onChange={handleChange}
            placeholder="e.g. 123456"
            disabled={loading}
            inputProps={{
              maxLength: 6,
              inputMode: 'numeric',
              style: { textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.2rem', fontFamily: 'monospace' }
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="custom-btn"
            disabled={loading || code.length !== 6}
            sx={{ mt: 3, mb: 1 }}
          >
            {loading ? 'Verifying...' : 'Verify & Activate'}
          </Button>
        </form>
      </GlassCard>
    </Box>
  );
};

export default Setup2FA;
