import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Snackbar, Alert,
} from "@mui/material";
import { createWorkspace, fetchWorkspaces } from "../../redux/slices/workspaceSlice";

export default function WorkspaceCreateDialog({ open, onClose, workspace }) {
  const dispatch = useDispatch();
  const [name, setName] = useState(workspace?.name || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleSave = async () => {
    if (!name.trim()) {
      setSnackbar({ open: true, message: "Name is required.", severity: "error" });
      return;
    }
    try {
      await dispatch(createWorkspace({ name: name.trim(), description: description.trim() })).unwrap();
      dispatch(fetchWorkspaces());
      setSnackbar({ open: true, message: "Workspace created.", severity: "success" });
      handleClose();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to create workspace.";
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: "Outfit", fontWeight: 700 }}>
          {workspace ? "Edit Workspace" : "Create Workspace"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Workspace Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {workspace ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
