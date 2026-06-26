import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Button, Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemAvatar, Avatar, Badge, ListItemText, IconButton,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import GroupsIcon from "@mui/icons-material/Groups";
import { fetchUsers } from "../../redux/slices/adminSlice";
import {
  fetchMembers, addMember, removeMember,
} from "../../redux/slices/workspaceSlice";

export default function MemberManager({ workspaceId, open, onClose }) {
  const dispatch = useDispatch();
  const { members } = useSelector((state) => state.workspace);
  const users = useSelector((state) => state.admin.users);
  const user = useSelector((state) => state.auth.user);
  const onlineUserIds = useSelector((state) => state.chat.onlineUserIds);
  const isAdmin = user?.role === "admin";

  const workspaceMembers = members[workspaceId] || [];
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (workspaceId && open) {
      dispatch(fetchMembers(workspaceId));
      dispatch(fetchUsers());
    }
  }, [workspaceId, open, dispatch]);

  const handleAdd = async () => {
    if (!selectedUserId) return;
    await dispatch(addMember({ workspaceId, userId: selectedUserId }));
    setSelectedUserId("");
  };

  const handleRemove = async (userId) => {
    if (window.confirm("Remove this member?")) {
      await dispatch(removeMember({ workspaceId, userId }));
    }
  };

  const memberIds = new Set(workspaceMembers.map((m) => m.userId));
  const availableUsers = users
    .filter((u) => u.id !== user?.id && !memberIds.has(u.id))
    .filter((u) => u.role !== "admin");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: "Outfit", fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
        <GroupsIcon /> Members ({workspaceMembers.length})
      </DialogTitle>
      <DialogContent sx={{ pb: 0 }}>
        {isAdmin && (
          <Box display="flex" gap={1} mb={3} mt={1}>
            <FormControl size="small" fullWidth>
              <InputLabel>Add User</InputLabel>
              <Select
                value={selectedUserId}
                label="Add User"
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                {availableUsers.length === 0 && (
                  <MenuItem disabled value="">
                    No users available
                  </MenuItem>
                )}
                {availableUsers.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} ({u.email}){u.role === "admin" ? " — Admin" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleAdd}
              disabled={!selectedUserId}
              sx={{ flexShrink: 0 }}
            >
              Add
            </Button>
          </Box>
        )}

        <List sx={{ px: 0 }}>
          {workspaceMembers.map((m) => (
            <ListItem
              key={m.id}
              sx={{ borderRadius: "8px", mb: 0.5, "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}
              secondaryAction={
                isAdmin && m.userId !== user?.id ? (
                  <IconButton edge="end" color="error" onClick={() => handleRemove(m.userId)}>
                    <RemoveCircleIcon />
                  </IconButton>
                ) : null
              }
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  variant="dot"
                  sx={{
                    "& .MuiBadge-badge": {
                      bgcolor: onlineUserIds.includes(m.userId) ? "#22c55e" : "transparent",
                      boxShadow: onlineUserIds.includes(m.userId) ? "0 0 0 2px #121226" : "none",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                    },
                  }}
                >
                  <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
                    {m.name?.charAt(0)?.toUpperCase() || "?"}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={m.name}
                secondary={m.email}
                primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }}
                secondaryTypographyProps={{ variant: "caption" }}
              />
              {m.userId === user?.id && (
                <Chip label="You" size="small" variant="outlined" sx={{ mr: isAdmin && m.userId !== user?.id ? 1 : 2 }} />
              )}
            </ListItem>
          ))}
          {workspaceMembers.length === 0 && (
            <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
              No members yet.
            </Typography>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
