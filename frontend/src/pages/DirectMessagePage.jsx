import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Typography, Avatar, Badge, CircularProgress, Button, List, ListItem, ListItemAvatar,
  ListItemText, Divider, TextField, InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ChatIcon from "@mui/icons-material/Chat";
import DirectChatView from "../components/direct-message/DirectChatView";
import {
  fetchUsers,
  fetchConversations,
  createConversation,
} from "../redux/slices/chatSlice";

function EmptyState() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ height: "100%", opacity: 0.4 }}
    >
      <ChatIcon sx={{ fontSize: 80, mb: 2 }} />
      <Typography variant="h5" sx={{ fontFamily: "Outfit", fontWeight: 600 }}>
        Select a user
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Choose a user from the sidebar to start chatting
      </Typography>
    </Box>
  );
}

export default function DirectMessagePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { users, conversations, onlineUserIds, loadingUsers, loadingConversations } = useSelector((state) => state.chat);
  const currentUser = useSelector((state) => state.auth.user);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchConversations());
  }, [dispatch]);

  const conversationMap = useMemo(() => {
    const map = {};
    for (const c of conversations) {
      const otherId = c.participants?.find((p) => p !== currentUser?.id);
      if (otherId) map[otherId] = c;
    }
    return map;
  }, [conversations, currentUser?.id]);

  const sortedUsers = useMemo(() => {
    let list = users.filter((u) => u.id !== currentUser?.id);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    const withConv = [];
    const withoutConv = [];
    for (const u of list) {
      if (conversationMap[u.id]) {
        withConv.push(u);
      } else {
        withoutConv.push(u);
      }
    }

    withConv.sort((a, b) => {
      const aConv = conversationMap[a.id];
      const bConv = conversationMap[b.id];
      const aTime = aConv.lastMessage ? new Date(aConv.lastMessage.createdAt).getTime() : new Date(aConv.createdAt).getTime();
      const bTime = bConv.lastMessage ? new Date(bConv.lastMessage.createdAt).getTime() : new Date(bConv.createdAt).getTime();
      return bTime - aTime;
    });

    withoutConv.sort((a, b) => a.name.localeCompare(b.name));

    return [...withConv, ...withoutConv];
  }, [users, currentUser?.id, conversationMap, search]);

  const handleUserClick = async (userId) => {
    let conv = conversationMap[userId];
    if (!conv) {
      const res = await dispatch(createConversation(userId)).unwrap();
      conv = res;
    }
    navigate(`/direct-messages/${conv.id}`, { replace: !!conversationId });
  };

  const loading = loadingUsers || loadingConversations;

  return (
    <>
      <Button
        startIcon={<DashboardIcon />}
        onClick={() => navigate("/dashboard")}
        sx={{ mt: 2, mb: -1, ml: 2, textTransform: "none", fontFamily: "Outfit", fontWeight: 600, alignSelf: "flex-start" }}
      >
        Back to Dashboard
      </Button>
      <Box
        sx={{
          display: "flex",
          height: "calc(100vh - 80px)",
          width: "100%",
          mt: 2,
          gap: 2,
        }}
      >
      {/* Left sidebar */}
      <Box
        sx={{
          width: 280,
          flexShrink: 0,
          minWidth: 280,
          display: "flex",
          flexDirection: "column",
          bgcolor: "rgba(18,18,38,0.6)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <Box px={2} py={1.5}>
          <Typography
            variant="h6"
            sx={{ fontFamily: "Outfit", fontWeight: 700, fontSize: "1rem", mb: 1.5 }}
          >
            Direct Messages
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                bgcolor: "rgba(255,255,255,0.03)",
              },
            }}
          />
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />
        <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
          {loading && sortedUsers.length === 0 && (
            <Box textAlign="center" py={4}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!loading && sortedUsers.length === 0 && (
            <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
              {search ? "No users match your search." : "No other users found."}
            </Typography>
          )}
          <List sx={{ px: 1 }}>
            {sortedUsers.map((u) => {
              const conv = conversationMap[u.id];
              const selected = conv?.id === conversationId;
              return (
                <ListItem
                  key={u.id}
                  button
                  selected={selected}
                  onClick={() => handleUserClick(u.id)}
                  sx={{
                    borderRadius: "10px",
                    mb: 0.5,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      "&:hover": { bgcolor: "primary.dark" },
                    },
                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      variant="dot"
                      sx={{
                        "& .MuiBadge-badge": {
                          bgcolor: onlineUserIds.includes(u.id) ? "#22c55e" : "transparent",
                          boxShadow: onlineUserIds.includes(u.id) ? "0 0 0 2px #121226" : "none",
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: selected ? "primary.dark" : "rgba(255,255,255,0.1)",
                          width: 36,
                          height: 36,
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={u.name}
                    secondary={
                      conv?.lastMessage
                        ? (conv.lastMessage.userId === currentUser?.id ? "You: " : "") + conv.lastMessage.content
                        : u.email
                    }
                    primaryTypographyProps={{
                      variant: "body2",
                      fontWeight: 600,
                      noWrap: true,
                    }}
                    secondaryTypographyProps={{
                      variant: "caption",
                      noWrap: true,
                      color: "textSecondary",
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Box>

      {/* Right panel */}
      <Box
        sx={{
          flex: 1,
          bgcolor: "rgba(18,18,38,0.6)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
        }}
      >
        {conversationId ? (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <DirectChatView conversationId={conversationId} />
          </Box>
        ) : (
          <EmptyState />
        )}
      </Box>
    </Box>
    </>
  );
}
