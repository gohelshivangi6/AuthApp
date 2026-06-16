import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Select, MenuItem, FormControl, InputLabel,
  Switch, FormControlLabel, Paper, Chip, CircularProgress,
} from "@mui/material";
import {
  fetchUsers, fetchDashboards,
  fetchPermissions, createPermission, deletePermission,
} from "../../redux/slices/adminSlice";

const SECTIONS = ["kpiCards", "charts", "tables"];

function sectionLabel(s) {
  if (s === "kpiCards") return "KPI Cards";
  if (s === "charts") return "Charts";
  if (s === "tables") return "Tables";
  return s;
}

export default function PermissionManager() {
  const dispatch = useDispatch();
  const { users, dashboards, permissions, loading } = useSelector((state) => state.admin);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchDashboards());
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

  const isSectionGranted = (dashboardPath, section) => {
    const targetId = `${dashboardPath}::${section}`;
    const dashboardId = dashboards.find((d) => d.path === dashboardPath)?.id;
    if (!dashboardId) return false;
    const dashboardGranted = isGranted("dashboard", dashboardId);
    if (!dashboardGranted) return false;
    const perm = userPerms.find(
      (p) => p.targetType === "dashboard-section" && p.targetId === targetId
    );
    if (!perm) return true;
    return perm.granted;
  };

  const handleDashboardToggle = async (dashboardId, currentlyGranted) => {
    if (currentlyGranted) {
      const perm = userPerms.find(
        (p) => p.targetType === "dashboard" && p.targetId === dashboardId
      );
      if (perm) {
        await dispatch(deletePermission(perm.id));
      } else {
        await dispatch(createPermission({
          userId: selectedUserId,
          targetType: "dashboard",
          targetId: dashboardId,
          granted: false,
        }));
      }
    } else {
      await dispatch(createPermission({
        userId: selectedUserId,
        targetType: "dashboard",
        targetId: dashboardId,
        granted: true,
      }));
    }
    dispatch(fetchPermissions(selectedUserId));
  };

  const handleSectionToggle = async (dashboardPath, section, currentlyGranted) => {
    const targetId = `${dashboardPath}::${section}`;
    await dispatch(createPermission({
      userId: selectedUserId,
      targetType: "dashboard-section",
      targetId,
      granted: !currentlyGranted,
    }));
    dispatch(fetchPermissions(selectedUserId));
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }} mb={2}>
        Dashboard & Section Permissions
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
              Dashboard Access — {selectedUser?.name}
            </Typography>
            {dashboards.map((d) => {
              const dbGranted = isGranted("dashboard", d.id);
              return (
                <Box key={d.id} sx={{ mb: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dbGranted}
                        onChange={() => handleDashboardToggle(d.id, dbGranted)}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography sx={{ fontWeight: 600 }}>{d.name}</Typography>
                        <Chip
                          label={dbGranted ? "Granted" : "Denied"}
                          size="small"
                          color={dbGranted ? "success" : "error"}
                          variant="outlined"
                        />
                      </Box>
                    }
                    sx={{ display: "flex", mb: 0.5 }}
                  />
                  {dbGranted && (
                    <Box sx={{ ml: 7, pl: 2, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                      {SECTIONS.map((section) => {
                        const secGranted = isSectionGranted(d.path, section);
                        return (
                          <FormControlLabel
                            key={section}
                            control={
                              <Switch
                                size="small"
                                checked={secGranted}
                                onChange={() => handleSectionToggle(d.path, section, secGranted)}
                              />
                            }
                            label={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2">{sectionLabel(section)}</Typography>
                                <Chip
                                  label={secGranted ? "Granted" : "Denied"}
                                  size="small"
                                  color={secGranted ? "success" : "error"}
                                  variant="outlined"
                                />
                              </Box>
                            }
                            sx={{ display: "flex", mb: 0 }}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Box>
              );
            })}
            {dashboards.length === 0 && (
              <Typography variant="body2" color="textSecondary">No dashboards registered.</Typography>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}