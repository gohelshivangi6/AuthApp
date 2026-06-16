import { Box, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import RemoveIcon from "@mui/icons-material/Remove";
import BarChart from "./charts/BarChart";
import LineChart from "./charts/LineChart";
import DonutChart from "./charts/DonutChart";
import ScatterPlot from "./charts/ScatterPlot";

const CHART_COMPONENTS = {
  bar: BarChart,
  line: LineChart,
  donut: DonutChart,
  scatter: ScatterPlot,
};

function TrendChip({ change, changeType }) {
  const icon =
    changeType === "up" ? <TrendingUpIcon fontSize="small" /> :
    changeType === "down" ? <TrendingDownIcon fontSize="small" /> :
    <RemoveIcon fontSize="small" />;

  const color =
    changeType === "up" ? "success" :
    changeType === "down" ? "error" :
    "default";

  return (
    <Chip
      icon={icon}
      label={change}
      size="small"
      color={color}
      variant="outlined"
      sx={{ fontFamily: "Inter", fontWeight: 600, fontSize: "0.75rem" }}
    />
  );
}

export default function DashboardContent({ data }) {
  if (!data) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography color="textSecondary">No dashboard data available.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 }, maxWidth: 1400, margin: "0 auto" }}>
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: "rgba(18,18,38,0.6)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          textAlign: "center",
        }}
      >
        <Typography variant="h3" sx={{ fontFamily: "Outfit", fontWeight: 800, mb: 1 }}>
          {data.title}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {data.description}
        </Typography>
      </Paper>

      {data.kpiCards && data.kpiCards.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {data.kpiCards.map((kpi) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={kpi.id}>
              <Paper
                sx={{
                  p: 3,
                  background: "rgba(18,18,38,0.6)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: data.color,
                    boxShadow: `0 4px 20px ${data.color}25`,
                  },
                }}
              >
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontFamily: "Inter", fontWeight: 500 }}>
                    {kpi.title}
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontFamily: "Outfit", fontWeight: 800, mb: 1, lineHeight: 1.2 }}>
                  {kpi.value}
                </Typography>
                <TrendChip change={kpi.change} changeType={kpi.changeType} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {data.charts && data.charts.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {data.charts.map((chart) => {
            const ChartComponent = CHART_COMPONENTS[chart.type];
            if (!ChartComponent) return null;

            return (
              <Grid size={{ xs: 12, md: 6 }} key={chart.id}>
                <Paper
                  sx={{
                    p: 3,
                    background: "rgba(18,18,38,0.6)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    height: "100%",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontFamily: "Outfit", fontWeight: 700, mb: 2, color: data.color }}
                  >
                    {chart.title}
                  </Typography>
                  <ChartComponent data={chart.data} />
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {data.tables && data.tables.length > 0 && (
        <Grid container spacing={3}>
          {data.tables.map((table) => (
            <Grid size={{ xs: 12, md: table.headers.length > 4 ? 12 : 6 }} key={table.id}>
              <Paper
                sx={{
                  p: 3,
                  background: "rgba(18,18,38,0.6)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  height: "100%",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontFamily: "Outfit", fontWeight: 700, mb: 2, color: data.color }}
                >
                  {table.title}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {table.headers.map((header, i) => (
                          <TableCell
                            key={i}
                            sx={{
                              fontFamily: "Outfit",
                              fontWeight: 700,
                              color: "text.secondary",
                              borderBottom: `1px solid ${data.color}40`,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {table.rows.map((row, ri) => (
                        <TableRow
                          key={ri}
                          sx={{
                            "&:hover": { background: "rgba(255,255,255,0.03)" },
                            "&:last-child td": { border: 0 },
                          }}
                        >
                          {row.map((cell, ci) => (
                            <TableCell
                              key={ci}
                              sx={{
                                fontFamily: "Inter",
                                color: ci === 0 ? "white" : "text.secondary",
                                fontWeight: ci === 0 ? 600 : 400,
                                borderBottom: "1px solid rgba(255,255,255,0.05)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {cell}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
