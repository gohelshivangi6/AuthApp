import { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Select, MenuItem, FormControl, InputLabel,
  Switch, FormControlLabel, Paper, Chip,
  Tabs, Tab, Checkbox, ListItemText, OutlinedInput,
  Snackbar, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Radio, RadioGroup, FormControlLabel as FormRadioLabel,
} from "@mui/material";

import {
  fetchUsers, fetchDashboards,
  fetchPermissions, createPermission, deletePermission,
  bulkSavePermissions,
  fetchPermissionTemplates,
  applyDepartmentPermission, applyRolePermission,
  fetchDepartments, fetchRoles,
} from "../../redux/slices/adminSlice";

const SECTIONS = ["kpiCards", "charts", "tables"];

function sectionLabel(s) {
  if (s === "kpiCards") return "KPI Cards";
  if (s === "charts") return "Charts";
  if (s === "tables") return "Tables";
  return s;
}

function DashboardSwitches({ dashboards, perms, onToggleDashboard, onToggleSection }) {
  const isGranted = (targetType, targetId) => {
    const perm = perms.find((p) => p.targetType === targetType && p.targetId === targetId);
    return perm ? perm.granted : targetType === "department";
  };

  const isSectionGranted = (dashboardPath, section) => {
    const targetId = `${dashboardPath}::${section}`;
    const dashboardId = dashboards.find((d) => d.path === dashboardPath)?.id;
    if (!dashboardId) return false;
    if (!isGranted("dashboard", dashboardId)) return false;
    const perm = perms.find((p) => p.targetType === "dashboard-section" && p.targetId === targetId);
    return perm ? perm.granted : true;
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Paper sx={{ p: 2, background: "rgba(255,255,255,0.02)" }}>
        <Typography variant="subtitle2" sx={{ fontFamily: "Outfit", fontWeight: 600, mb: 1 }}>
          Dashboard Access
        </Typography>
        {dashboards.map((d) => {
          const dbGranted = isGranted("dashboard", d.id);
          return (
            <Box key={d.id} sx={{ mb: 1.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={dbGranted}
                    onChange={() => onToggleDashboard(d.id, dbGranted)}
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
                            onChange={() => onToggleSection(d.path, section, secGranted)}
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
  );
}

// ─── Apply Permission Dialog ────────────────────────────────

function ApplyPermissionDialog({ open, title, entityName, targetLabel, newGranted, scopeLabel, onConfirm, onCancel }) {
  const [applyTo, setApplyTo] = useState("all");

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: "Outfit", fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Change <strong>{targetLabel}</strong> for {scopeLabel} <strong>"{entityName}"</strong> to <strong>{newGranted ? "Granted" : "Denied"}</strong>?
        </Typography>
        <RadioGroup value={applyTo} onChange={(e) => setApplyTo(e.target.value)}>
          <FormRadioLabel
            value="all"
            control={<Radio />}
            label={scopeLabel === "department"
              ? "Apply to all existing roles and users"
              : "Apply to all existing users"}
          />
          <FormRadioLabel
            value="future"
            control={<Radio />}
            label={scopeLabel === "department"
              ? "Apply to future roles and users only"
              : "Apply to future users only"}
          />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} sx={{ textTransform: "none" }}>Cancel</Button>
        <Button variant="contained" onClick={() => onConfirm(applyTo)} sx={{ textTransform: "none" }}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Per User Tab ────────────────────────────────────────────

function PerUserTab() {
  const dispatch = useDispatch();
  const { users, dashboards, permissions } = useSelector((state) => state.admin);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (selectedUserId) {
      dispatch(fetchPermissions(selectedUserId));
    }
  }, [dispatch, selectedUserId]);

  const handleDashboardToggle = async (dashboardId, currentlyGranted) => {
    if (currentlyGranted) {
      const perm = permissions.find(
        (p) => p.targetType === "dashboard" && p.targetId === dashboardId
      );
      if (perm) {
        await dispatch(deletePermission(perm.id));
      } else {
        await dispatch(createPermission({ userId: selectedUserId, targetType: "dashboard", targetId: dashboardId, granted: false }));
      }
    } else {
      await dispatch(createPermission({ userId: selectedUserId, targetType: "dashboard", targetId: dashboardId, granted: true }));
    }
    dispatch(fetchPermissions(selectedUserId));
  };

  const handleSectionToggle = async (dashboardPath, section, currentlyGranted) => {
    const targetId = `${dashboardPath}::${section}`;
    await dispatch(createPermission({ userId: selectedUserId, targetType: "dashboard-section", targetId, granted: !currentlyGranted }));
    dispatch(fetchPermissions(selectedUserId));
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <Box>
      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <InputLabel>Select User</InputLabel>
        <Select value={selectedUserId} label="Select User" onChange={(e) => setSelectedUserId(e.target.value)}>
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

      {selectedUserId && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontFamily: "Outfit", fontWeight: 600, mb: 2 }}>
            Permissions for {selectedUser?.name}
          </Typography>
          <DashboardSwitches
            dashboards={dashboards}
            perms={permissions}
            onToggleDashboard={handleDashboardToggle}
            onToggleSection={handleSectionToggle}
          />
        </Box>
      )}
    </Box>
  );
}

// ─── Bulk Users Tab ──────────────────────────────────────────

function BulkUsersTab() {
  const dispatch = useDispatch();
  const { users, dashboards } = useSelector((state) => state.admin);
  const [selectedIds, setSelectedIds] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [grantedPerms, setGrantedPerms] = useState([]);

  const nonAdminUsers = useMemo(() => users.filter((u) => u.role !== "admin"), [users]);

  const handleToggleDashboard = (dashboardId, currentlyGranted) => {
    const newGranted = !currentlyGranted;
    setGrantedPerms((prev) => {
      const idx = prev.findIndex((p) => p.targetType === "dashboard" && p.targetId === dashboardId);
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = { ...updated[idx], granted: newGranted };
      } else {
        updated = [...prev, { targetType: "dashboard", targetId: dashboardId, granted: newGranted }];
      }

      const d = dashboards.find((db) => db.id === dashboardId);
      if (d) {
        if (newGranted) {
          for (const section of SECTIONS) {
            const sectionTargetId = `${d.path}::${section}`;
            if (!updated.find((p) => p.targetType === "dashboard-section" && p.targetId === sectionTargetId)) {
              updated.push({ targetType: "dashboard-section", targetId: sectionTargetId, granted: true });
            }
          }
        } else {
          updated = updated.filter(
            (p) => !(p.targetType === "dashboard-section" && p.targetId.startsWith(`${d.path}::`))
          );
        }
      }

      return updated;
    });
  };

  const handleToggleSection = (dashboardPath, section, currentlyGranted) => {
    const newGranted = !currentlyGranted;
    const targetId = `${dashboardPath}::${section}`;
    setGrantedPerms((prev) => {
      const idx = prev.findIndex((p) => p.targetType === "dashboard-section" && p.targetId === targetId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], granted: newGranted };
        return updated;
      }
      return [...prev, { targetType: "dashboard-section", targetId, granted: newGranted }];
    });
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setSnackbar({ open: true, message: "Select at least one user first." });
      return;
    }

    const permissions = [];
    for (const d of dashboards) {
      const dbGranted = grantedPerms.find(
        (p) => p.targetType === "dashboard" && p.targetId === d.id
      )?.granted ?? false;
      permissions.push({ targetType: "dashboard", targetId: d.id, granted: dbGranted });

      for (const section of SECTIONS) {
        const sectionTargetId = `${d.path}::${section}`;
        const secGranted = grantedPerms.find(
          (p) => p.targetType === "dashboard-section" && p.targetId === sectionTargetId
        )?.granted ?? false;
        permissions.push({ targetType: "dashboard-section", targetId: sectionTargetId, granted: secGranted });
      }
    }

    await dispatch(bulkSavePermissions({ userIds: selectedIds, permissions }));
    setSnackbar({ open: true, message: `Applied ${permissions.length} permission(s) to ${selectedIds.length} user(s).` });
  };

  return (
    <Box>
      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <InputLabel>Select Users</InputLabel>
        <Select
          multiple
          value={selectedIds}
          label="Select Users"
          onChange={(e) => { setSelectedIds(e.target.value); setGrantedPerms([]); }}
          input={<OutlinedInput label="Select Users" />}
          renderValue={(selected) => selected.map((id) => users.find((u) => u.id === id)?.name).join(", ")}
        >
          {nonAdminUsers.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              <Checkbox checked={selectedIds.indexOf(u.id) > -1} />
              <ListItemText primary={`${u.name} (${u.email})`} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedIds.length > 0 && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {selectedIds.length} user(s) selected — toggle any switch below, then click Save.
        </Typography>
      )}

      {selectedIds.length === 0 && (
        <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
          Select one or more users to grant permissions in bulk
        </Typography>
      )}

      {selectedIds.length > 0 && (
        <>
          <DashboardSwitches
            dashboards={dashboards}
            perms={grantedPerms}
            onToggleDashboard={handleToggleDashboard}
            onToggleSection={handleToggleSection}
          />
          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{ textTransform: "none", fontFamily: "Outfit", fontWeight: 600 }}
            >
              Save Permissions
            </Button>
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        message={snackbar.message}
      />
    </Box>
  );
}

// ─── By Department Tab ───────────────────────────────────────

function ByDepartmentTab() {
  const dispatch = useDispatch();
  const { departments, dashboards, permissionTemplates } = useSelector((state) => state.admin);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [dialog, setDialog] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const filteredTemplates = useMemo(
    () => permissionTemplates.filter(
      (t) => t.assigneeType === "department" && t.assigneeId === selectedDeptId
    ),
    [permissionTemplates, selectedDeptId]
  );

  const selectedDept = departments.find((d) => d.id === selectedDeptId);

  const openDialog = useCallback((targetType, targetId, currentlyGranted) => {
    const d = dashboards.find((db) => db.id === targetId);
    const label = targetType === "dashboard"
      ? (d ? d.name : targetId)
      : `${d ? d.name : "Dashboard"} section`;
    setDialog({ targetType, targetId, currentlyGranted, label });
  }, [dashboards]);

  const handleDialogConfirm = useCallback(async (applyTo) => {
    const { targetType, targetId, currentlyGranted } = dialog;
    await dispatch(applyDepartmentPermission({
      departmentId: selectedDeptId,
      targetType,
      targetId,
      granted: !currentlyGranted,
      applyTo,
    }));
    dispatch(fetchPermissionTemplates());
    const msg = applyTo === "all"
      ? "Applied to all existing roles and users"
      : "Set for future roles and users";
    setSnackbar({ open: true, message: msg });
    setDialog(null);
  }, [dispatch, dialog, selectedDeptId]);

  return (
    <Box>
      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <InputLabel>Select Department</InputLabel>
        <Select value={selectedDeptId} label="Select Department" onChange={(e) => setSelectedDeptId(e.target.value)}>
          {departments.map((d) => (
            <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {!selectedDeptId && (
        <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
          Select a department to manage permissions — all members inherit these permissions.
        </Typography>
      )}

      {selectedDeptId && (
        <>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Permissions for department — toggling a switch shows apply options.
          </Typography>
          <DashboardSwitches
            dashboards={dashboards}
            perms={filteredTemplates}
            onToggleDashboard={(id, cur) => openDialog("dashboard", id, cur)}
            onToggleSection={(path, section, cur) => {
              const d = dashboards.find((db) => db.path === path);
              const targetId = `${path}::${section}`;
              setDialog({ targetType: "dashboard-section", targetId, currentlyGranted: cur, label: `${d ? d.name : path} / ${sectionLabel(section)}` });
            }}
          />
        </>
      )}

      <ApplyPermissionDialog
        open={!!dialog}
        title="Update Department Permission"
        entityName={selectedDept?.name || ""}
        targetLabel={dialog?.label || ""}
        newGranted={dialog ? !dialog.currentlyGranted : false}
        scopeLabel="department"
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialog(null)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        message={snackbar.message}
      />
    </Box>
  );
}

// ─── By Role Tab ─────────────────────────────────────────────

function ByRoleTab() {
  const dispatch = useDispatch();
  const { departments, roles, dashboards, permissionTemplates } = useSelector((state) => state.admin);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [dialog, setDialog] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const filteredRoles = useMemo(
    () => roles.filter((r) => r.departmentId === selectedDeptId),
    [roles, selectedDeptId]
  );

  const filteredTemplates = useMemo(
    () => permissionTemplates.filter(
      (t) => t.assigneeType === "role" && t.assigneeId === selectedRoleId
    ),
    [permissionTemplates, selectedRoleId]
  );

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  useEffect(() => {
    if (selectedDeptId) {
      dispatch(fetchRoles(selectedDeptId));
    }
  }, [dispatch, selectedDeptId]);

  const openDialog = useCallback((targetType, targetId, currentlyGranted) => {
    const d = dashboards.find((db) => db.id === targetId);
    const label = targetType === "dashboard"
      ? (d ? d.name : targetId)
      : `${d ? d.name : "Dashboard"} section`;
    setDialog({ targetType, targetId, currentlyGranted, label });
  }, [dashboards]);

  const handleDialogConfirm = useCallback(async (applyTo) => {
    const { targetType, targetId, currentlyGranted } = dialog;
    await dispatch(applyRolePermission({
      roleId: selectedRoleId,
      targetType,
      targetId,
      granted: !currentlyGranted,
      applyTo,
    }));
    dispatch(fetchPermissionTemplates());
    const msg = applyTo === "all"
      ? "Applied to all existing users"
      : "Set for future users";
    setSnackbar({ open: true, message: msg });
    setDialog(null);
  }, [dispatch, dialog, selectedRoleId]);

  return (
    <Box>
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Select Department</InputLabel>
        <Select value={selectedDeptId} label="Select Department" onChange={(e) => { setSelectedDeptId(e.target.value); setSelectedRoleId(""); }}>
          {departments.map((d) => (
            <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" sx={{ mb: 3 }} disabled={!selectedDeptId}>
        <InputLabel>Select Role</InputLabel>
        <Select value={selectedRoleId} label="Select Role" onChange={(e) => setSelectedRoleId(e.target.value)}>
          {filteredRoles.map((r) => (
            <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {!selectedRoleId && (
        <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
          Select a department and role to manage permissions — toggling a switch shows apply options.
        </Typography>
      )}

      {selectedRoleId && (
        <>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Permissions for role — toggling a switch shows apply options.
          </Typography>
          <DashboardSwitches
            dashboards={dashboards}
            perms={filteredTemplates}
            onToggleDashboard={(id, cur) => openDialog("dashboard", id, cur)}
            onToggleSection={(path, section, cur) => {
              const d = dashboards.find((db) => db.path === path);
              const targetId = `${path}::${section}`;
              setDialog({ targetType: "dashboard-section", targetId, currentlyGranted: cur, label: `${d ? d.name : path} / ${sectionLabel(section)}` });
            }}
          />
        </>
      )}

      <ApplyPermissionDialog
        open={!!dialog}
        title="Update Role Permission"
        entityName={selectedRole?.name || ""}
        targetLabel={dialog?.label || ""}
        newGranted={dialog ? !dialog.currentlyGranted : false}
        scopeLabel="role"
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialog(null)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        message={snackbar.message}
      />
    </Box>
  );
}

// ─── Main Export ─────────────────────────────────────────────

export default function PermissionManager() {
  const dispatch = useDispatch();
  const [tab, setTab] = useState(0);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchDashboards());
    dispatch(fetchDepartments());
    dispatch(fetchRoles());
    dispatch(fetchPermissionTemplates());
  }, [dispatch]);

  const TABS = [
    { label: "Per User", component: <PerUserTab /> },
    { label: "Bulk Users", component: <BulkUsersTab /> },
    { label: "By Department", component: <ByDepartmentTab /> },
    { label: "By Role", component: <ByRoleTab /> },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }} mb={2}>
        Dashboard & Section Permissions
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 2,
          "& .MuiTab-root": { textTransform: "none", fontFamily: "Outfit", fontWeight: 600 },
        }}
      >
        {TABS.map((t, i) => (
          <Tab key={i} label={t.label} />
        ))}
      </Tabs>

      {TABS[tab]?.component}
    </Box>
  );
}