import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const DonutChart = () => {
  const svgRef = useRef();

  useEffect(() => {
    const data = [25, 35, 20, 40];

    const width = 500;
    const height = 300;
    const radius = 120;

    const svg = d3.select(svgRef.current);

    const tooltip = d3
      .select("body")
      .append("div")
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

    const pie = d3.pie();

    const arc = d3.arc().innerRadius(60).outerRadius(radius);
    const outerArc = d3.arc().innerRadius(130).outerRadius(130);

    group
      .selectAll("path")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("fill", "#6366f1")
      .attr("d", arc)
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible").text(`Value: ${d.value}`);
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
      .data(pie(data))
      .join("polyline")
      .attr("points", function (d) {
        const posA = arc.centroid(d); // Line starts inside the slice
        const posB = outerArc.centroid(d); // Line bends at the outer boundary
        const posC = outerArc.centroid(d); // Line ends left or right
        const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        posC[0] = 140 * (midangle < Math.PI ? 1 : -1); // Push line edge left or right
        return [posA, posB, posC];
      })
      .style("stroke", "white")
      .style("fill", "none")
      .style("stroke-width", "1.5px");

    group
      .selectAll("text")
      .data(pie(data)) // Use the exact same data mapping
      .enter()
      .append("text")
      // Use arc.centroid to calculate the center coordinates of each slice
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .style("fill", "#fff")
      .style("font-size", "12px")
      .text((d) => d.value);
  }, []);

  return <svg ref={svgRef}></svg>;
};

export default DonutChart;
