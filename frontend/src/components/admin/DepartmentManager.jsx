import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, List, ListItem, ListItemText,
  IconButton, Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  fetchDepartments, createDepartment, updateDepartment, deleteDepartment,
} from "../../redux/slices/adminSlice";

export default function DepartmentManager() {
  const dispatch = useDispatch();
  const { departments, roles } = useSelector((state) => state.admin);
  const [open, setOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleOpen = (dept) => {
    if (dept) {
      setEditDept(dept);
      setForm({ name: dept.name, description: dept.description || "" });
    } else {
      setEditDept(null);
      setForm({ name: "", description: "" });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (editDept) {
      await dispatch(updateDepartment({ id: editDept.id, ...form }));
    } else {
      await dispatch(createDepartment(form));
    }
    setOpen(false);
    dispatch(fetchDepartments());
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this department? Roles and assignments will be removed.")) {
      await dispatch(deleteDepartment(id));
    }
  };

  const deptRoleCount = (deptId) => roles.filter((r) => r.departmentId === deptId).length;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} mb={2}>
        <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }}>
          Departments ({departments.length})
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen(null)}>
          Add Department
        </Button>
      </Box>

      <List>
        {departments.map((dept) => (
          <ListItem
            key={dept.id}
            sx={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: "8px",
              mb: 1,
              border: "1px solid rgba(255,255,255,0.05)",
            }}
            secondaryAction={
              <Box>
                <IconButton onClick={() => handleOpen(dept)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={() => handleDelete(dept.id)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            <ListItemText
              primary={dept.name}
              secondary={
                <Box sx={{ display: "flex", alignItems: "center" }} gap={1} mt={0.5}>
                  <Chip label={`${deptRoleCount(dept.id)} roles`} size="small" variant="outlined" />
                  {dept.description && (
                    <Typography variant="caption" color="textSecondary">
                      {dept.description}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
        {departments.length === 0 && (
          <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
            No departments created yet.
          </Typography>
        )}
      </List>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editDept ? "Edit Department" : "Create Department"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column" }} gap={2} mt={1}>
            <TextField
              label="Department Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editDept ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
