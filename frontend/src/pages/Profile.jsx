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
  Divider,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import SecurityIcon from "@mui/icons-material/Security";
import {
  updateProfile,
  changePassword,
  generate2FASecret,
  enable2FA,
  disable2FA,
} from "../services/authService";
import { updateUser } from "../redux/slices/authSlice";

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [name, setName] = useState(user?.name || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [enabling2FA, setEnabling2FA] = useState(false);
  const [enableError, setEnableError] = useState("");
  const [generating, setGenerating] = useState(false);

  const [show2FADisable, setShow2FADisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [disableError, setDisableError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    if (!name.trim()) {
      setProfileError("Name is required.");
      return;
    }
    setProfileSaving(true);
    try {
      const res = await updateProfile(name);
      dispatch(updateUser(res.data.user));
      setSnackbar({
        open: true,
        message: "Profile updated successfully.",
        severity: "success",
      });
    } catch (err) {
      setProfileError(
        err.response?.data?.message || "Failed to update profile.",
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
      await changePassword(currentPassword, newPassword);
      setSnackbar({
        open: true,
        message: "Password changed successfully.",
        severity: "success",
      });
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

  const handleGenerate2FA = async () => {
    setEnableError("");
    setGenerating(true);
    try {
      const res = await generate2FASecret();
      setQrCodeUrl(res.data.qrCodeUrl);
      setManualSecret(res.data.manualSecret);
      setTempToken(res.data.tempToken);
      setShow2FASetup(true);
    } catch (err) {
      setEnableError(
        err.response?.data?.message || "Failed to generate 2FA setup.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleEnable2FA = async (e) => {
    e.preventDefault();
    setEnableError("");
    if (!verifyCode || verifyCode.length !== 6) {
      setEnableError("Please enter a valid 6-digit verification code.");
      return;
    }
    setEnabling2FA(true);
    try {
      const res = await enable2FA(verifyCode, tempToken);
      dispatch(updateUser(res.data.user));
      setSnackbar({
        open: true,
        message: "Two-Factor Authentication enabled successfully.",
        severity: "success",
      });
      setShow2FASetup(false);
      setVerifyCode("");
      setQrCodeUrl("");
      setManualSecret("");
      setTempToken("");
    } catch (err) {
      setEnableError(err.response?.data?.message || "Failed to enable 2FA.");
    } finally {
      setEnabling2FA(false);
    }
  };

  const handleCancel2FASetup = () => {
    setShow2FASetup(false);
    setVerifyCode("");
    setQrCodeUrl("");
    setManualSecret("");
    setTempToken("");
    setEnableError("");
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setDisableError("");
    if (!disablePassword) {
      setDisableError("Password is required.");
      return;
    }
    setDisabling2FA(true);
    try {
      const res = await disable2FA(disablePassword);
      dispatch(updateUser(res.data.user));
      setSnackbar({
        open: true,
        message: "Two-Factor Authentication disabled successfully.",
        severity: "success",
      });
      setShow2FADisable(false);
      setDisablePassword("");
    } catch (err) {
      setDisableError(err.response?.data?.message || "Failed to disable 2FA.");
    } finally {
      setDisabling2FA(false);
    }
  };

  const handleCancel2FADisable = () => {
    setShow2FADisable(false);
    setDisablePassword("");
    setDisableError("");
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
          gap={1.5}
          mb={3}
        >
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
          gap={1.5}
          mb={3}
        >
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

      {/* Two-Factor Authentication Section */}
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
          gap={1.5}
          mb={3}
        >
          <SecurityIcon sx={{ color: "#6366f1" }} />
          <Typography
            variant="h6"
            sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
          >
            Two-Factor Authentication
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>
          {user?.hasTwoFactor
            ? "Two-factor authentication is currently enabled. Your account is protected with an authenticator app."
            : "Add an extra layer of security by enabling two-factor authentication via an authenticator app."}
        </Typography>

        {user?.hasTwoFactor ? (
          <>
            {!show2FADisable ? (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setShow2FADisable(true)}
                sx={{ mt: 1 }}
              >
                Disable Two-Factor Authentication
              </Button>
            ) : (
              <Box component="form" onSubmit={handleDisable2FA}>
                {disableError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {disableError}
                  </Alert>
                )}
                <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>
                  To disable 2FA, please enter your current password.
                </Typography>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  className="custom-textfield"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: "flex" }} gap={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="error"
                    disabled={disabling2FA}
                  >
                    {disabling2FA ? "Disabling..." : "Disable 2FA"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancel2FADisable}
                    disabled={disabling2FA}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </>
        ) : (
          <>
            {!show2FASetup ? (
              <Button
                variant="contained"
                onClick={handleGenerate2FA}
                disabled={generating}
                sx={{ mt: 1 }}
              >
                {generating
                  ? "Generating..."
                  : "Enable Two-Factor Authentication"}
              </Button>
            ) : (
              <Box>
                {enableError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {enableError}
                  </Alert>
                )}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    style={{
                      width: 180,
                      height: 180,
                      borderRadius: 8,
                      imageRendering: "pixelated",
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#94a3b8",
                    textAlign: "center",
                    mb: 2,
                    wordBreak: "break-all",
                  }}
                >
                  Or enter this key manually: <strong>{manualSecret}</strong>
                </Typography>
                <Divider
                  sx={{ mb: 2, borderColor: "rgba(255,255,255,0.08)" }}
                />
                <Box
                  component="form"
                  onSubmit={handleEnable2FA}
                  sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <TextField
                    fullWidth
                    label="Verification Code"
                    value={verifyCode}
                    onChange={(e) =>
                      setVerifyCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    margin="normal"
                    variant="outlined"
                    className="custom-textfield"
                    placeholder="000000"
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    helperText="Enter the 6-digit code from your authenticator app."
                    sx={{ mb: 0 }}
                  />
                  <Box sx={{ display: "flex" }} gap={2}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={enabling2FA}
                    >
                      {enabling2FA ? "Verifying..." : "Verify & Enable"}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancel2FASetup}
                      disabled={enabling2FA}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </>
        )}
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
