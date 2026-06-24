import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import CircleIcon from "@mui/icons-material/Circle";
import { getAdminSocket } from "../../utils/websocket";
import { fetchActiveUsers, forceLogoutUser, updateUserStatusLocally } from "../../redux/slices/adminSlice";

function formatDuration(sec) {
  if (!sec && sec !== 0) return "—";
  const mins = Math.floor(sec / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m ${sec % 60}s`;
  return `${sec}s`;
}

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString();
}

import RefreshIcon from "@mui/icons-material/Refresh";

export default function InactiveUserManager() {
  const dispatch = useDispatch();
  const { activeUsers } = useSelector((state) => state.admin);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [confirmUserId, setConfirmUserId] = useState(null);

  useEffect(() => {
    dispatch(fetchActiveUsers());
  }, [dispatch]);

  const refreshRef = useRef();

  useEffect(() => {
    refreshRef.current = () => {
      dispatch(fetchActiveUsers());
    };
  });

  useEffect(() => {
    const socket = getAdminSocket();
    if (!socket) return;

    const deletionHandler = () => refreshRef.current?.();
    const statusHandler = (data) => {
      if (data && data.userId) {
        dispatch(updateUserStatusLocally(data));
        
        // If it's a new active user and we didn't get their data, fetch the full list just in case
        if (data.status === "active" && !data.user) {
           refreshRef.current?.();
        }
      } else {
        refreshRef.current?.();
      }
    };
    
    socket.on("deletion-update", deletionHandler);
    socket.on("user-status-changed", statusHandler);
    return () => { 
      socket.off("deletion-update", deletionHandler); 
      socket.off("user-status-changed", statusHandler);
    };
  }, [dispatch]);

  const handleForceLogout = async (id) => {
    try {
      await dispatch(forceLogoutUser(id)).unwrap();
      setSnackbar({ open: true, message: "User logged out. Notification sent.", severity: "success" });
      setConfirmUserId(null);
      refreshRef.current?.();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to logout user";
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  const handleManualRefresh = () => {
    dispatch(fetchActiveUsers());
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }}>
          Currently Active Users
        </Typography>
        {/* <Button 
          variant="outlined" 
          size="small" 
          startIcon={<RefreshIcon />} 
          onClick={handleManualRefresh}
          sx={{ fontFamily: "Outfit", borderColor: "rgba(255,255,255,0.2)", color: "text.primary" }}
        >
          Refresh
        </Button> */}
      </Box>

      <Typography variant="subtitle1" sx={{ fontFamily: "Outfit", fontWeight: 600, mb: 1, color: "text.secondary" }}>
        Logged In — {activeUsers.length}
      </Typography>

      <Table sx={{ mb: 4, "& .MuiTableCell-root": { borderColor: "rgba(255,255,255,0.05)" } }}>
        <TableHead>
          <TableRow>
            <TableCell>Status</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            {/* <TableCell>Last Activity</TableCell> */}
            {/* <TableCell>Session Duration</TableCell> */}
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {activeUsers.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <Tooltip title={u.hasInactivityWarning ? "Inactivity warning sent" : "Active"}>
                  <CircleIcon
                    sx={{
                      fontSize: 12,
                      color: u.hasInactivityWarning ? "#f59e0b" : "#10b981",
                      verticalAlign: "middle",
                    }}
                  />
                </Tooltip>
              </TableCell>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              {/* <TableCell>
                <Chip
                  label={formatTime(u.lastActivityAt)}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "rgba(255,255,255,0.1)" }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDuration(u.sessionDurationSec)}
                </Typography>
              </TableCell> */}
              <TableCell align="right">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setConfirmUserId(u.id)}
                  title="Force logout user"
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {activeUsers.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No active users found.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={confirmUserId !== null}
        onClose={() => setConfirmUserId(null)}
        PaperProps={{ sx: { bgcolor: "#1e1e38", borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontFamily: "Outfit", fontWeight: 700 }}>
          Confirm Force Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary" }}>
            Are you sure you want to force logout{' '}
            <strong>{activeUsers.find((u) => u.id === confirmUserId)?.name || "this user"}</strong>
            ? They will be disconnected immediately and must sign in again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmUserId(null)}
            sx={{ color: "text.secondary", fontFamily: "Inter" }}
          >
            No
          </Button>
          <Button
            onClick={() => handleForceLogout(confirmUserId)}
            variant="contained"
            color="error"
            sx={{ fontFamily: "Outfit", fontWeight: 600 }}
          >
            Yes, logout
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
