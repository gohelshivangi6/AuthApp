import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const BarChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    const defaultData = [
      { label: "A", value: 30 },
      { label: "B", value: 80 },
      { label: "C", value: 45 },
      { label: "D", value: 60 },
      { label: "E", value: 20 },
      { label: "F", value: 90 },
      { label: "G", value: 55 },
    ];

    const chartData = data || defaultData;

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
      .domain(chartData.map((d) => d.label))
      .range([50, width - 20])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.value)])
      .range([height - 40, 20]);

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "#1e293b")
      .style("color", "#fff")
      .style("padding", "6px 10px")
      .style("border-radius", "4px")
      .style("font-size", "12px");

    svg
      .append("g")
      .attr("transform", `translate(0,${height - 40})`)
      .call(d3.axisBottom(xScale));

    svg
      .append("g")
      .attr("transform", "translate(50,0)")
      .call(d3.axisLeft(yScale));

    const colorScale = d3
      .scaleSequential(d3.interpolateViridis)
      .domain([0, d3.max(chartData, (d) => d.value)]);

    svg
      .selectAll("rect")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("fill", (d) => colorScale(d.value))
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("opacity", 0.8);
        tooltip.style("visibility", "visible").html(`${d.label}: ${d.value}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + "px");
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("opacity", 1);
        tooltip.style("visibility", "hidden");
      })
      .attr("x", (d) => xScale(d.label))
      .attr("y", height - 40)
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .transition()
      .duration(1000)
      .attr("y", (d) => yScale(d.value))
      .attr("height", (d) => height - 40 - yScale(d.value));

    svg
      .selectAll(".label")
      .data(chartData)
      .enter()
      .append("text")
      .attr("x", (d) => xScale(d.label) + xScale.bandwidth() / 2)
      .attr("y", (d) => yScale(d.value) - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .text((d) => d.value);

    return () => {
      tooltip.remove();
    };
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default BarChart;
