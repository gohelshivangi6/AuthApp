import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import GlassCard from "../components/GlassCard";
import { loginSuccess } from "../redux/slices/authSlice";
import { login } from "../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Read context warning messages (such as session expirations)
  useEffect(() => {
    if (location.state?.alertMessage) {
      setInfoMessage(location.state.alertMessage);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setInfoMessage("");
    setLoading(true);

    try {
      const res = await login(formData.email, formData.password);

      console.log("Login response:", res.data);

      if (res.data.success) {
        // Handle redirection depending on 2FA completion status
        if (res.data.status === "PENDING_2FA") {
          navigate("/setup-2fa", {
            state: {
              tempToken: res.data.tempToken,
              qrCodeUrl: res.data.qrCodeUrl,
              manualSecret: res.data.manualSecret,
              email: formData.email,
            },
          });
        } else if (res.data.status === "PENDING_2FA_VERIFICATION") {
          navigate("/verify-2fa", {
            state: {
              tempToken: res.data.tempToken,
              email: formData.email,
            },
          });
        } else if (res.data.user) {
          // Direct login (no 2FA required — e.g. admin account)
          dispatch(
            loginSuccess({ user: res.data.user, token: res.data.token }),
          );
          navigate("/dashboards");
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please verify credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        minHeight: "90vh",
        alignItems: "center",
      }}
    >
      <GlassCard>
        <Box sx={{ textAlign: "center" }} mb={3}>
          <VpnKeyIcon sx={{ fontSize: 40, color: "#6366f1", mb: 1 }} />
          <Typography
            variant="h5"
            sx={{ fontFamily: "Outfit", fontWeight: 800 }}
          >
            Welcome Back
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Sign in to access your dashboard
          </Typography>
        </Box>

        {infoMessage && (
          <Alert
            severity="info"
            sx={{
              mb: 3,
              background: "rgba(99, 102, 241, 0.1)",
              color: "#a5b4fc",
              border: "1px solid rgba(99, 102, 241, 0.2)",
            }}
          >
            {infoMessage}
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ff8a8a",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
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
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            disabled={loading}
            autoComplete="current-password"
            // InputProps={{
            //   endAdornment: (
            //     <InputAdornment position="end">
            //       <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#94a3b8' }}>
            //         {showPassword ? <VisibilityOff /> : <Visibility />}
            //       </IconButton>
            //     </InputAdornment>
            //   )
            // }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 1,
            }}
          >
            <Link
              to="/forgot-password"
              style={{
                color: "#94a3b8",
                textDecoration: "none",
                fontSize: "0.85rem",
              }}
            >
              Forgot Password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="custom-btn"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </Button>
        </form>

        <Box mt={2} sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="textSecondary">
            Don't have an account?{" "}
            <Link
              to="/signup"
              style={{
                color: "#6366f1",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Sign Up
            </Link>
          </Typography>
        </Box>
      </GlassCard>
    </Box>
  );
};

export default Login;
