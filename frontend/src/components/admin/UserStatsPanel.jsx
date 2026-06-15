import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Select, MenuItem, FormControl, InputLabel,
  Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, CircularProgress,
} from "@mui/material";
import { fetchUsers, fetchUserStats, clearUserStats } from "../../redux/slices/adminSlice";

function formatDuration(ms) {
  if (!ms) return "0s";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export default function UserStatsPanel() {
  const dispatch = useDispatch();
  const { users, userStats, loading } = useSelector((state) => state.admin);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    return () => { dispatch(clearUserStats()); };
  }, [dispatch]);

  const handleUserChange = (id) => {
    setSelectedUserId(id);
    if (id) dispatch(fetchUserStats(id));
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }} mb={2}>
        User Analytics
      </Typography>

      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <InputLabel>Select User</InputLabel>
        <Select value={selectedUserId} label="Select User" onChange={(e) => handleUserChange(e.target.value)}>
          {users.filter((u) => u.role !== "admin").map((u) => (
            <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
          ))}
        </Select>
      </FormControl>

      {!selectedUserId && (
        <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
          Select a user to view their activity stats
        </Typography>
      )}

      {selectedUserId && loading && (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
      )}

      {selectedUserId && userStats && !loading && (
        <Box display="flex" flexDirection="column" gap={3}>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Paper sx={{ p: 2, flex: 1, minWidth: 140, textAlign: "center", background: "rgba(255,255,255,0.02)" }}>
              <Typography variant="h5" color="#6366f1" sx={{ fontFamily: "Outfit", fontWeight: 800 }}>
                {userStats.totalSessions}
              </Typography>
              <Typography variant="caption" color="textSecondary">Sessions</Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1, minWidth: 140, textAlign: "center", background: "rgba(255,255,255,0.02)" }}>
              <Typography variant="h5" color="#10b981" sx={{ fontFamily: "Outfit", fontWeight: 800 }}>
                {userStats.totalEvents}
              </Typography>
              <Typography variant="caption" color="textSecondary">Events</Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1, minWidth: 140, textAlign: "center", background: "rgba(255,255,255,0.02)" }}>
              <Typography variant="h5" color="#a855f7" sx={{ fontFamily: "Outfit", fontWeight: 800 }}>
                {formatDuration(userStats.totalTimeSpentMs)}
              </Typography>
              <Typography variant="caption" color="textSecondary">Time Spent</Typography>
            </Paper>
          </Box>

          {userStats.sessions && userStats.sessions.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontFamily: "Outfit", fontWeight: 600, mb: 1 }}>
                Session History
              </Typography>
              <Table size="small" sx={{ "& .MuiTableCell-root": { borderColor: "rgba(255,255,255,0.05)" } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Login</TableCell>
                    <TableCell>Logout</TableCell>
                    <TableCell>Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userStats.sessions.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{new Date(s.start).toLocaleString()}</TableCell>
                      <TableCell>{s.end ? new Date(s.end).toLocaleString() : <Chip label="Active" size="small" color="success" />}</TableCell>
                      <TableCell>
                        {s.end ? formatDuration(new Date(s.end) - new Date(s.start)) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
