import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const LineChart = () => {
  const svgRef = useRef();

  useEffect(() => {
    const data = [
      { day: 1, value: 20 },
      { day: 2, value: 40 },
      { day: 3, value: 35 },
      { day: 4, value: 70 },
      { day: 5, value: 60 },
    ];

    const width = 500;
    const height = 300;

    const svg = d3.select(svgRef.current);

    const tooltip = d3
      .select("body")
      .append("div")
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
      .scaleLinear()
      .domain([1, 5])
      .range([50, width - 20]);

    const y = d3
      .scaleLinear()
      .domain([0, 100])
      .range([height - 40, 20]);

    const line = d3
      .line()
      .x((d) => x(d.day))
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
      .data(data)
      .enter()
      .append("circle")
      .on("mouseover", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .html(`Day ${d.day}<br/>Value ${d.value}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY + "px")
          .style("left", event.pageX + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      })
      .attr("cx", (d) => x(d.day))
      .attr("cy", (d) => y(d.value))
      .attr("r", 6)
      .attr("fill", "#10b981");

    svg
      .selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("x", (d) => x(d.day))
      .attr("y", (d) => y(d.value) - 12)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text((d) => d.value);

    const path = svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      //   .attr("fill", "#6366f1")
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
  }, []);

  return <svg ref={svgRef}></svg>;
};

export default LineChart;
