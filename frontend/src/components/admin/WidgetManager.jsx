import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Table, TableHead, TableBody, TableRow,
  TableCell, IconButton, Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  fetchWidgets, createWidget, updateWidget, deleteWidget,
} from "../../redux/slices/adminSlice";

export default function WidgetManager() {
  const dispatch = useDispatch();
  const { widgets } = useSelector((state) => state.admin);
  const [open, setOpen] = useState(false);
  const [editWidget, setEditWidget] = useState(null);
  const [form, setForm] = useState({ name: "", componentName: "", description: "" });

  useEffect(() => {
    dispatch(fetchWidgets());
  }, [dispatch]);

  const handleOpen = (widget) => {
    if (widget) {
      setEditWidget(widget);
      setForm({ name: widget.name, componentName: widget.componentName, description: widget.description || "" });
    } else {
      setEditWidget(null);
      setForm({ name: "", componentName: "", description: "" });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (editWidget) {
      await dispatch(updateWidget({ id: editWidget.id, ...form }));
    } else {
      await dispatch(createWidget(form));
    }
    setOpen(false);
    dispatch(fetchWidgets());
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this widget?")) {
      await dispatch(deleteWidget(id));
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} mb={2}>
        <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }}>
          Widget Registry ({widgets.length})
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen(null)}>
          Register Widget
        </Button>
      </Box>

      <Table sx={{ "& .MuiTableCell-root": { borderColor: "rgba(255,255,255,0.05)" } }}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Component</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Default</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {widgets.map((w) => (
            <TableRow key={w.id}>
              <TableCell>{w.name}</TableCell>
              <TableCell>
                <Chip label={w.componentName} size="small" variant="outlined" color="primary" />
              </TableCell>
              <TableCell>{w.description || "—"}</TableCell>
              <TableCell>
                <Chip
                  label={w.defaultEnabled ? "Enabled" : "Disabled"}
                  size="small"
                  color={w.defaultEnabled ? "success" : "default"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => handleOpen(w)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(w.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {widgets.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">No widgets registered.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editWidget ? "Edit Widget" : "Register Widget"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display="flex", flexDirection: "column" }} gap={2} mt={1}>
            <TextField
              label="Widget Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Component Name"
              value={form.componentName}
              onChange={(e) => setForm({ ...form, componentName: e.target.value })}
              fullWidth
              helperText="Must match the exported component name in WidgetRenderer.jsx"
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
            {editWidget ? "Update" : "Register"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
