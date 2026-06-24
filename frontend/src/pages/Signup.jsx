import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import GlassCard from '../components/GlassCard';
import { loginStart } from '../redux/slices/authSlice';
import { signup } from '../services/authService';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    website: '' // Honeypot field (hidden from normal users)
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password requirements checklist state
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      Object.values(checks).every((val) => val === true)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setError('');
    setLoading(true);

    try {

      const res = await signup(formData.name, formData.email, formData.password);

      if (res.data.success) {
        // Redirection to 2FA Setup
        navigate('/setup-2fa', {
          state: {
            tempToken: res.data.tempToken,
            qrCodeUrl: res.data.qrCodeUrl,
            manualSecret: res.data.manualSecret,
            email: formData.email,
            name: formData.name
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <LockOpenIcon sx={{ fontSize: 40, color: '#6366f1', mb: 1 }} />
          <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Create Account
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Sign up to get started
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, background: 'rgba(239, 68, 68, 0.1)', color: '#ff8a8a', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Honeypot field - Hidden from standard browsers and screenreaders */}
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleChange}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#94a3b8' }}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            disabled={loading}
          />

          {/* Password Validation Checklist */}
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
            sx={{ mt: 2, mb: 2 }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <Box mt={2} sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="textSecondary">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>
              Log In
            </Link>
          </Typography>
        </Box>
      </GlassCard>
    </Box>
  );
};

export default Signup;
