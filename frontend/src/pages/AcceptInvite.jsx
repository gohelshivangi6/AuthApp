import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import axios from "axios";
import GlassCard from "../components/GlassCard";

const AcceptInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token || !email) {
    return (
      <Box
        display="flex"
        minHeight="90vh"
        alignItems="center"
        justifyContent="center"
      >
        <GlassCard>
          <Alert severity="error">
            Invalid invitation link. The link is missing required information.
          </Alert>
        </GlassCard>
      </Box>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/accept-invite",
        { token, email, name, password }
      );
      setSuccess(res.data.message);
      setTimeout(() => {
        navigate("/login", {
          state: { alertMessage: "Account activated! Please log in." },
        });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to accept invitation. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      minHeight="90vh"
      alignItems="center"
      justifyContent="center"
    >
      <GlassCard>
        <Box textAlign="center" mb={3}>
          <MarkEmailReadIcon
            sx={{ fontSize: 40, color: "#6366f1", mb: 1 }}
          />
          <Typography
            variant="h5"
            sx={{ fontFamily: "Outfit", fontWeight: 800 }}
          >
            Accept Invitation
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Set up your account to get started
          </Typography>
        </Box>

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

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              background: "rgba(16, 185, 129, 0.1)",
              color: "#6ee7b7",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            value={email}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            disabled
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            disabled={loading}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: "#94a3b8" }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirm(!showConfirm)}
                    edge="end"
                    sx={{ color: "#94a3b8" }}
                  >
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="Min 8 chars, uppercase, lowercase, number & special character."
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="custom-btn"
            disabled={loading}
            sx={{ mt: 2, mb: 2 }}
          >
            {loading ? "Activating..." : "Activate Account"}
          </Button>
        </Box>
      </GlassCard>
    </Box>
  );
};

export default AcceptInvite;
