import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Chip,
  Alert,
  Snackbar,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import BlockIcon from "@mui/icons-material/Block";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import {
  fetchInactiveUsers,
  fetchPendingDeletions,
  markForDeletion,
  cancelDeletion,
} from "../../redux/slices/adminSlice";

function formatRemaining(ms) {
  if (ms <= 0) return "Expired";
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function InactiveUserManager() {
  const dispatch = useDispatch();
  const { inactiveUsers, pendingDeletions } = useSelector((state) => state.admin);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    dispatch(fetchInactiveUsers());
    dispatch(fetchPendingDeletions());
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refresh = useCallback(() => {
    dispatch(fetchInactiveUsers());
    dispatch(fetchPendingDeletions());
  }, [dispatch]);

  const handleMarkForDeletion = async (id) => {
    try {
      await dispatch(markForDeletion(id)).unwrap();
      setSnackbar({ open: true, message: "User flagged for deletion. Notification sent.", severity: "success" });
      refresh();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to flag user";
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  const handleCancelDeletion = async (id) => {
    try {
      await dispatch(cancelDeletion(id)).unwrap();
      setSnackbar({ open: true, message: "Deletion cancelled.", severity: "success" });
      refresh();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to cancel deletion";
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }}>
          Inactive User Management
        </Typography>
        <Button variant="outlined" onClick={refresh} size="small">
          Refresh
        </Button>
      </Box>

      {/* Section 1: Inactive Users */}
      <Typography variant="subtitle1" sx={{ fontFamily: "Outfit", fontWeight: 600, mb: 1, color: "text.secondary" }}>
        Inactive Users (30+ days) — {inactiveUsers.length}
      </Typography>

      <Table sx={{ mb: 4, "& .MuiTableCell-root": { borderColor: "rgba(255,255,255,0.05)" } }}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Days Inactive</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {inactiveUsers.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <Chip
                  label={`${u.daysSinceLastActive} days`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleMarkForDeletion(u.id)}
                  title="Flag for deletion"
                >
                  <BlockIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {inactiveUsers.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No inactive users found.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Section 2: Pending Deletions */}
      <Typography variant="subtitle1" sx={{ fontFamily: "Outfit", fontWeight: 600, mb: 1, color: "text.secondary" }}>
        Pending Deletions — {pendingDeletions.length}
      </Typography>

      <Table sx={{ "& .MuiTableCell-root": { borderColor: "rgba(255,255,255,0.05)" } }}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Time Remaining</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pendingDeletions.map((u) => {
            const expired = now >= new Date(u.pendingDeleteAt).getTime();
            const remaining = Math.max(0, new Date(u.pendingDeleteAt).getTime() - now);
            return (
              <TableRow key={u.id} sx={{ opacity: expired ? 0.5 : 1 }}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip
                    icon={<HourglassEmptyIcon />}
                    label={expired ? "Expired — pending removal" : formatRemaining(remaining)}
                    size="small"
                    color={expired ? "error" : "warning"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="default"
                    onClick={() => handleCancelDeletion(u.id)}
                    title="Cancel deletion"
                  >
                    <UndoIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
          {pendingDeletions.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No pending deletions.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
