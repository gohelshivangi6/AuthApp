import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Select, MenuItem, FormControl, InputLabel,
  Switch, FormControlLabel, Paper, Chip, CircularProgress,
} from "@mui/material";
import {
  fetchUsers, fetchDepartments, fetchWidgets,
  fetchPermissions, createPermission, deletePermission,
} from "../../redux/slices/adminSlice";

export default function PermissionManager() {
  const dispatch = useDispatch();
  const { users, departments, widgets, permissions, loading } = useSelector((state) => state.admin);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchDepartments());
    dispatch(fetchWidgets());
  }, [dispatch]);

  useEffect(() => {
    if (selectedUserId) {
      dispatch(fetchPermissions(selectedUserId));
    }
  }, [dispatch, selectedUserId]);

  const userPerms = permissions;

  const isGranted = (targetType, targetId) => {
    const perm = userPerms.find(
      (p) => p.targetType === targetType && p.targetId === targetId
    );
    if (!perm) return targetType === "department";
    return perm.granted;
  };

  const handleToggle = async (targetType, targetId, currentlyGranted) => {
    if (currentlyGranted) {
      const perm = userPerms.find(
        (p) => p.targetType === targetType && p.targetId === targetId
      );
      if (perm) {
        await dispatch(deletePermission(perm.id));
      } else {
        await dispatch(createPermission({
          userId: selectedUserId,
          targetType,
          targetId,
          granted: false,
        }));
      }
    } else {
      const perm = userPerms.find(
        (p) => p.targetType === targetType && p.targetId === targetId
      );
      if (perm) {
        await dispatch(createPermission({
          userId: selectedUserId,
          targetType,
          targetId,
          granted: true,
        }));
      } else {
        await dispatch(createPermission({
          userId: selectedUserId,
          targetType,
          targetId,
          granted: true,
        }));
      }
    }
    dispatch(fetchPermissions(selectedUserId));
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }} mb={2}>
        Department & Widget Permissions
      </Typography>

      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <InputLabel>Select User</InputLabel>
        <Select
          value={selectedUserId}
          label="Select User"
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          {users.filter((u) => u.role !== "admin").map((u) => (
            <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
          ))}
        </Select>
      </FormControl>

      {!selectedUserId && (
        <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
          Select a user to manage permissions
        </Typography>
      )}

      {selectedUserId && loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={24} />
        </Box>
      )}

      {selectedUserId && !loading && (
        <Box display="flex" flexDirection="column" gap={3}>
          <Paper sx={{ p: 2, background: "rgba(255,255,255,0.02)" }}>
            <Typography variant="subtitle2" sx={{ fontFamily: "Outfit", fontWeight: 600, mb: 1 }}>
              Department Access — {selectedUser?.name}
            </Typography>
            {departments.map((dept) => (
              <FormControlLabel
                key={dept.id}
                control={
                  <Switch
                    checked={isGranted("department", dept.id)}
                    onChange={() => handleToggle("department", dept.id, isGranted("department", dept.id))}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {dept.name}
                    <Chip
                      label={isGranted("department", dept.id) ? "Granted" : "Denied"}
                      size="small"
                      color={isGranted("department", dept.id) ? "success" : "error"}
                      variant="outlined"
                    />
                  </Box>
                }
                sx={{ display: "flex", mb: 0.5 }}
              />
            ))}
            {departments.length === 0 && (
              <Typography variant="body2" color="textSecondary">No departments.</Typography>
            )}
          </Paper>

          <Paper sx={{ p: 2, background: "rgba(255,255,255,0.02)" }}>
            <Typography variant="subtitle2" sx={{ fontFamily: "Outfit", fontWeight: 600, mb: 1 }}>
              Widget Access — {selectedUser?.name}
            </Typography>
            {widgets.map((widget) => (
              <FormControlLabel
                key={widget.id}
                control={
                  <Switch
                    checked={isGranted("widget", widget.id)}
                    onChange={() => handleToggle("widget", widget.id, isGranted("widget", widget.id))}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {widget.name}
                    <Chip
                      label={isGranted("widget", widget.id) ? "Granted" : "Denied"}
                      size="small"
                      color={isGranted("widget", widget.id) ? "success" : "error"}
                      variant="outlined"
                    />
                  </Box>
                }
                sx={{ display: "flex", mb: 0.5 }}
              />
            ))}
            {widgets.length === 0 && (
              <Typography variant="body2" color="textSecondary">No widgets registered.</Typography>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
