import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const ScatterPlot = () => {
  const svgRef = useRef();

  useEffect(() => {
    const data = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));

    const width = 500;
    const height = 300;

    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("padding", "8px")
      .style("background", "#222");

    const x = d3
      .scaleLinear()
      .domain([0, 100])
      .range([50, width - 20]);

    const y = d3
      .scaleLinear()
      .domain([0, 100])
      .range([height - 40, 20]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - 40})`)
      .call(d3.axisBottom(x));

    svg.append("g").attr("transform", "translate(50,0)").call(d3.axisLeft(y));

    svg
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      //   .attr("fill", "#6366f1")
      .attr("fill", "#06b6d4")
      .attr("stroke", "#67e8f9")
      .attr("stroke-width", 2)
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", 6)
      .on("mouseover", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .html(`x:${d.x.toFixed(1)}<br/>y:${d.y.toFixed(1)}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY + "px")
          .style("left", event.pageX + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });
  }, []);

  return <svg ref={svgRef}></svg>;
};

export default ScatterPlot;
