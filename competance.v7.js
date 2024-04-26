const handleMouseOut = () => {
    tooltip.transition()
        .duration(200)
        .style("opacity", 0);

    svg.selectAll(".outerArc").remove();
};

arcPaths
    .on("mouseenter", handleMouseOver)
    .on("mouseleave", handleMouseOut)
    .on("click", function (event, d) {
        console.log(`Clicked category: ${d.data.category}`);
        const centerX = width / 2;
        const centerY = height / 2;
        const valueText = `Value: ${d.data.value}`;

        svg.selectAll(".labelCategory").remove();
        svg.selectAll(".valueText").remove();

        svg.append("text")
            .attr("class", "labelCategory")
            .attr("x", centerX)
            .attr("y", centerY - 20)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(d.data.category);

        svg.append("text")
            .attr("class", "valueText")
            .attr("x", centerX)
            .attr("y", centerY + 20)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(valueText);

        const competencyDescriptions = d.data.competencies.map(competency => competency.description).join("\n");
        tooltip.html(`<strong>${d.data.category}</strong><br>Total Value: ${d.data.value}<br><br>${competencyDescriptions}`)
            .transition()
            .duration(200)
            .style("opacity", 0.9);
    });

svg.append("text")
    .attr("x", width / 2 - 10)
    .attr("y", height / 2 - 10)
    .attr("text-anchor", "end")
    .text("Data source: competance.json")
    .style("font-size", "10px");

const legend = svg.selectAll(".legend")
    .data(Object.keys(categoryTotalValues))
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(-20,${i * 20 - height / 2 + 20})`);

legend.append("rect")
    .attr("x", width / 2 - 10)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", (d, i) => d3.schemeCategory10[i]);

legend.append("text")
    .attr("x", width / 2 - 20)
    .attr("y", 9)
    .attr('stroke', (_, i) => d3.schemeCategory10[i])
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(d => d);

function toggleFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener("fullscreenchange", () => {
    svg.attr("width", document.getElementById('chart-container').offsetWidth)
        .attr("height", document.getElementById('chart-container').offsetHeight);
});
svg.on("dblclick", toggleFullscreen);

window.addEventListener("resize", () => {
    svg.attr("width", document.getElementById('chart-container').offsetWidth)
        .attr("height", document.getElementById('chart-container').offsetHeight);
});
