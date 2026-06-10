import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const BarChart = () => {
  const svgRef = useRef();

  useEffect(() => {
    const data = [30, 80, 45, 60, 20, 90, 55];

    const width = 500;
    const height = 300;

    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");

    const xScale = d3
      .scaleBand()
      .domain(data.map((_, i) => i))
      .range([50, width - 20])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data)])
      .range([height - 40, 20]);

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden");

    svg
      .append("g")
      .attr("transform", `translate(0,${height - 40})`)
      .call(d3.axisBottom(xScale));

    svg
      .append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(yScale));

    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("fill", "#6366f1")
      .on("mouseover", function () {
        d3.select(this).transition().duration(200).attr("fill", "#8b5cf9");
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("fill", "#6366f1");
      })
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible").html(`Value: ${d}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      })
      .attr("x", (_, i) => xScale(i))
      .attr("y", height - 40)
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .transition()
      .duration(1000)
      .attr("y", (d) => yScale(d))
      .attr("height", (d) => height - 40 - yScale(d));

    svg
      .selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("x", (_, i) => xScale(i) + xScale.bandwidth() / 2)
      .attr("y", (d) => yScale(d) - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text((d) => d);
  }, []);

  return <svg ref={svgRef}></svg>;
};

export default BarChart;
