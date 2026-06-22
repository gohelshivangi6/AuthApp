import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Paper, Select, MenuItem, FormControl, InputLabel,
  Button, CircularProgress, Alert, Snackbar,
} from "@mui/material";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  fetchDashboards, fetchDashboardLayout, saveDashboardLayout,
} from "../../redux/slices/adminSlice";
import { decryptData } from "../../decrypt/decryption";
import { getDashboardDataBySlug } from "../../services/dashboardService";

const SECTION_LABELS = {
  kpiCards: "KPI Cards",
  charts: "Charts",
  tables: "Tables",
};

const DEFAULT_SECTION_ORDER = ["kpiCards", "charts", "tables"];

function SortableSection({ sectionKey, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `section-${sectionKey}`,
    data: { type: "section", sectionKey },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        p: 2,
        mb: 2,
        background: "rgba(18,18,38,0.6)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        sx={{ cursor: "grab", mb: 1.5, userSelect: "none" }}
        {...attributes}
        {...listeners}
      >
        <DragIndicatorIcon sx={{ color: "text.secondary" }} />
        <Typography variant="subtitle1" sx={{ fontFamily: "Outfit", fontWeight: 700 }}>
          {SECTION_LABELS[sectionKey] || sectionKey}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
          {children.length} items
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}

function SortableItem({ id, label, section }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: "item", section, id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      variant="outlined"
      sx={{
        p: "6px 12px",
        mb: 0.5,
        display: "flex",
        alignItems: "center",
        gap: 1,
        background: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.06)",
        borderRadius: "8px",
        cursor: "grab",
        userSelect: "none",
      }}
      {...attributes}
      {...listeners}
    >
      <DragIndicatorIcon sx={{ fontSize: 16, color: "text.secondary" }} />
      <Typography variant="body2" sx={{ fontFamily: "Inter" }}>
        {label}
      </Typography>
    </Paper>
  );
}

function collisionDetection(args) {
  const { active, droppableContainers, ...rest } = args;
  const activeType = active?.data?.current?.type;

  const filtered = droppableContainers.filter((c) => {
    const t = c.data?.current?.type;
    if (activeType === "section") return t === "section";
    if (activeType === "item") {
      return t === "item" && c.data?.current?.section === active.data?.current?.section;
    }
    return false;
  });

  return closestCenter({ ...rest, active, droppableContainers: filtered });
}

function reorderBy(items, order) {
  if (!order || order.length === 0) return items;
  const ordered = order.map((id) => items.find((i) => i.id === id)).filter(Boolean);
  const remaining = items.filter((i) => !order.includes(i.id));
  return [...ordered, ...remaining];
}

export default function DashboardLayoutEditor() {
  const dispatch = useDispatch();
  const { dashboards, dashboardLayout } = useSelector((s) => s.admin);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [localSectionOrder, setLocalSectionOrder] = useState([]);
  const [localItems, setLocalItems] = useState({ kpiCards: [], charts: [], tables: [] });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const slugInitialized = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    dispatch(fetchDashboards());
  }, [dispatch]);

  useEffect(() => {
    if (dashboards.length > 0 && !slugInitialized.current) {
      slugInitialized.current = true;
      setSelectedSlug(dashboards[0].path);
    }
  }, [dashboards]);

  useEffect(() => {
    if (!selectedSlug) return;
    dispatch(fetchDashboardLayout(selectedSlug));
    const timer = setTimeout(() => {
      setMessage({ type: "", text: "" });
      getDashboardDataBySlug(selectedSlug)
        .then(async (res) => {
          const decrypted = await decryptData(res.data);
          setDashboardData(decrypted);
        })
        .catch(() => setDashboardData(null));
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedSlug, dispatch]);

  useEffect(() => {
    if (!dashboardData || !dashboardLayout) return;
    const timer = setTimeout(() => {
      const order = dashboardLayout?.sectionOrder?.length
        ? dashboardLayout.sectionOrder
        : DEFAULT_SECTION_ORDER;
      setLocalSectionOrder(order);
      setLocalItems({
        kpiCards: reorderBy(dashboardData.kpiCards || [], dashboardLayout?.kpiCardsOrder),
        charts: reorderBy(dashboardData.charts || [], dashboardLayout?.chartsOrder),
        tables: reorderBy(dashboardData.tables || [], dashboardLayout?.tablesOrder),
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [dashboardData, dashboardLayout]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;

    if (activeType === "section") {
      setLocalSectionOrder((prev) => {
        const oldIdx = prev.indexOf(active.id.replace("section-", ""));
        const newIdx = prev.indexOf(over.id.replace("section-", ""));
        if (oldIdx === -1 || newIdx === -1) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
    } else if (activeType === "item") {
      const section = active.data.current?.section;
      if (!section) return;
      setLocalItems((prev) => {
        const items = [...(prev[section] || [])];
        const oldIdx = items.findIndex((i) => i.id === active.id);
        const newIdx = items.findIndex((i) => i.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return prev;
        return { ...prev, [section]: arrayMove(items, oldIdx, newIdx) };
      });
    }
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await dispatch(saveDashboardLayout({
        slug: selectedSlug,
        layout: {
          sectionOrder: localSectionOrder,
          kpiCardsOrder: localItems.kpiCards.map((i) => i.id),
          chartsOrder: localItems.charts.map((i) => i.id),
          tablesOrder: localItems.tables.map((i) => i.id),
        },
      })).unwrap();
      setMessage({ type: "success", text: "Layout saved successfully." });
    } catch {
      setMessage({ type: "error", text: "Failed to save layout." });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (!dashboardData) return;
    setLocalSectionOrder(DEFAULT_SECTION_ORDER);
    setLocalItems({
      kpiCards: dashboardData.kpiCards || [],
      charts: dashboardData.charts || [],
      tables: dashboardData.tables || [],
    });
  }

  const sectionSortableIds = localSectionOrder.map((k) => `section-${k}`);
  const dataLoading = selectedSlug && !dashboardData;

  return (
    <Box>
      <Typography variant="h6" sx={{ fontFamily: "Outfit", fontWeight: 700 }} mb={3}>
        Dashboard Layout Editor
      </Typography>

      <FormControl size="small" sx={{ mb: 3, minWidth: 280 }}>
        <InputLabel>Select Dashboard</InputLabel>
        <Select
          value={selectedSlug}
          label="Select Dashboard"
          onChange={(e) => {
            setSelectedSlug(e.target.value);
            setMessage({ type: "", text: "" });
          }}
        >
          {dashboards.map((d) => (
            <MenuItem key={d.path} value={d.path}>{d.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Snackbar
        open={!!message.text}
        autoHideDuration={3000}
        onClose={() => setMessage({ type: "", text: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={message.type} variant="filled" sx={{ width: "100%" }}>
          {message.text}
        </Alert>
      </Snackbar>

      {dataLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : !dashboardData ? (
        <Typography color="text.secondary" textAlign="center" py={4}>
          No dashboard data available.
        </Typography>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Drag the sections or items below to reorder them. Sections can be reordered by dragging their headers.
          </Typography>

          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sectionSortableIds}
              strategy={verticalListSortingStrategy}
            >
              {localSectionOrder.map((sectionKey) => {
                const items = localItems[sectionKey] || [];
                return (
                  <SortableSection key={sectionKey} sectionKey={sectionKey}>
                    <SortableContext
                      items={items.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {items.map((item) => (
                        <SortableItem
                          key={item.id}
                          id={item.id}
                          label={item.title || item.id}
                          section={sectionKey}
                        />
                      ))}
                    </SortableContext>
                  </SortableSection>
                );
              })}
            </SortableContext>
          </DndContext>

          <Box display="flex" gap={2} mt={3}>
            <Button variant="outlined" onClick={handleReset}>
              Reset to Default
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Layout"}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
