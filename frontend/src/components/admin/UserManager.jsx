import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import Papa from "papaparse";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkCreateUsers,
  fetchDepartments,
  fetchRoles,
  fetchAssignments,
  createAssignment,
  deleteAssignment,
} from "../../redux/slices/adminSlice";

export default function UserManager() {
  const dispatch = useDispatch();
  const { users, departments, roles, assignments } = useSelector(
    (state) => state.admin,
  );

  const [userOpen, setUserOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignForm, setAssignForm] = useState({
    departmentId: "",
    roleId: "",
  });

  const [importOpen, setImportOpen] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchDepartments());
    dispatch(fetchRoles());
    dispatch(fetchAssignments());
  }, [dispatch]);

  const handleUserOpen = (user) => {
    if (user) {
      setEditUser(user);
      setUserForm({ name: user.name, email: user.email, password: "" });
    } else {
      setEditUser(null);
      setUserForm({ name: "", email: "", password: "" });
    }
    setUserOpen(true);
  };

  const handleUserSave = async () => {
    try {
      if (editUser) {
        await dispatch(updateUser({ id: editUser.id, ...userForm })).unwrap();
      } else {
        await dispatch(createUser(userForm)).unwrap();
      }
      setUserOpen(false);
      dispatch(fetchUsers());
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save user";
      setSnackbar({ open: true, message: msg, severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this user?")) {
      await dispatch(deleteUser(id));
    }
  };

  const handleAssignOpen = (user) => {
    setAssignTarget(user);
    setAssignForm({
      departmentId: user.departmentId || "",
      roleId: user.roleId || "",
    });
    setAssignOpen(true);
  };

  // const handleAssignSave = async () => {
  //   const existing = assignments.find((a) => a.userId === assignTarget.id);
  //   if (existing) {
  //     await dispatch(deleteAssignment(existing.id));
  //   }
  //   if (assignForm.departmentId && assignForm.roleId) {
  //     await dispatch(
  //       createAssignment({
  //         userId: assignTarget.id,
  //         departmentId: assignForm.departmentId,
  //         roleId: assignForm.roleId,
  //       }),
  //     );
  //   }
  //   setAssignOpen(false);
  //   setAssignTarget(null);
  //   dispatch(fetchAssignments());
  //   dispatch(fetchUsers());
  // };

  const handleAssignSave = async () => {
    const existing = assignments.find((a) => a.userId === assignTarget.id);

    const selectedRole = roles.find((r) => r.id === assignForm.roleId);

    // Update user table
    await dispatch(
      updateUser({
        id: assignTarget.id,
        roleId: assignForm.roleId,
        role: selectedRole?.name,
        departmentId: assignForm.departmentId,
      }),
    );

    // Update assignment table
    if (existing) {
      await dispatch(deleteAssignment(existing.id));
    }

    await dispatch(
      createAssignment({
        userId: assignTarget.id,
        departmentId: assignForm.departmentId,
        roleId: assignForm.roleId,
        role: selectedRole?.name,
      }),
    );

    setAssignOpen(false);
    setAssignTarget(null);

    await dispatch(fetchAssignments());
    await dispatch(fetchUsers());
  };

  const handleAssignRemove = async (userId) => {
    const existing = assignments.find((a) => a.userId === userId);
    if (existing && window.confirm("Remove this user's assignment?")) {
      await dispatch(
        updateUser({ id: userId, roleId: null, role: null }),
      );
      await dispatch(deleteAssignment(existing.id));
      dispatch(fetchAssignments());
      dispatch(fetchUsers());
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
      },
    });
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await dispatch(bulkCreateUsers(csvData)).unwrap();
      if (result.created > 0) {
        dispatch(fetchUsers());
      }
      setImporting(false);
      handleImportClose();
      setImportResult(result);
      setResultOpen(true);
    } catch (err) {
      const resp = err?.response?.data;
      let result;
      if (resp?.errors) {
        result = resp;
      } else if (resp?.message) {
        result = { created: 0, failed: 1, errors: [{ row: "-", email: "", message: resp.message }] };
      } else {
        result = { created: 0, failed: 1, errors: [{ row: "-", email: "", message: "Import failed" }] };
      }
      setImporting(false);
      handleImportClose();
      setImportResult(result);
      setResultOpen(true);
    }
  };

  const handleImportClose = () => {
    setImportOpen(false);
    setCsvData([]);
    setImportResult(null);
  };

  const availableRoles = assignForm.departmentId
    ? roles.filter((r) => r.departmentId === assignForm.departmentId)
    : roles;

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }}>
          Users ({users.length})
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleUserOpen(null)}
          >
            Create User
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => setImportOpen(true)}
          >
            Import Users
          </Button>
        </Box>
      </Box>

      <Table
        sx={{
          "& .MuiTableCell-root": { borderColor: "rgba(255,255,255,0.05)" },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Role</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u) => {
            const dept = u.departmentId
              ? departments.find((d) => d.id === u.departmentId)
              : null;
              console.log("DEPT", dept);
            const role = u.roleId ? roles.find((r) => r.id === u.roleId) : null;
            return (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.status}</TableCell>
                <TableCell>{dept?.name || "—"}</TableCell>
                <TableCell>
                  {role ? (
                    <Chip
                      label={role.name}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleAssignOpen(u)}
                    // title={a ? "Change assignment" : "Assign to department"}
                    title="Change assignment"
                  >
                    <AssignmentIndIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleUserOpen(u)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(u.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Create/Edit User Dialog */}
      <Dialog
        open={userOpen}
        onClose={() => setUserOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editUser ? "Edit User" : "Create User"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Name"
              value={userForm.name}
              onChange={(e) =>
                setUserForm({ ...userForm, name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
              fullWidth
            />
            {!editUser && (
              <TextField
                label="Password"
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserOpen(false)}>Cancel</Button>
          <Button onClick={handleUserSave} variant="contained">
            {editUser ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {assignTarget?.departmentId ? "Change Assignment" : "Assign Role"} —{" "}
          {assignTarget?.name}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={assignForm.departmentId}
                label="Department"
                onChange={(e) =>
                  setAssignForm({ departmentId: e.target.value, roleId: "" })
                }
              >
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!assignForm.departmentId}>
              <InputLabel>Role</InputLabel>
              <Select
                value={assignForm.roleId}
                label="Role"
                onChange={(e) =>
                  setAssignForm({ ...assignForm, roleId: e.target.value })
                }
              >
                {availableRoles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {assignTarget?.departmentId && (
              <Button
                color="error"
                variant="outlined"
                onClick={() => {
                  handleAssignRemove(assignTarget.id);
                  setAssignOpen(false);
                }}
                sx={{ mt: 1 }}
              >
                Remove Assignment
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignSave}
            variant="contained"
            disabled={!assignForm.departmentId || !assignForm.roleId}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Users Dialog */}
      <Dialog
        open={importOpen}
        onClose={handleImportClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import Users from CSV</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Typography variant="body2" color="textSecondary">
              CSV must have columns: <strong>name, email, password</strong>.
              Optional: <strong>department, role</strong>.
            </Typography>
            <Button variant="outlined" component="label">
              Choose CSV File
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileSelect}
              />
            </Button>

            {csvData.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontFamily: "Outfit", fontWeight: 600, mb: 1 }}>
                  Preview ({csvData.length} row(s))
                </Typography>
                <Box sx={{ maxHeight: 260, overflow: "auto" }}>
                  <Table size="small" sx={{ "& .MuiTableCell-root": { borderColor: "rgba(255,255,255,0.05)" } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Password</TableCell>
                          <TableCell>Department</TableCell>
                          <TableCell>Role</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {csvData.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.email}</TableCell>
                            <TableCell>{row.password || "—"}</TableCell>
                            <TableCell>{row.department || "—"}</TableCell>
                            <TableCell>{row.role || "—"}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportClose}>Close</Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={csvData.length === 0 || importing}
            startIcon={importing ? <CircularProgress size={16} /> : <CloudUploadIcon />}
          >
            {importing ? "Importing..." : "Import"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resultOpen} onClose={() => setResultOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <AlertTitle>Import Result</AlertTitle>
        </DialogTitle>
        <DialogContent>
          {importResult && (
            <Alert severity={importResult.created > 0 ? "success" : "error"} sx={{ mt: 1 }}>
              {importResult.created} created, {importResult.failed} failed
              {importResult.errors?.length > 0 && (
                <Box mt={1}>
                  {importResult.errors.map((err, i) => (
                    <Typography key={i} variant="caption" display="block">
                      Row {err.row}: {err.email} — {err.message}
                    </Typography>
                  ))}
                </Box>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultOpen(false)} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
