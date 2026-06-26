import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemAvatar, Avatar, Badge, ListItemText, IconButton,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import ChatIcon from "@mui/icons-material/Chat";
import GroupsIcon from "@mui/icons-material/Groups";
import SearchIcon from "@mui/icons-material/Search";
import { fetchUsers } from "../../redux/slices/adminSlice";
import {
  fetchMembers, addMember, removeMember,
} from "../../redux/slices/workspaceSlice";
import { createConversation } from "../../redux/slices/chatSlice";

export default function MemberManager({ workspaceId, open, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { members } = useSelector((state) => state.workspace);
  const users = useSelector((state) => state.admin.users);
  const user = useSelector((state) => state.auth.user);
  const onlineUserIds = useSelector((state) => state.chat.onlineUserIds);
  const conversations = useSelector((state) => state.chat.conversations);
  const isAdmin = user?.role === "admin";

  const workspaceMembers = members[workspaceId] || [];
  const sortedMembers = [
    ...workspaceMembers.filter((m) => m.userId === user?.id),
    ...workspaceMembers.filter((m) => m.userId !== user?.id),
  ];
  const [selectedUserId, setSelectedUserId] = useState("");
  const [search, setSearch] = useState("");

  const filteredMembers = search.trim()
    ? sortedMembers.filter((m) =>
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase())
      )
    : sortedMembers;

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

  const handleDM = async (targetUserId) => {
    const existing = conversations.find((c) =>
      c.participants?.includes(user?.id) && c.participants?.includes(targetUserId)
    );
    let convId;
    if (existing) {
      convId = existing.id;
    } else {
      const result = await dispatch(createConversation(targetUserId)).unwrap();
      convId = result.id;
    }
    onClose();
    navigate(`/direct-messages/${convId}`);
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

        <TextField
          fullWidth
          size="small"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 1,
            "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "rgba(255,255,255,0.03)" },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <List sx={{ px: 0 }}>
          {filteredMembers.map((m) => (
            <ListItem
              key={m.id}
              sx={{ borderRadius: "8px", mb: 0.5, "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}
              secondaryAction={
                m.userId !== user?.id ? (
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {isAdmin && (
                      <IconButton color="error" onClick={() => handleRemove(m.userId)}>
                        <RemoveCircleIcon />
                      </IconButton>
                    )}
                    <IconButton onClick={() => handleDM(m.userId)}>
                      <ChatIcon />
                    </IconButton>
                  </Box>
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
          {workspaceMembers.length === 0 && !search.trim() && (
            <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
              No members yet.
            </Typography>
          )}
          {filteredMembers.length === 0 && search.trim() && (
            <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
              No members match your search.
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
