import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const LineChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    const defaultData = [
      { label: "1", value: 20 },
      { label: "2", value: 40 },
      { label: "3", value: 35 },
      { label: "4", value: 70 },
      { label: "5", value: 60 },
    ];

    const chartData = data || defaultData;
    const labels = chartData.map((d) => d.label);
    const values = chartData.map((d) => d.value);

    const width = 500;
    const height = 300;

    const svg = d3.select(svgRef.current);

    d3.select("body").selectAll(".line-chart-tooltip").remove();
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "line-chart-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "#111827")
      .style("padding", "8px")
      .style("border-radius", "6px")
      .style("color", "white");

    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");

    const x = d3
      .scalePoint()
      .domain(labels)
      .range([50, width - 20]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(values) * 1.1])
      .range([height - 40, 20]);

    const line = d3
      .line()
      .x((d) => x(d.label))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - 40})`)
      .call(d3.axisBottom(x));

    svg.append("g").attr("transform", "translate(50,0)").call(d3.axisLeft(y));

    svg.selectAll(".domain").attr("stroke", "#94a3b8");

    svg.selectAll(".tick line").attr("stroke", "#475569");

    svg
      .selectAll(".tick text")
      .attr("fill", "#e2e8f0")
      .style("font-size", "12px");

    svg
      .selectAll(".point")
      .data(chartData)
      .enter()
      .append("circle")
      .on("mouseover", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .html(`${d.label}<br/>Value: ${d.value}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY + "px")
          .style("left", event.pageX + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      })
      .attr("cx", (d) => x(d.label))
      .attr("cy", (d) => y(d.value))
      .attr("r", 6)
      .attr("fill", "#10b981");

    svg
      .selectAll(".label")
      .data(chartData)
      .enter()
      .append("text")
      .attr("x", (d) => x(d.label))
      .attr("y", (d) => y(d.value) - 12)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text((d) => d.value);

    const path = svg
      .append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3)
      .attr("d", line);

    const length = path.node().getTotalLength();

    path
      .attr("stroke-dasharray", length)
      .attr("stroke-dashoffset", length)
      .transition()
      .duration(2000)
      .attr("stroke-dashoffset", 0);

    return () => {
      tooltip.remove();
    };
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default LineChart;

