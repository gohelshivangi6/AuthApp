import BarChart from "./charts/BarChart";
import LineChart from "./charts/LineChart";
import DonutChart from "./charts/DonutChart";
import ScatterPlot from "./charts/ScatterPlot";

const COMPONENT_MAP = {
  BarChart,
  LineChart,
  DonutChart,
  ScatterPlot,
};

export default function WidgetRenderer({ componentName, ...rest }) {
  const Component = COMPONENT_MAP[componentName];

  if (!Component) {
    return (
      <div style={{ padding: 16, textAlign: "center", color: "#94a3b8" }}>
        Unknown widget: {componentName}
      </div>
    );
  }

  return <Component {...rest} />;
}
