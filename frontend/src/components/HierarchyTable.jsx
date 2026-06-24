import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Breadcrumbs,
  Link,
  Chip,
  Tooltip,
  Fade,
  CircularProgress,
  TablePagination,
  InputBase,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  FormControlLabel,
  ListItemText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import GroupsIcon from "@mui/icons-material/Groups";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import InboxIcon from "@mui/icons-material/Inbox";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrintIcon from "@mui/icons-material/Print";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { decryptData } from "../decrypt/decryption";
import { getHierarchy } from "../services/hierarchyService";
import api from "../services/apiClient";

const ICON_MAP = {
  GroupsIcon: <GroupsIcon />,
  SupportAgentIcon: <SupportAgentIcon />,
  PeopleAltIcon: <PeopleAltIcon />,
  StorefrontIcon: <StorefrontIcon />,
  Inventory2Icon: <Inventory2Icon />,
  FactCheckIcon: <FactCheckIcon />,
};

const STATUS_CONFIG = {
  Active: {
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.2)",
    icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
  },
  Maintenance: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
    icon: <ScheduleIcon sx={{ fontSize: 14 }} />,
  },
  Inactive: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.2)",
    icon: <ErrorIcon sx={{ fontSize: 14 }} />,
  },
};

const CHIP_COLORS = {
  success: {
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.2)",
  },
  warning: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
  },
  error: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.2)",
  },
  info: {
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.2)",
  },
};

const BADGE_COLORS = {
  "A+": "#10b981",
  A: "#10b981",
  "B+": "#f59e0b",
  B: "#f59e0b",
  C: "#ef4444",
};

function formatCurrency(value, currencyConfig, unitOverride) {
  if (value == null) return "—";
  const num = Number(value);
  if (isNaN(num)) return value;
  if (!unitOverride) return num.toLocaleString("en-IN");
  const symbol = currencyConfig?.symbol || "\u20B9";
  const suffixDivisorMap = {
    K: 1000,
    Th: 1000,
    M: 1000000,
    Mn: 1000000,
    B: 1000000000,
    Bn: 1000000000,
    L: 100000,
    Lk: 100000,
    Cr: 10000000,
    "Cr.": 10000000,
    T: 1000000000000,
    Tn: 1000000000000,
  };
  const divisor = suffixDivisorMap[unitOverride];
  if (!divisor) return num.toLocaleString("en-IN");
  const decimals = divisor >= 10000000 ? 2 : divisor >= 1000 ? 1 : 0;
  return `${symbol}${(num / divisor).toFixed(decimals)}${unitOverride}`;
}

function formatNumber(value) {
  if (value == null) return "—";
  const num = Number(value);
  if (isNaN(num)) return value;
  return num.toLocaleString("en-IN");
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function getPerformanceColor(value) {
  const num = Number(value);
  if (isNaN(num)) return "success";
  if (num >= 80) return "success";
  if (num >= 50) return "warning";
  return "error";
}

function renderCellValue(col, item, theme, currencyConfig) {
  const value = item[col.field];

  if (col?.logoInitial) {
    return (
      <Box sx={{ display: "flex", alignItems: "center" }} gap={1.5}>
        {item.avatar ? (
          <Box
            component="img"
            src={item.avatar}
            alt={value}
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${theme.primaryColor}22, ${theme.primaryColor}11)`,
              border: `1px solid ${theme.primaryColor}33`,
              color: theme.primaryColor,
              fontSize: "0.75rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {value?.charAt(0) || "?"}
          </Box>
        )}
        <Box>
          <Typography
            sx={{
              fontFamily: theme.fontFamily,
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            {value}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (value == null || value === "") return "—";

  if (col.render === "currency")
    return formatCurrency(value, currencyConfig, col.unit);
  if (col.render === "percentage") {
    let pctValue;
    if (
      col.achievedOf &&
      item[col.achievedOf] != null &&
      item[col.percentageOf] != null
    ) {
      const base = Number(item[col.percentageOf]);
      const achieved = Number(item[col.achievedOf]);
      pctValue = base > 0 ? Math.round((achieved / base) * 100) : 0;
    } else if (col.percentageOf && item[col.percentageOf] != null) {
      const base = Number(item[col.percentageOf]);
      const current = Number(value);
      pctValue = base > 0 ? Math.round((current / base) * 100) : 0;
    } else {
      pctValue = Number(value);
    }
    const color = getPerformanceColor(pctValue);
    return (
      <Chip
        label={`${pctValue}%`}
        size="small"
        sx={{
          background: CHIP_COLORS[color].bg,
          color: CHIP_COLORS[color].color,
          fontWeight: 600,
          fontSize: "0.75rem",
          border: `1px solid ${CHIP_COLORS[color].border}`,
        }}
      />
    );
  }
  if (col.render === "date") return formatDate(value);
  if (col.render === "number") return formatNumber(value);

  if (col.render === "progress") {
    const num = Number(value);
    const max = col.progressMax || 1000;
    const pct = Math.min((num / max) * 100, 100);
    const color = pct >= 75 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
    return (
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 100 }}
      >
        <Box
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 3,
              background: color,
              transition: "width 0.3s",
            }}
          />
        </Box>
        <Typography
          sx={{
            fontSize: "0.75rem",
            color: "#94a3b8",
            minWidth: 30,
            textAlign: "right",
          }}
        >
          {formatNumber(value)}
        </Typography>
      </Box>
    );
  }

  if (col.render === "badge") {
    const badgeColor = BADGE_COLORS[value] || "#94a3b8";
    return (
      <Chip
        label={value}
        size="small"
        sx={{
          background: `${badgeColor}18`,
          color: badgeColor,
          fontWeight: 600,
          fontSize: "0.75rem",
          border: `1px solid ${badgeColor}33`,
        }}
      />
    );
  }

  if (col.render === "status") {
    const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.Active;
    return (
      <Chip
        icon={cfg.icon}
        label={value}
        size="small"
        sx={{
          background: cfg.bg,
          color: cfg.color,
          fontWeight: 600,
          fontSize: "0.75rem",
          border: `1px solid ${cfg.border}`,
          "& .MuiChip-icon": { color: cfg.color },
        }}
      />
    );
  }

  const chipMatch = col.render?.match(/^chip-(\w+)$/);
  if (chipMatch) {
    const variant = chipMatch[1];
    const cfg = CHIP_COLORS[variant] || CHIP_COLORS.info;
    let displayValue = value;
    if (col.suffix) displayValue = `${value}${col.suffix}`;
    if (col.prefix) displayValue = `${col.prefix}${value}`;
    return (
      <Chip
        label={displayValue}
        size="small"
        sx={{
          background: cfg.bg,
          color: cfg.color,
          fontWeight: 600,
          fontSize: "0.75rem",
          border: `1px solid ${cfg.border}`,
        }}
      />
    );
  }

  let displayValue = value;
  if (col.numberFormat && !isNaN(Number(value)))
    displayValue = formatNumber(value);
  if (col.suffix && displayValue !== "—")
    displayValue = `${displayValue}${col.suffix}`;
  if (col.prefix && displayValue !== "—")
    displayValue = `${col.prefix}${displayValue}`;

  return displayValue;
}

async function exportCSV(data, columns) {
  try {
    const response = await api.post(
      "/api/hierarchy/export/csv",
      { data, columns },
      { responseType: "blob" },
    );
    const url = URL.createObjectURL(
      new Blob([response.data], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "hierarchy-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("CSV export failed:", err);
  }
}

function parseCompressedConfig(raw) {
  const presets = raw.presets || {};

  const levels = (raw.levels || []).map((l) => {
    if (Array.isArray(l)) return { key: l[0], icon: l[1], color: l[2] };
    return l;
  });

  const columns = {};
  for (const [levelKey, cols] of Object.entries(raw.columns || {})) {
    columns[levelKey] = cols.map((c) => {
      if (Array.isArray(c)) {
        const field = c[0];
        const label = c.length > 1 && typeof c[1] === "string" ? c[1] : field;
        let presetName = null;
        let overrides = {};
        for (let i = 2; i < c.length; i++) {
          if (typeof c[i] === "string" && c[i].startsWith("$")) {
            presetName = c[i].slice(1);
          } else if (typeof c[i] === "object" && c[i] !== null) {
            overrides = c[i];
          }
        }
        const base =
          presetName && presets[presetName]
            ? { ...presets[presetName] }
            : { sortable: true };
        return { field, label, ...base, ...overrides };
      }
      return c;
    });
  }

  return { ...raw, levels, columns };
}

export default function HierarchyTable() {
  const [path, setPath] = useState([]);
  const [animate, setAnimate] = useState(true);
  const [config, setConfig] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [columnVisibility, setColumnVisibility] = useState({});
  const [colMenuAnchor, setColMenuAnchor] = useState(null);
  const [levelOrder, setLevelOrder] = useState(null);
  const [levelMenuAnchor, setLevelMenuAnchor] = useState(null);
  const [dragState, setDragState] = useState({
    active: false,
    dragIdx: null,
    overIdx: null,
    y: 0,
  });
  const dragStartY = useRef(0);
  const dragStartIdx = useRef(null);
  const levelItemRefs = useRef({});
  const prevConfigRef = useRef(null);
  const prevDataRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async (isPoll = false) => {
      try {
        const res = await getHierarchy();
        if (cancelled) return;

        const configStr = await decryptData(res.data.config);
        const dataStr = await decryptData(res.data.data);
        console.log("dataStr", dataStr);

        if (isPoll) {
          if (configStr !== prevConfigRef.current) {
            setConfig(parseCompressedConfig(configStr));
            prevConfigRef.current = configStr;
          }
          if (dataStr !== prevDataRef.current) {
            setRawData(dataStr);
            prevDataRef.current = dataStr;
          }
        } else {
          setConfig(parseCompressedConfig(configStr));
          setRawData(dataStr);
          prevConfigRef.current = configStr;
          prevDataRef.current = dataStr;
        }
      } catch (err) {
        if (!cancelled)
          setError(err.message || "Failed to load hierarchy data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll(false);

    const interval = setInterval(() => fetchAll(true), 50000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const configLevels = useMemo(() => {
    if (!config) return [];
    console.log("config.... ", config);
    return config.levels.map((l) => ({
      ...l,
      icon: ICON_MAP[l.icon] || <GroupsIcon />,
    }));
  }, [config]);

  const effectiveLevelOrder = useMemo(() => {
    if (levelOrder) return levelOrder;
    return configLevels.map((l) => l.key);
  }, [levelOrder, configLevels]);

  const levels = useMemo(() => {
    console.log("config level ", configLevels);
    const map = Object.fromEntries(configLevels.map((l) => [l.key, l]));
    return effectiveLevelOrder.map((key) => map[key]).filter(Boolean);
  }, [configLevels, effectiveLevelOrder]);
  console.log("base level", levels);

  const columns = useMemo(() => config?.columns || {}, [config]);
  const tableConfig = useMemo(() => config?.table || {}, [config]);
  const theme = useMemo(
    () =>
      config?.theme || {
        primaryColor: "#6366f1",
        borderRadius: "16px",
        fontFamily: "Inter, sans-serif",
        headingFontFamily: "Outfit, sans-serif",
      },
    [config],
  );

  const LEVEL_KEYS = useMemo(() => levels.map((l) => l.key), [levels]);
  const maxDepth = tableConfig.maxDepth || LEVEL_KEYS.length;

  const currentLevel = Math.min(path.length, maxDepth - 1);

  const nodeKey = useCallback((item) => item.id || item.name, []);

  const ORIG_ORDER = useMemo(() => {
    const orderMap = {
      "Zone Head": 0,
      CSO: 1,
      ASM: 2,
      DB: 3,
      Product: 4,
      CKU: 5,
    };
    return orderMap;
  }, []);

  const findDescendants = useCallback(
    (item, targetLevel) => {
      const result = [];
      const visited = new Set();
      function search(currentKey, currentOrigIdx) {
        if (visited.has(currentKey)) return;
        visited.add(currentKey);
        const nextOrigIdx = currentOrigIdx + 1;
        const nextLevelName = Object.keys(ORIG_ORDER).find(
          (k) => ORIG_ORDER[k] === nextOrigIdx,
        );
        if (!nextLevelName) return;
        const children = rawData.filter(
          (d) => d.parentId === currentKey && d.level === nextLevelName,
        );
        for (const child of children) {
          if (child.level === targetLevel) result.push(child);
          else search(nodeKey(child), nextOrigIdx);
        }
      }
      search(nodeKey(item), ORIG_ORDER[item.level]);
      return result;
    },
    [rawData, ORIG_ORDER, nodeKey],
  );

  const findAncestors = useCallback(
    (item, targetLevel) => {
      let current = item;
      while (current && current.level !== targetLevel) {
        if (!current.parentId) return [];
        current = rawData.find((d) => d.id === current.parentId);
      }
      return current ? [current] : [];
    },
    [rawData],
  );

  const findRelated = useCallback(
    (item, targetLevel) => {
      const origItemIdx = ORIG_ORDER[item.level];
      const origTargetIdx = ORIG_ORDER[targetLevel];
      if (origTargetIdx > origItemIdx)
        return findDescendants(item, targetLevel);
      if (origTargetIdx < origItemIdx) return findAncestors(item, targetLevel);
      return [];
    },
    [ORIG_ORDER, findDescendants, findAncestors],
  );

  const currentData = useMemo(() => {
    let data;
    if (path.length === 0) {
      data = rawData.filter((item) => item.level === LEVEL_KEYS[0]);
    } else {
      for (let i = 0; i < path.length; i++) {
        const nextLevel = LEVEL_KEYS[i + 1];
        if (!nextLevel) {
          data = [];
          break;
        }
        data = findRelated(path[i], nextLevel);
      }
    }

    if (searchQuery && tableConfig.searchable) {
      const q = searchQuery.toLowerCase();
      const searchFields = [
        "name",
        "zone",
        "region",
        "territory",
        "area",
        "location",
        "category",
        "sku",
        "status",
      ];
      data = data.filter((item) =>
        searchFields.some((f) =>
          String(item[f] || "")
            .toLowerCase()
            .includes(q),
        ),
      );
    }

    if (sortField) {
      data = [...data].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDir === "asc" ? aNum - bNum : bNum - aNum;
        }
        const aStr = String(aVal || "");
        const bStr = String(bVal || "");
        return sortDir === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return data;
  }, [
    path,
    rawData,
    searchQuery,
    sortField,
    sortDir,
    tableConfig,
    nodeKey,
    findRelated,
    LEVEL_KEYS,
  ]);

  const paginatedData = useMemo(() => {
    const pageSize = tableConfig.pageSize || 0;
    if (!pageSize) return currentData;
    const start = page * pageSize;
    return currentData.slice(start, start + pageSize);
  }, [currentData, page, tableConfig]);

  const hasChildren = (item) => {
    const idx = LEVEL_KEYS.indexOf(item.level);
    const nextLevel = LEVEL_KEYS[idx + 1];
    if (!nextLevel) return false;
    return findRelated(item, nextLevel).length > 0;
  };
  const isNodeDisabled = (item) => item.disabled === true;
  const isLevelDrillable = (lvl) => lvl?.drillable !== false;

  const handleRowClick = (item) => {
    if (isNodeDisabled(item)) return;
    if (!isLevelDrillable(levels[currentLevel])) return;
    if (!hasChildren(item) || currentLevel >= maxDepth - 1) return;
    setAnimate(false);
    setTimeout(() => {
      setPath([...path, item]);
      setSearchQuery("");
      setSortField(null);
      setPage(0);
      setSelected(new Set());
      setColumnVisibility({});
      setAnimate(true);
    }, 150);
  };

  const handleBreadcrumbClick = (index) => {
    setAnimate(false);
    setTimeout(() => {
      setPath(path.slice(0, index));
      setSearchQuery("");
      setSortField(null);
      setPage(0);
      setSelected(new Set());
      setColumnVisibility({});
      setAnimate(true);
    }, 150);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(new Set(paginatedData.map(nodeKey)));
    } else {
      setSelected(new Set());
    }
  };

  const handleSelectRow = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const moveLevel = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= effectiveLevelOrder.length) return;
    const next = [...effectiveLevelOrder];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setLevelOrder(next);
    setPath([]);
    setPage(0);
    setColumnVisibility({});
    setSortField(null);
    setSearchQuery("");
    setSelected(new Set());
  };

  const allColumnsForLevel = columns[LEVEL_KEYS[currentLevel]] || [];
  const activeColumns = allColumnsForLevel.filter((col) => {
    if (col.hidden === true) return false;
    if (columnVisibility[col.field] === false) return false;
    return true;
  });
  const levelInfo = levels[currentLevel] || levels[0];
  console.log("level", levelInfo);
  const isSelectable = tableConfig.selectable === true;
  const isStriped = tableConfig.striped === true;
  const canExport = tableConfig.exportable?.includes("csv");
  const canPrint = tableConfig.printable === true;
  const showSearch = tableConfig.searchable === true;
  const pageSize = tableConfig.pageSize || 0;

  const summaryRow = useMemo(() => {
    if (!currentData || currentData.length === 0) return null;
    const totals = {};
    activeColumns.forEach((col) => {
      if (col.primary) {
        totals[col.field] = "__TOTAL__";
        return;
      }
      const nums = currentData
        .map((item) => item[col.field])
        .filter((v) => v != null && v !== "")
        .map(Number)
        .filter((n) => !isNaN(n));
      totals[col.field] =
        nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : null;
    });
    return totals;
  }, [currentData, activeColumns]);

  if (loading) {
    return (
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        py={10}
      >
        <CircularProgress sx={{ color: theme.primaryColor }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        py={10}
      >
        <Typography color="error" sx={{ fontFamily: theme.fontFamily }}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={400}>
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }} gap={1.5}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: `linear-gradient(135deg, ${levelInfo.color}22, ${levelInfo.color}11)`,
                border: `1px solid ${levelInfo.color}44`,
                color: levelInfo.color,
              }}
            >
              {levelInfo.icon}
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: theme.headingFontFamily,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {LEVEL_KEYS[currentLevel] || "Hierarchy"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {levelInfo.subtitle ? `${levelInfo.subtitle} — ` : ""}
                {currentData.length} record{currentData.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }} gap={1}>
            <Tooltip title="Reorder levels">
              <IconButton
                onClick={(e) => setLevelMenuAnchor(e.currentTarget)}
                size="small"
                sx={{ color: levelMenuAnchor ? theme.primaryColor : "#94a3b8" }}
              >
                <DragIndicatorIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={levelMenuAnchor}
              open={Boolean(levelMenuAnchor)}
              onClose={() => setLevelMenuAnchor(null)}
              PaperProps={{
                sx: {
                  background: "rgba(22, 22, 42, 0.95)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  minWidth: 220,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                },
              }}
            >
              <Typography
                sx={{
                  px: 2,
                  pt: 1.5,
                  pb: 0.5,
                  fontFamily: theme.headingFontFamily,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#94a3b8",
                }}
              >
                Level Order
              </Typography>
              {effectiveLevelOrder.map((key, idx) => {
                const lvl = configLevels.find((l) => l.key === key);
                if (!lvl) return null;
                const { active, dragIdx: dIdx, overIdx: oIdx } = dragState;
                const isDragged = active && dIdx === idx;
                const ITEM_H = 44;

                let yShift = 0;
                if (active && dIdx !== null && oIdx !== null && dIdx !== oIdx) {
                  if (dIdx < oIdx && idx > dIdx && idx <= oIdx)
                    yShift = -ITEM_H;
                  else if (dIdx > oIdx && idx < dIdx && idx >= oIdx)
                    yShift = ITEM_H;
                }
                const visualY = isDragged ? dragState.y : yShift;

                return (
                  <Box
                    key={key}
                    ref={(el) => {
                      levelItemRefs.current[idx] = el;
                    }}
                    onPointerDown={(e) => {
                      if (e.target.closest("button")) return;
                      e.preventDefault();
                      e.stopPropagation();
                      const rect =
                        levelItemRefs.current[idx]?.getBoundingClientRect();
                      if (!rect) return;
                      dragStartY.current = e.clientY;
                      dragStartIdx.current = idx;
                      setDragState({
                        active: true,
                        dragIdx: idx,
                        overIdx: idx,
                        y: 0,
                      });

                      const itemHeight = ITEM_H;
                      const total = effectiveLevelOrder.length;
                      const onMove = (ev) => {
                        const dy = ev.clientY - dragStartY.current;
                        const shift = Math.round(dy / itemHeight);
                        const newOver = Math.max(
                          0,
                          Math.min(total - 1, dragStartIdx.current + shift),
                        );
                        setDragState((prev) => ({
                          ...prev,
                          y: dy,
                          overIdx: newOver,
                        }));
                      };
                      const onUp = () => {
                        document.removeEventListener("pointermove", onMove);
                        document.removeEventListener("pointerup", onUp);
                        setDragState((prev) => {
                          if (
                            prev.active &&
                            prev.dragIdx !== null &&
                            prev.overIdx !== null &&
                            prev.dragIdx !== prev.overIdx
                          ) {
                            moveLevel(prev.dragIdx, prev.overIdx);
                          }
                          return {
                            active: false,
                            dragIdx: null,
                            overIdx: null,
                            y: 0,
                          };
                        });
                        document.body.style.userSelect = "";
                        document.body.style.cursor = "";
                      };
                      document.addEventListener("pointermove", onMove);
                      document.addEventListener("pointerup", onUp);
                      document.body.style.userSelect = "none";
                      document.body.style.cursor = "grabbing";
                    }}
                    sx={{
                      py: 0,
                      px: 1,
                      height: ITEM_H,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      transform: `translateY(${visualY}px) scale(${isDragged ? 1.04 : 1})`,
                      transition: active
                        ? isDragged
                          ? "transform 0.04s linear, box-shadow 0.2s ease, opacity 0.2s ease"
                          : "transform 0.25s cubic-bezier(0.2, 0, 0, 1)"
                        : "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      opacity: isDragged ? 0.5 : 1,
                      boxShadow: isDragged
                        ? "0 8px 24px rgba(0,0,0,0.4)"
                        : "none",
                      background:
                        !isDragged && oIdx === idx
                          ? `${theme.primaryColor}18`
                          : isDragged
                            ? "rgba(99,102,241,0.08)"
                            : "transparent",
                      borderLeft:
                        !isDragged && oIdx === idx
                          ? `2px solid ${theme.primaryColor}`
                          : "2px solid transparent",
                      cursor: isDragged ? "grabbing" : "grab",
                      position: "relative",
                      zIndex: isDragged ? 100 : 1,
                      borderRadius: "8px",
                      mx: 0.5,
                      mb: 0.25,
                      willChange: "transform",
                    }}
                  >
                    <DragIndicatorIcon
                      sx={{
                        fontSize: 16,
                        color: isDragged ? theme.primaryColor : "#475569",
                        flexShrink: 0,
                        transition: "color 0.15s",
                      }}
                    />
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `linear-gradient(135deg, ${lvl.color}30, ${lvl.color}15)`,
                        border: `1px solid ${lvl.color}40`,
                        color: lvl.color,
                        flexShrink: 0,
                        "& svg": { fontSize: 14 },
                      }}
                    >
                      {lvl.icon}
                    </Box>
                    <ListItemText
                      primary={key}
                      primaryTypographyProps={{
                        sx: {
                          fontFamily: theme.fontFamily,
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "#e2e8f0",
                          lineHeight: 1.2,
                        },
                      }}
                    />
                    {oIdx === idx && !isDragged && (
                      <Box
                        sx={{
                          position: "absolute",
                          left: -2,
                          top: 0,
                          bottom: 0,
                          width: 2,
                          background: theme.primaryColor,
                          borderRadius: "0 2px 2px 0",
                          boxShadow: `0 0 8px ${theme.primaryColor}80`,
                        }}
                      />
                    )}
                  </Box>
                );
              })}
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Box
                  onClick={() => {
                    setLevelOrder(configLevels.map((l) => l.key));
                    setPath([]);
                    setPage(0);
                    setColumnVisibility({});
                    setSortField(null);
                    setSearchQuery("");
                    setSelected(new Set());
                  }}
                  sx={{
                    cursor: "pointer",
                    fontFamily: theme.fontFamily,
                    fontSize: "0.75rem",
                    color: theme.primaryColor,
                    textAlign: "center",
                    py: 0.5,
                    borderRadius: "6px",
                    transition: "background 0.2s",
                    "&:hover": { background: `${theme.primaryColor}15` },
                  }}
                >
                  Reset to Default
                </Box>
              </Box>
            </Menu>
            <Tooltip title="Toggle columns">
              <IconButton
                onClick={(e) => setColMenuAnchor(e.currentTarget)}
                size="small"
                sx={{ color: colMenuAnchor ? theme.primaryColor : "#94a3b8" }}
              >
                <ViewColumnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={colMenuAnchor}
              open={Boolean(colMenuAnchor)}
              onClose={() => setColMenuAnchor(null)}
              PaperProps={{
                sx: {
                  background: "rgba(22, 22, 42, 0.95)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  minWidth: 180,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                },
              }}
            >
              <Typography
                sx={{
                  px: 2,
                  pt: 1.5,
                  pb: 0.5,
                  fontFamily: theme.headingFontFamily,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#94a3b8",
                }}
              >
                Columns
              </Typography>
              {allColumnsForLevel.map((col) => {
                const isVisible = columnVisibility[col.field] !== false;
                return (
                  <MenuItem
                    key={col.field}
                    dense
                    onClick={() => {
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [col.field]: !isVisible,
                      }));
                    }}
                    sx={{ py: 0.5 }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isVisible}
                          size="small"
                          sx={{
                            color: "#94a3b8",
                            "&.Mui-checked": { color: theme.primaryColor },
                            p: 0.5,
                          }}
                        />
                      }
                      label={
                        <ListItemText
                          primary={col.label}
                          secondary={col.primary ? "Primary" : null}
                          primaryTypographyProps={{
                            sx: {
                              fontFamily: theme.fontFamily,
                              fontSize: "0.85rem",
                              color: "#e2e8f0",
                            },
                          }}
                          secondaryTypographyProps={{
                            sx: {
                              fontFamily: theme.fontFamily,
                              fontSize: "0.65rem",
                              color: "#64748b",
                            },
                          }}
                        />
                      }
                      sx={{ m: 0, width: "100%" }}
                    />
                  </MenuItem>
                );
              })}
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Box
                  onClick={() => {
                    const allVisible = allColumnsForLevel.every(
                      (c) =>
                        c.hidden !== true &&
                        columnVisibility[c.field] !== false,
                    );
                    const next = {};
                    if (allVisible) {
                      allColumnsForLevel.forEach((c) => {
                        if (c.hidden !== true) next[c.field] = false;
                      });
                    }
                    setColumnVisibility(next);
                  }}
                  sx={{
                    cursor: "pointer",
                    fontFamily: theme.fontFamily,
                    fontSize: "0.75rem",
                    color: theme.primaryColor,
                    textAlign: "center",
                    py: 0.5,
                    borderRadius: "6px",
                    transition: "background 0.2s",
                    "&:hover": { background: `${theme.primaryColor}15` },
                  }}
                >
                  {allColumnsForLevel.every(
                    (c) =>
                      c.hidden !== true && columnVisibility[c.field] !== false,
                  )
                    ? "Hide All"
                    : "Show All"}
                </Box>
              </Box>
            </Menu>
            {canExport && (
              <Tooltip title="Export CSV">
                <IconButton
                  onClick={() => exportCSV(currentData, activeColumns)}
                  size="small"
                  sx={{ color: "#94a3b8" }}
                >
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canPrint && (
              <Tooltip title="Print">
                <IconButton
                  onClick={() => window.print()}
                  size="small"
                  sx={{ color: "#94a3b8" }}
                >
                  <PrintIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Breadcrumbs
          separator={
            <ArrowForwardIcon
              sx={{ fontSize: 14, color: "rgba(255,255,255,0.2)" }}
            />
          }
          sx={{ mb: 3 }}
        >
          {levels.map((lvl, idx) => {
            const isDrilled = idx < path.length;
            const labelField = lvl?.labelField || "name";
            const label = isDrilled
              ? path[idx][labelField] || path[idx].name || lvl.key
              : lvl.key;
            const tooltipText = isDrilled
              ? `${lvl.key}: ${path[idx][labelField] || path[idx].name || lvl.key}`
              : lvl.key;
            const isActive = idx === path.length;
            return (
              <Tooltip
                key={idx}
                title={tooltipText}
                arrow
                placement="top"
                sx={{
                  "& .MuiTooltip-tooltip": {
                    fontSize: "0.78rem",
                    fontFamily: theme.fontFamily,
                  },
                }}
              >
                <Link
                  underline="hover"
                  onClick={
                    isDrilled ? () => handleBreadcrumbClick(idx) : undefined
                  }
                  sx={{
                    cursor: isDrilled ? "pointer" : "default",
                    color: isActive
                      ? theme.primaryColor
                      : isDrilled
                        ? "#94a3b8"
                        : "#64748b",
                    fontFamily: theme.fontFamily,
                    fontSize: "0.82rem",
                    fontWeight: isActive ? 600 : 400,
                    "&:hover": isDrilled ? { color: theme.primaryColor } : {},
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  {label}
                  {isDrilled && lvl?.badge && path[idx][lvl.badge.field] && (
                    <Chip
                      label={path[idx][lvl.badge.field]}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: "0.6rem",
                        background:
                          (lvl.badge.colorMap &&
                            lvl.badge.colorMap[path[idx][lvl.badge.field]]) ||
                          "rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Link>
              </Tooltip>
            );
          })}
        </Breadcrumbs>

        {showSearch && (
          <Box
            sx={{
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              p: 1.5,
              borderRadius: "12px",
              background: "rgba(18,18,38,0.5)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: 200,
                background: "rgba(255,255,255,0.04)",
                borderRadius: "8px",
                px: 1.5,
                py: 0.5,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <SearchIcon sx={{ color: "#94a3b8", fontSize: 18, mr: 1 }} />
              <InputBase
                placeholder={`Search ${LEVEL_KEYS[currentLevel]}...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                sx={{
                  flex: 1,
                  color: "#f8fafc",
                  fontFamily: theme.fontFamily,
                  fontSize: "0.85rem",
                }}
              />
            </Box>
            {selected.size > 0 && (
              <Typography
                sx={{ fontSize: "0.8rem", color: theme.primaryColor }}
              >
                {selected.size} selected
              </Typography>
            )}
          </Box>
        )}

        <TableContainer
          component={Paper}
          sx={{
            width: "600px",
            maxHeight: "400px",
            background: "rgba(18, 18, 38, 0.7)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: theme.borderRadius,
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
            overflowX: "auto",
            overflowY: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            transition: "all 0.3s ease",
            "&:hover": { borderColor: "rgba(255, 255, 255, 0.1)" },
          }}
        >
          <Table>
            <TableHead
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 3,
                background: "rgba(18,18,38,0.95)",
              }}
            >
              <TableRow>
                {isSelectable && (
                  <TableCell sx={{ ...cellHeadStyle(theme), width: 48, pl: 2 }}>
                    <Checkbox
                      size="small"
                      checked={
                        paginatedData.length > 0 &&
                        paginatedData.every((d) => selected.has(nodeKey(d)))
                      }
                      indeterminate={
                        selected.size > 0 &&
                        !paginatedData.every((d) => selected.has(nodeKey(d)))
                      }
                      onChange={handleSelectAll}
                      sx={{
                        color: "#94a3b8",
                        "&.Mui-checked": { color: theme.primaryColor },
                      }}
                    />
                  </TableCell>
                )}
                {activeColumns.map((col) => {
                  const isSticky = col.sticky;
                  return (
                    <TableCell
                      key={col.field}
                      onClick={() => col.sortable && handleSort(col.field)}
                      sx={{
                        ...cellHeadStyle(theme),
                        pl: col.primary ? 3 : 2,
                        width: isSticky ? "auto" : col.width || "auto",
                        minWidth: col.minWidth,
                        whiteSpace: "nowrap",
                        textAlign: col.align || "left",
                        cursor: col.sortable ? "pointer" : "default",
                        userSelect: col.sortable ? "none" : "auto",
                        position: isSticky ? "sticky" : "relative",
                        left: isSticky ? 0 : "auto",
                        zIndex: isSticky ? 2 : 1,
                        background: isSticky
                          ? "rgba(18,18,38,0.95)"
                          : "transparent",
                        "&:hover": col.sortable ? { color: "#e2e8f0" } : {},
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          justifyContent:
                            col.align === "right" ? "flex-end" : "flex-start",
                        }}
                      >
                        {col.label}
                        {col.tooltip && (
                          <Tooltip title={col.tooltip} arrow>
                            <InfoOutlinedIcon
                              sx={{ fontSize: 13, opacity: 0.5 }}
                            />
                          </Tooltip>
                        )}
                        {col.sortable && (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              ml: 0.3,
                            }}
                          >
                            {sortField === col.field ? (
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                                gap={0.25}
                              >
                                {sortDir === "asc" ? (
                                  <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                                ) : (
                                  <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                                )}
                                <Box
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSortField(null);
                                    setSortDir("asc");
                                  }}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.1)",
                                    cursor: "pointer",
                                    "&:hover": {
                                      background: "rgba(239,68,68,0.3)",
                                      color: "#ef4444",
                                    },
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      fontSize: 9,
                                      fontWeight: 700,
                                      lineHeight: 1,
                                      mt: "-1px",
                                    }}
                                  >
                                    x
                                  </Box>
                                </Box>
                              </Box>
                            ) : (
                              <UnfoldMoreIcon
                                sx={{ fontSize: 14, opacity: 0.3 }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
              {currentData.length > 0 && summaryRow && (
                <TableRow>
                  {isSelectable && (
                    <TableCell
                      sx={{
                        ...cellBodyStyle(theme),
                        py: 1.5,
                        borderBottom: "1px solid rgba(99,102,241,0.2)",
                        background: "rgba(99,102,241,0.03)",
                      }}
                    />
                  )}
                  {activeColumns.map((col) => {
                    const isSticky = col.sticky;
                    const val = summaryRow[col.field];
                    const isTotalLabel = val === "__TOTAL__";
                    let display;
                    if (isTotalLabel) {
                      display = "Total";
                    } else if (val != null) {
                      if (col.render === "currency") {
                        display = formatCurrency(
                          val,
                          tableConfig.currency,
                          col.unit,
                        );
                      } else if (col.render === "percentage") {
                        display = `${Math.round(val)}%`;
                      } else if (col.render === "progress") {
                        display = formatNumber(val);
                      } else {
                        display = formatNumber(val);
                      }
                    } else {
                      display = "—";
                    }
                    return (
                      <TableCell
                        key={col.field}
                        sx={{
                          ...cellBodyStyle(theme),
                          fontWeight: isTotalLabel ? 700 : 600,
                          color: isTotalLabel ? theme.primaryColor : "#f8fafc",
                          py: 1.5,
                          pl: col.primary ? 3 : 2,
                          textAlign: col.align || "left",
                          width: isSticky ? "auto" : col.width || "auto",
                          minWidth: col.minWidth,
                          whiteSpace: "nowrap",
                          position: isSticky ? "sticky" : "relative",
                          left: isSticky ? 0 : "auto",
                          zIndex: isSticky ? 2 : 1,
                          background: isSticky
                            ? "rgba(18,18,38,0.95)"
                            : "rgba(99,102,241,0.03)",
                          borderBottom: "1px solid rgba(99,102,241,0.2)",
                        }}
                      >
                        {display}
                      </TableCell>
                    );
                  })}
                  {(isLevelDrillable(levelInfo) ||
                    activeColumns.some((c) => c.expandable)) && (
                    <TableCell
                      sx={{
                        ...cellBodyStyle(theme),
                        py: 1.5,
                        borderBottom: "1px solid rgba(99,102,241,0.2)",
                        background: "rgba(99,102,241,0.03)",
                        textAlign: "right",
                        pr: 3,
                      }}
                    />
                  )}
                </TableRow>
              )}
            </TableHead>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={activeColumns.length + (isSelectable ? 1 : 0) + 1}
                    sx={{ textAlign: "center", py: 8 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "column",
                      }}
                      gap={1}
                    >
                      <InboxIcon sx={{ fontSize: 48, color: "#475569" }} />
                      <Typography
                        color="text.secondary"
                        sx={{ fontFamily: theme.fontFamily }}
                      >
                        {tableConfig.emptyMessage || "No records found."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, rowIdx) => {
                  const key = nodeKey(item);
                  const canDrill =
                    !isNodeDisabled(item) &&
                    isLevelDrillable(levelInfo) &&
                    hasChildren(item) &&
                    currentLevel < maxDepth - 1;
                  const isRowSelected = selected.has(key);

                  return (
                    <TableRow
                      key={key}
                      hover={tableConfig.hoverColor !== "none"}
                      onClick={() => handleRowClick(item)}
                      sx={{
                        cursor: canDrill ? "pointer" : "default",
                        transition: "all 0.2s ease",
                        transform: animate
                          ? "translateY(0)"
                          : "translateY(8px)",
                        animation: animate
                          ? "fadeInRow 0.3s ease forwards"
                          : "none",
                        animationDelay: `${rowIdx * 30}ms`,
                        background:
                          isStriped && rowIdx % 2 === 1
                            ? "rgba(255,255,255,0.015)"
                            : "transparent",
                        "&:hover": canDrill
                          ? {
                              background:
                                tableConfig.hoverColor ||
                                "rgba(99,102,241,0.06)",
                              "& .drill-icon": {
                                opacity: 1,
                                transform: "translateX(0)",
                              },
                            }
                          : {},
                        "&:last-child td": { borderBottom: "none" },
                        opacity: isNodeDisabled(item) ? 0.4 : animate ? 1 : 0,
                        "@keyframes fadeInRow": {
                          from: { opacity: 0, transform: "translateY(8px)" },
                          to: { opacity: 1, transform: "translateY(0)" },
                        },
                      }}
                    >
                      {isSelectable && (
                        <TableCell sx={{ pl: 2, borderBottom: "none" }}>
                          <Checkbox
                            size="small"
                            checked={isRowSelected}
                            onChange={() => handleSelectRow(key)}
                            sx={{
                              color: "#94a3b8",
                              "&.Mui-checked": { color: theme.primaryColor },
                            }}
                          />
                        </TableCell>
                      )}
                      {activeColumns.map((col) => {
                        const isSticky = col.sticky;
                        return (
                          <TableCell
                            key={col.field}
                            sx={{
                              ...cellBodyStyle(theme),
                              pl: col.primary ? 3 : 2,
                              fontWeight: col.primary ? 600 : 400,
                              color: col.primary ? "#f8fafc" : "#cbd5e1",
                              textAlign: col.align || "left",
                              width: isSticky ? "auto" : col.width || "auto",
                              minWidth: col.minWidth,
                              whiteSpace: "nowrap",
                              position: isSticky ? "sticky" : "relative",
                              left: isSticky ? 0 : "auto",
                              zIndex: isSticky ? 2 : 1,
                              background: isSticky
                                ? "rgba(18,18,38,0.95)"
                                : "transparent",
                            }}
                          >
                            {renderCellValue(
                              col,
                              item,
                              theme,
                              tableConfig.currency,
                            )}
                          </TableCell>
                        );
                      })}
                      {(isLevelDrillable(levelInfo) ||
                        activeColumns.some((c) => c.expandable)) && (
                        <TableCell
                          sx={{
                            ...cellBodyStyle(theme),
                            textAlign: "right",
                            pr: 3,
                          }}
                        >
                          {canDrill && (
                            <ArrowForwardIcon
                              className="drill-icon"
                              sx={{
                                fontSize: 18,
                                color: levelInfo.color,
                                opacity: 0,
                                transform: "translateX(-4px)",
                                transition: "all 0.2s ease",
                              }}
                            />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {pageSize > 0 && currentData.length > pageSize && (
          <TablePagination
            component="Box"
            count={currentData.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[pageSize]}
            sx={{
              mt: 1,
              background: "rgba(18,18,38,0.5)",
              borderRadius: "12px",
              "& .MuiTablePagination-toolbar": { minHeight: 44 },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  color: "#94a3b8",
                  fontFamily: theme.fontFamily,
                  fontSize: "0.8rem",
                },
            }}
          />
        )}

        {currentLevel === maxDepth - 1 && currentData.length > 0 && (
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Chip
              icon={<FactCheckIcon />}
              label={`End of hierarchy \u2014 ${LEVEL_KEYS[maxDepth - 1]} level reached`}
              sx={{
                background: "rgba(236, 72, 153, 0.08)",
                color: "#ec4899",
                fontWeight: 500,
                border: "1px solid rgba(236, 72, 153, 0.15)",
                fontFamily: theme.fontFamily,
                fontSize: "0.8rem",
              }}
            />
          </Box>
        )}
      </Box>
    </Fade>
  );
}

function cellHeadStyle(theme) {
  return {
    fontFamily: theme.headingFontFamily,
    fontWeight: 600,
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#94a3b8",
    borderBottom: "1px solid rgba(99,102,241,0.2)",
    py: 2,
  };
}

function cellBodyStyle(theme) {
  return {
    fontFamily: theme.fontFamily,
    fontSize: "0.9rem",
    color: "#f8fafc",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    py: 1.8,
  };
}
