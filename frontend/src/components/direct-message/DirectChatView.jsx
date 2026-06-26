import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, TextField, CircularProgress, Paper, Avatar, Badge,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { fetchMessages, sendMessage, deleteMessage } from "../../redux/slices/chatSlice";

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

export default function DirectChatView({ conversationId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { conversations, messages, onlineUserIds, loadingMessages, sendingMessage } = useSelector((state) => state.chat);
  const user = useSelector((state) => state.auth.user);

  const conversation = conversations.find((c) => c.id === conversationId);
  const otherUser = conversation?.otherUser || { name: "User" };
  const chatMessages = messages[conversationId] || [];

  const [input, setInput] = useState("");
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState({ open: false, type: null });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      dispatch(fetchMessages({ conversationId }));
    }
  }, [conversationId, dispatch]);

  const msgCount = chatMessages.length;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgCount]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await dispatch(sendMessage({ conversationId, content: input.trim() }));
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSelectMessage = (msgId) => {
    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  const clearSelection = () => setSelectedMessages(new Set());

  const handleBulkDeleteClick = () => {
    const hasOther = [...selectedMessages].some((msgId) => {
      const msg = chatMessages.find((m) => m.id === msgId);
      return msg && msg.userId !== user?.id;
    });
    setBulkDeleteDialog({ open: true, type: hasOther ? "confirm" : "choice" });
  };

  const confirmBulkDelete = async (deleteFrom) => {
    for (const msgId of selectedMessages) {
      await dispatch(deleteMessage({ conversationId, msgId, deleteFrom }));
    }
    setSelectedMessages(new Set());
    setBulkDeleteDialog({ open: false, type: null });
  };

  const grouped = {};
  for (const msg of chatMessages) {
    const dateKey = formatDate(msg.createdAt);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(msg);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {loadingMessages && chatMessages.length === 0 && (
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
        <Button
          size="small"
          onClick={() => navigate("/direct-messages", { replace: true })}
          sx={{ minWidth: 32, p: 0.5, color: "text.secondary" }}
        >
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </Button>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          variant="dot"
          sx={{
            "& .MuiBadge-badge": {
              bgcolor: onlineUserIds.includes(otherUser?.id) ? "#22c55e" : "transparent",
              boxShadow: onlineUserIds.includes(otherUser?.id) ? "0 0 0 2px #121226" : "none",
              width: 10,
              height: 10,
              borderRadius: "50%",
            },
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "rgba(255,255,255,0.1)",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            {otherUser?.name?.charAt(0)?.toUpperCase() || "?"}
          </Avatar>
        </Badge>
        <Box flex={1}>
          <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700, fontSize: "1rem" }}>
            {otherUser?.name || "User"}
          </Typography>
        </Box>
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
              const isOwn = msg.userId === user?.id;
              const isSelected = selectedMessages.has(msg.id);
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
                    onClick={() => toggleSelectMessage(msg.id)}
                    sx={{
                      maxWidth: "70%",
                      bgcolor: isOwn ? "primary.dark" : "rgba(255,255,255,0.05)",
                      borderRadius: "12px",
                      borderBottomRightRadius: isOwn ? "4px" : "12px",
                      borderBottomLeftRadius: isOwn ? "12px" : "4px",
                      px: 2,
                      py: 1,
                      cursor: "pointer",
                      outline: isSelected ? "2px solid" : "none",
                      outlineColor: "primary.main",
                    }}
                  >
                    {!isOwn && (
                      <Typography variant="caption" color="primary" fontWeight={600}>
                        {msg.userName}
                      </Typography>
                    )}
                    <Typography variant="body2">{msg.content}</Typography>
                    <Box display="flex" justifyContent="flex-end" mt={0.5}>
                      <Typography variant="caption" color="textSecondary" sx={{ opacity: 0.6, fontSize: 10 }}>
                        {formatTime(msg.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Floating selection bar */}
      {selectedMessages.size > 0 && (
        <Paper
          sx={{
            p: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 2,
            justifyContent: "center",
            background: "rgba(18,18,38,0.95)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 0,
            boxShadow: "none",
          }}
        >
          <Typography variant="body2" sx={{ fontFamily: "Outfit" }}>
            {selectedMessages.size} message(s) selected
          </Typography>
          <Button size="small" variant="contained" color="error" onClick={handleBulkDeleteClick}>
            Delete Selected
          </Button>
          <Button size="small" onClick={clearSelection} sx={{ textTransform: "none" }}>
            Clear
          </Button>
        </Paper>
      )}

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
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          multiline
          maxRows={3}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!input.trim() || sendingMessage}
          sx={{ borderRadius: "8px", minWidth: 48 }}
        >
          <SendIcon />
        </Button>
      </Paper>

      <Dialog open={bulkDeleteDialog.open} onClose={() => setBulkDeleteDialog({ open: false, type: null })}>
        {bulkDeleteDialog.type === "choice" ? (
          <>
            <DialogTitle sx={{ fontFamily: "Outfit", fontWeight: 700 }}>Delete Messages</DialogTitle>
            <DialogContent>
              <DialogContentText>How would you like to delete these messages?</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => confirmBulkDelete("me")}
                sx={{ textTransform: "none", fontFamily: "Outfit" }}
              >
                Delete from me
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => confirmBulkDelete("both")}
                sx={{ textTransform: "none", fontFamily: "Outfit" }}
              >
                Delete for both
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{ fontFamily: "Outfit", fontWeight: 700 }}>Delete Messages</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete these {selectedMessages.size} messages?
                This will delete them from your view only.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => setBulkDeleteDialog({ open: false, type: null })}
                sx={{ textTransform: "none", fontFamily: "Outfit" }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => confirmBulkDelete("me")}
                sx={{ textTransform: "none", fontFamily: "Outfit" }}
              >
                Delete from me
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
