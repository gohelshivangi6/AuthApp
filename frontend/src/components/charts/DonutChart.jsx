import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const DonutChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    const defaultData = [
      { label: "A", value: 25 },
      { label: "B", value: 35 },
      { label: "C", value: 20 },
      { label: "D", value: 40 },
    ];

    const chartData = data || defaultData;
    const values = chartData.map((d) => d.value);

    const width = 500;
    const height = 300;
    const radius = 120;

    const svg = d3.select(svgRef.current);

    d3.select("body").selectAll(".donut-chart-tooltip").remove();
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "donut-chart-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "#1e293b")
      .style("color", "#fff")
      .style("padding", "6px 10px")
      .style("border-radius", "4px")
      .style("font-family", "sans-serif");

    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");

    const group = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie().value((d) => d.value);

    const arc = d3.arc().innerRadius(60).outerRadius(radius);
    const outerArc = d3.arc().innerRadius(130).outerRadius(130);

    const colorScale = d3
      .scaleOrdinal(d3.schemeSet2)
      .domain(chartData.map((d) => d.label));

    group
      .selectAll("path")
      .data(pie(chartData))
      .enter()
      .append("path")
      .attr("fill", (d) => colorScale(d.data.label))
      .attr("d", arc)
      .on("mouseover", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .html(`${d.data.label}: ${d.data.value}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    group
      .selectAll("polyline")
      .data(pie(chartData))
      .join("polyline")
      .attr("points", function (d) {
        const posA = arc.centroid(d);
        const posB = outerArc.centroid(d);
        const posC = outerArc.centroid(d);
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        posC[0] = 140 * (midangle < Math.PI ? 1 : -1);
        return [posA, posB, posC];
      })
      .style("stroke", "white")
      .style("fill", "none")
      .style("stroke-width", "1.5px");

    group
      .selectAll("text")
      .data(pie(chartData))
      .enter()
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .style("fill", "#fff")
      .style("font-size", "12px")
      .text((d) => d.data.value);

    return () => {
      tooltip.remove();
    };
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default DonutChart;

