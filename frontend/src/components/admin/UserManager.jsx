import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Table, TableHead, TableBody, TableRow,
  TableCell, IconButton, Chip, CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { fetchUsers, createUser, updateUser, deleteUser } from "../../redux/slices/adminSlice";

export default function UserManager() {
  const dispatch = useDispatch();
  const { users, departments, roles, assignments, loading } = useSelector((state) => state.admin);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleOpen = (user) => {
    if (user) {
      setEditUser(user);
      setForm({ name: user.name, email: user.email, password: "" });
    } else {
      setEditUser(null);
      setForm({ name: "", email: "", password: "" });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (editUser) {
      await dispatch(updateUser({ id: editUser.id, ...form }));
    } else {
      await dispatch(createUser(form));
    }
    setOpen(false);
    dispatch(fetchUsers());
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this user?")) {
      await dispatch(deleteUser(id));
    }
  };

  const getUserAssignment = (userId) => {
    const a = assignments.find((a) => a.userId === userId);
    if (!a) return null;
    const dept = departments.find((d) => d.id === a.departmentId);
    const role = roles.find((r) => r.id === a.roleId);
    return { department: dept?.name || "—", role: role?.name || "—" };
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }}>
          Users ({users.length})
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen(null)}>
          Create User
        </Button>
      </Box>

      <Table sx={{ "& .MuiTableCell-root": { borderColor: "rgba(255,255,255,0.05)" } }}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Role in Dept</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u) => {
            const assign = getUserAssignment(u.id);
            return (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip
                    label={u.role}
                    size="small"
                    color={u.role === "admin" ? "error" : "primary"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{u.status}</TableCell>
                <TableCell>{assign?.department || "—"}</TableCell>
                <TableCell>{assign?.role || "—"}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(u)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(u.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                {loading ? <CircularProgress size={24} /> : "No users found"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? "Edit User" : "Create User"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
            />
            {!editUser && (
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editUser ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
