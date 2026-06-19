import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Typography, Button, Avatar,
  CircularProgress, List, ListItem, ListItemAvatar,
  ListItemText, Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ForumIcon from "@mui/icons-material/Forum";
import WorkspaceView from "./WorkspaceView";
import WorkspaceCreateDialog from "./WorkspaceCreateDialog";
import { fetchWorkspaces, fetchMembers, fetchMessages } from "../../redux/slices/workspaceSlice";

function EmptyState() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ height: "100%", opacity: 0.4 }}
    >
      <ForumIcon sx={{ fontSize: 80, mb: 2 }} />
      <Typography variant="h5" sx={{ fontFamily: "Outfit", fontWeight: 600 }}>
        Select a workspace
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Choose a workspace from the sidebar to start chatting
      </Typography>
    </Box>
  );
}

export default function WorkspaceList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { workspaces, loading } = useSelector((state) => state.workspace);
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useEffect(() => {
    if (id) {
      dispatch(fetchMembers(id));
      dispatch(fetchMessages({ workspaceId: id }));
    }
  }, [id, dispatch]);

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 80px)", width: "100%", mt: 2, gap: 2 }}>
      {/* Left sidebar */}
      <Box
        sx={{
          width: 240,
          flexShrink: 0,
          minWidth: 240,
          display: "flex",
          flexDirection: "column",
          bgcolor: "rgba(18,18,38,0.6)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
          <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700, fontSize: "1rem" }}>
            Workspaces
          </Typography>
          {isAdmin && (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
            >
              Create
            </Button>
          )}
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />
        <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
          {loading && workspaces.length === 0 && (
            <Box textAlign="center" py={4}><CircularProgress size={24} /></Box>
          )}
          {!loading && workspaces.length === 0 && (
            <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
              No workspaces yet.
            </Typography>
          )}
          <List sx={{ px: 1 }}>
            {workspaces.map((w) => {
              const selected = w.id === id;
              return (
                <ListItem
                  key={w.id}
                  button
                  selected={selected}
                  onClick={() => navigate(`/workspaces/${w.id}`)}
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
                    <Avatar sx={{ bgcolor: selected ? "primary.dark" : "rgba(255,255,255,0.1)", width: 36, height: 36 }}>
                      <ForumIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={w.name}
                    secondary={w.description || ""}
                    primaryTypographyProps={{ variant: "body2", fontWeight: 600, noWrap: true }}
                    secondaryTypographyProps={{ variant: "caption", noWrap: true, color: "textSecondary" }}
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
        {id ? (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <WorkspaceView workspaceId={id} />
          </Box>
        ) : (
          <EmptyState />
        )}
      </Box>

      <WorkspaceCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Box>
  );
}
