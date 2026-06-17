import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Snackbar,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import axios from "axios";
import { updateUser } from "../redux/slices/authSlice";

const API = "http://localhost:5000/api/auth";

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [name, setName] = useState(user?.name || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    if (!name.trim()) {
      setProfileError("Name is required.");
      return;
    }
    setProfileSaving(true);
    try {
      const res = await axios.put(
        `${API}/profile`,
        { name },
        { withCredentials: true }
      );
      dispatch(updateUser(res.data.user));
      setSnackbar({ open: true, message: "Profile updated successfully.", severity: "success" });
    } catch (err) {
      setProfileError(
        err.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await axios.post(
        `${API}/change-password`,
        { currentPassword, newPassword },
        { withCredentials: true }
      );
      setSnackbar({ open: true, message: "Password changed successfully.", severity: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to change password.",
        severity: "error",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <Box
      sx={{
        py: 6,
        px: { xs: 2, md: 4 },
        maxWidth: 700,
        margin: "0 auto",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          mb: 4,
          color: "#f8fafc",
        }}
      >
        Account Settings
      </Typography>

      {/* Profile Section */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          background: "rgba(18, 18, 43, 0.6)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
          <PersonIcon sx={{ color: "#6366f1" }} />
          <Typography
            variant="h6"
            sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
          >
            Profile Information
          </Typography>
        </Box>

        {profileError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {profileError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleUpdateProfile}>
          <TextField
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            value={user?.email || ""}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            disabled
            helperText="Email cannot be changed."
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={profileSaving}
            sx={{ mt: 1 }}
          >
            {profileSaving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Paper>

      {/* Password Section */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          background: "rgba(18, 18, 43, 0.6)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
          <LockIcon sx={{ color: "#6366f1" }} />
          <Typography
            variant="h6"
            sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
          >
            Change Password
          </Typography>
        </Box>

        {passwordError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {passwordError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleChangePassword}>
          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            helperText="Min 8 chars, uppercase, lowercase, number & special character."
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            variant="outlined"
            className="custom-textfield"
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={passwordSaving}
            sx={{ mt: 1 }}
          >
            {passwordSaving ? "Changing..." : "Change Password"}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
