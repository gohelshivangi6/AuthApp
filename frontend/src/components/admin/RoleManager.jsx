import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, List, ListItem, ListItemText, IconButton, Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  fetchRoles, fetchDepartments, createRole, updateRole, deleteRole, cloneRole,
} from "../../redux/slices/adminSlice";

export default function RoleManager() {
  const dispatch = useDispatch();
  const { roles, departments } = useSelector((state) => state.admin);
  const [open, setOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [deptFilter, setDeptFilter] = useState("");
  const [form, setForm] = useState({ name: "", departmentId: "" });
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState(null);
  const [cloneName, setCloneName] = useState("");

  useEffect(() => {
    dispatch(fetchRoles());
    if (departments.length === 0) dispatch(fetchDepartments());
  }, [dispatch]);

  const filteredRoles = deptFilter
    ? roles.filter((r) => r.departmentId === deptFilter)
    : roles;

  const handleOpen = (role) => {
    if (role) {
      setEditRole(role);
      setForm({ name: role.name, departmentId: role.departmentId });
    } else {
      setEditRole(null);
      setForm({ name: "", departmentId: deptFilter || "" });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (editRole) {
      await dispatch(updateRole({ id: editRole.id, ...form }));
    } else {
      await dispatch(createRole(form));
    }
    setOpen(false);
    dispatch(fetchRoles());
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this role?")) {
      await dispatch(deleteRole(id));
    }
  };

  const handleCloneOpen = (role) => {
    setCloneSource(role);
    setCloneName(`${role.name} (Copy)`);
    setCloneOpen(true);
  };

  const handleClone = async () => {
    if (!cloneSource || !cloneName.trim()) return;
    await dispatch(cloneRole({ id: cloneSource.id, name: cloneName.trim() }));
    setCloneOpen(false);
    setCloneSource(null);
    dispatch(fetchRoles());
  };

  const deptName = (id) => departments.find((d) => d.id === id)?.name || "—";

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} mb={2}>
        <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }}>
          Roles ({roles.length})
        </Typography>
        <Box sx={{ display: "flex" }} gap={1}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Filter by Dept</InputLabel>
            <Select
              value={deptFilter}
              label="Filter by Dept"
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen(null)}>
            Add Role
          </Button>
        </Box>
      </Box>

      <List>
        {filteredRoles.map((role) => (
          <ListItem
            key={role.id}
            sx={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: "8px",
              mb: 1,
              border: "1px solid rgba(255,255,255,0.05)",
            }}
            secondaryAction={
              <Box>
                <IconButton onClick={() => handleCloneOpen(role)} title="Clone role">
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={() => handleOpen(role)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={() => handleDelete(role.id)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            <ListItemText
              primary={role.name}
              secondary={
                <Chip label={deptName(role.departmentId)} size="small" variant="outlined" />
              }
            />
          </ListItem>
        ))}
        {filteredRoles.length === 0 && (
          <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
            No roles{deptFilter ? " for this department" : ""}.
          </Typography>
        )}
      </List>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRole ? "Edit Role" : "Create Role"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column" }} gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={form.departmentId}
                label="Department"
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Role Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editRole ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cloneOpen} onClose={() => setCloneOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Clone Role — {cloneSource?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column" }} gap={2} mt={1}>
            <TextField
              label="New Role Name"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              fullWidth
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloneOpen(false)}>Cancel</Button>
          <Button onClick={handleClone} variant="contained" disabled={!cloneName.trim()}>
            Clone
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
