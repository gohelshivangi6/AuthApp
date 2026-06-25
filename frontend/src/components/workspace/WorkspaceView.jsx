import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, IconButton, TextField, CircularProgress, Paper,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Menu, MenuItem,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  sendMessage, editMessage, deleteMessage, leaveWorkspace,
} from "../../redux/slices/workspaceSlice";
import MemberManager from "./MemberManager";

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function WorkspaceView({ workspaceId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { workspaces, members, messages, loading } = useSelector((state) => state.workspace);
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const workspace = workspaces.find((w) => w.id === workspaceId);
  const workspaceMessages = messages[workspaceId] || [];
  const workspaceMembers = members[workspaceId] || [];

  const [input, setInput] = useState("");
  const [memberOpen, setMemberOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, msgId: null });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const messagesEndRef = useRef(null);
  const isMember = workspaceMembers.some((m) => m.userId === user?.id);

  useEffect(() => {
    if (!isAdmin && !isMember && workspaceId) {
      navigate("/workspaces", { replace: true });
    }
  }, [isAdmin, isMember, workspaceId, navigate]);

  const handleLeave = async () => {
    setMenuAnchor(null);
    await dispatch(leaveWorkspace({ workspaceId }));
    navigate("/workspaces", { replace: true });
  };

  const messageCount = workspaceMessages.length;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await dispatch(sendMessage({ workspaceId, content: input.trim() }));
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEdit = async (msgId) => {
    if (!editInput.trim()) return;
    await dispatch(editMessage({ workspaceId, msgId, content: editInput.trim() }));
    setEditingId(null);
    setEditInput("");
  };

  const handleDeleteOwn = (msgId) => {
    setDeleteDialog({ open: true, msgId });
  };

  const handleDeleteOther = async (msgId) => {
    await dispatch(deleteMessage({ workspaceId, msgId, deleteFrom: "all" }));
  };

  const confirmDeleteFromMe = async () => {
    await dispatch(deleteMessage({ workspaceId, msgId: deleteDialog.msgId, deleteFrom: "me" }));
    setDeleteDialog({ open: false, msgId: null });
  };

  const confirmDeleteFromAll = async () => {
    await dispatch(deleteMessage({ workspaceId, msgId: deleteDialog.msgId, deleteFrom: "all" }));
    setDeleteDialog({ open: false, msgId: null });
  };

  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditInput(msg.content);
  };

  const grouped = {};
  for (const msg of workspaceMessages) {
    const dateKey = formatDate(msg.createdAt);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(msg);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {loading && workspaceMessages.length === 0 && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.3)",
            zIndex: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {/* Header */}
      <Paper
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          background: "transparent",
          border: "none",
          borderRadius: 0,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "none",
        }}
      >
        <Box flex={1}>
          <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700, fontSize: "1.05rem" }}>
            {workspace?.name || "Workspace"}
          </Typography>
          {workspace?.description && (
            <Typography variant="caption" color="textSecondary">
              {workspace.description}
            </Typography>
          )}
        </Box>
        <Button
          size="small"
          startIcon={<PeopleIcon />}
          onClick={() => setMemberOpen(true)}
          sx={{ borderRadius: "8px", textTransform: "none", fontSize: "0.8rem" }}
        >
          {workspaceMembers.length}
        </Button>
        {!isAdmin && (
          <>
            <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={!!menuAnchor}
              onClose={() => setMenuAnchor(null)}
              slotProps={{
                paper: {
                  sx: {
                    background: "rgba(18, 18, 43, 0.95)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 2,
                    minWidth: 160,
                  },
                },
              }}
            >
              <MenuItem onClick={handleLeave} sx={{ color: "#ef4444" }}>
                Leave Workspace
              </MenuItem>
            </Menu>
          </>
        )}
      </Paper>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          py: 2,
          px: 2,
        }}
      >
        {Object.entries(grouped).map(([dateKey, msgs]) => (
          <Box key={dateKey}>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ display: "block", textAlign: "center", my: 2, opacity: 0.6 }}
            >
              {dateKey}
            </Typography>
            {msgs.map((msg) => {
              if (msg.type === "system") {
                return (
                  <Box key={msg.id} sx={{ textAlign: "center", my: 1.5 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontStyle: "italic", opacity: 0.6 }}>
                      {msg.userName} {msg.content}
                    </Typography>
                  </Box>
                );
              }
              const isOwn = msg.userId === user?.id;
              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: "flex",
                    justifyContent: isOwn ? "flex-end" : "flex-start",
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: "70%",
                      bgcolor: isOwn ? "primary.dark" : "rgba(255,255,255,0.05)",
                      borderRadius: "12px",
                      borderBottomRightRadius: isOwn ? "4px" : "12px",
                      borderBottomLeftRadius: isOwn ? "12px" : "4px",
                      px: 2,
                      py: 1,
                      position: "relative",
                    }}
                  >
                    {!isOwn && (
                      <Typography variant="caption" color="primary" fontWeight={600}>
                        {msg.userName}
                      </Typography>
                    )}

                    {editingId === msg.id ? (
                      <Box display="flex" gap={1} alignItems="flex-start">
                        <TextField
                          size="small"
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleEdit(msg.id);
                            }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          sx={{ "& .MuiInputBase-input": { py: 0.5 } }}
                        />
                        <Button size="small" onClick={() => handleEdit(msg.id)}>Save</Button>
                        <Button size="small" onClick={() => setEditingId(null)}>Cancel</Button>
                      </Box>
                    ) : (
                      <Typography variant="body2">{msg.content}</Typography>
                    )}

                    <Box display="flex" justifyContent="flex-end" alignItems="center" gap={0.5} mt={0.5}>
                      <Typography variant="caption" color="textSecondary" sx={{ opacity: 0.6, fontSize: 10 }}>
                        {formatTime(msg.createdAt)}
                        {msg.editedAt && " (edited)"}
                      </Typography>
                      {isOwn && editingId !== msg.id && (
                        <>
                          <IconButton size="small" sx={{ opacity: 0.4 }} onClick={() => startEdit(msg)}>
                            <EditIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                          <IconButton size="small" sx={{ opacity: 0.4 }} onClick={() => handleDeleteOwn(msg.id)}>
                            <DeleteIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </>
                      )}
                      {!isOwn && isAdmin && (
                        <IconButton size="small" sx={{ opacity: 0.4 }} onClick={() => handleDeleteOther(msg.id)}>
                          <DeleteIcon sx={{ fontSize: 12 }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Paper
        sx={{
          p: 2,
          display: "flex",
          gap: 1,
          background: "transparent",
          border: "none",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 0,
          boxShadow: "none",
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder={isMember ? "Type a message..." : "You don't have access."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isMember}
          multiline
          maxRows={3}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!input.trim() || !isMember}
          sx={{ borderRadius: "8px", minWidth: 48 }}
        >
          <SendIcon />
        </Button>
      </Paper>

      <MemberManager workspaceId={workspaceId} open={memberOpen} onClose={() => setMemberOpen(false)} />

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, msgId: null })}>
        <DialogTitle sx={{ fontFamily: "Outfit", fontWeight: 700 }}>Delete Message</DialogTitle>
        <DialogContent>
          <DialogContentText>
            How would you like to delete this message?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={confirmDeleteFromMe}
            sx={{ textTransform: "none", fontFamily: "Outfit" }}
          >
            Delete from me
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteFromAll}
            sx={{ textTransform: "none", fontFamily: "Outfit" }}
          >
            Delete from all
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
