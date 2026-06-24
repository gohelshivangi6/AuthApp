import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LockResetIcon from '@mui/icons-material/LockReset';
import GlassCard from '../components/GlassCard';
import { resetPassword } from '../services/authService';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [checks, setChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false
  });

  useEffect(() => {
    const { password, confirmPassword } = formData;
    setChecks({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password.length > 0 && password === confirmPassword
    });
  }, [formData.password, formData.confirmPassword]);

  // Crash prevention: Verify reset token is present in the URL
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Token is missing.');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isFormValid = () => {
    return token && Object.values(checks).every((val) => val === true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await resetPassword(token, formData.password);

      if (res.data.success) {
        setSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const requirementItem = (label, met) => (
    <ListItem disablePadding key={label} sx={{ mb: 0.5 }}>
      <ListItemIcon sx={{ minWidth: 28, color: met ? '#10b981' : '#64748b' }}>
        {met ? (
          <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
        ) : (
          <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} />
        )}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          fontSize: '0.75rem',
          color: met ? '#f8fafc' : '#94a3b8'
        }}
      />
    </ListItem>
  );

  return (
    <Box sx={{
          display: "flex",
          justifyContent: "center",
          minHeight: "90vh",
          alignItems: "center",
        }}>
      <GlassCard>
        <Box sx={{ textAlign: "center" }} mb={3}>
          <LockResetIcon sx={{ fontSize: 40, color: '#6366f1', mb: 1 }} />
          <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Reset Password
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Set a new strong password for your account
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

        {!token && (
          <Box sx={{ textAlign: "center" }} mt={2}>
            <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>
              Return to Login
            </Link>
          </Box>
        )}

        {token && !success && (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="New Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              className="custom-textfield"
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              className="custom-textfield"
              disabled={loading}
            />

            {/* Checklist */}
            {formData.password && (
              <Box mt={2} mb={2} p={2} sx={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography variant="caption" display="block" color="textSecondary" mb={1} fontWeight="bold">
                  Password Requirements:
                </Typography>
                <List dense>
                  {requirementItem('At least 8 characters long', checks.length)}
                  {requirementItem('At least one uppercase letter (A-Z)', checks.uppercase)}
                  {requirementItem('At least one lowercase letter (a-z)', checks.lowercase)}
                  {requirementItem('At least one number (0-9)', checks.number)}
                  {requirementItem('At least one special character (!@#$ etc.)', checks.special)}
                  {requirementItem('Passwords match', checks.match)}
                </List>
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="custom-btn"
              disabled={loading || !isFormValid()}
              sx={{ mt: 3, mb: 1 }}
            >
              {loading ? 'Resetting password...' : 'Update Password'}
            </Button>
          </form>
        )}
      </GlassCard>
    </Box>
  );
};

export default ResetPassword;
