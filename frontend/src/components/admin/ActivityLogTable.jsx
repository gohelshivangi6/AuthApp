import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TablePagination, Select, MenuItem, FormControl, InputLabel,
  Chip, CircularProgress,
} from "@mui/material";
import { fetchActivityLogs, fetchUsers } from "../../redux/slices/adminSlice";

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString();
}

export default function ActivityLogTable() {
  const dispatch = useDispatch();
  const { activityLogs, activityLogsTotal, users, loading } = useSelector((state) => state.admin);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [typeFilter, setTypeFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    const params = { page: page + 1, limit: rowsPerPage };
    if (typeFilter) params.type = typeFilter;
    if (userIdFilter) params.userId = userIdFilter;
    dispatch(fetchActivityLogs(params));
  }, [dispatch, page, rowsPerPage, typeFilter, userIdFilter]);

  const getChipColor = (type) => {
    switch (type) {
      case "session_start": return "success";
      case "session_end": return "error";
      case "page_view": return "info";
      case "event": return "warning";
      default: return "default";
    }
  };

  const userName = (id) => users.find((u) => u.id === id)?.name || id?.slice(0, 8) || "—";

  return (
    <Box>
      <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }} mb={2}>
        Activity Logs
      </Typography>

      <Box display="flex" gap={2} mb={2}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Event Type</InputLabel>
          <Select value={typeFilter} label="Event Type" onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="session_start">Session Start</MenuItem>
            <MenuItem value="session_end">Session End</MenuItem>
            <MenuItem value="page_view">Page View</MenuItem>
            <MenuItem value="event">Event</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>User</InputLabel>
          <Select value={userIdFilter} label="User" onChange={(e) => { setUserIdFilter(e.target.value); setPage(0); }}>
            <MenuItem value="">All</MenuItem>
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Table sx={{ "& .MuiTableCell-root": { borderColor: "rgba(255,255,255,0.05)" } }} size="small">
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {activityLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
              <TableCell>{userName(log.userId)}</TableCell>
              <TableCell>
                <Chip label={log.type} size="small" color={getChipColor(log.type)} variant="outlined" />
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ fontFamily: "monospace", fontSize: 11 }}>
                  {JSON.stringify(log.metadata || {})}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          {activityLogs.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography variant="body2" color="textSecondary">No activity logs.</Typography>
              </TableCell>
            </TableRow>
          )}
          {loading && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={activityLogsTotal}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Box>
  );
}
