async function json(url) {
    return fetch(url).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            return response.json();
        }
    });
}

const data = await json('./competance.json');
const categoryTotalValues = {};
const aggregatedData = {};

data.forEach(category => {
    let categoryValue = 0;
    category.competencies.forEach(competency => {
        categoryValue += competency.value;
    });

    aggregatedData[category.category] = {
        category: category.category,
        value: categoryValue,
        competencies: category.competencies
    };

    categoryTotalValues[category.category] = categoryValue;
});

const maxCategoryValue = Math.max(...Object.values(categoryTotalValues));

const width = 600;
const height = 400;
const radius = Math.min(width, height) / 2;
const innerRadius = radius * (1 / 3);
const outerRadius = radius * 0.8;
const newOuterRadius = radius * 0.75;

const colorScale = d3.scaleOrdinal()
    .domain(Object.keys(aggregatedData))
    .range(d3.schemeCategory10);

const pie = d3.pie()
    .value(d => d.value)
    .sort(null);

const arcCategory = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

const arcLabel = d3.arc()
    .innerRadius(outerRadius)
    .outerRadius(outerRadius + 20);

const svg = d3.select("#chart-container")
    .style("display", "block")
    .style("margin", "auto")
    .style("text-align", "center")
    .style("background", "#f4f4f4")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "chart")
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`)
    .style("font", "10px sans-serif");

// Draw arcs
const arcPaths = svg.selectAll(".arc")
    .data(pie(Object.values(aggregatedData)))
    .enter()
    .append("path")
    .attr("class", "arc")
    .attr("d", arcCategory)
    .attr("fill", (d, i) => colorScale(d.data.category))
    .on("mouseover", function(event, d) {
        d3.select(this)
            .transition()
            .duration(200)
            .attr("d", d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius + 10)
                .padAngle(0.1)
            );
    })
    .on("mouseout", function(event, d) {
        d3.select(this)
            .transition()
            .duration(200)
            .attr("d", arcCategory);
    })
    .on("click", function(event, d) {
        svg.selectAll(".outerArc")
            .filter(outerD => outerD.data.category === d.data.category)
            .classed("active", true);
    });

// Add outer arcs
const outerArcs = svg.selectAll(".outerArc")
    .data(pie(Object.values(categoryTotalValues)))
    .enter()
    .append("path")
    .attr("class", "outerArc")
    .attr("d", arcLabel)
    .style("opacity", 0);

// Transition for outer arcs
outerArcs.transition()
    .duration(1000)
    .style("opacity", 1);

const tooltip = d3.select("#chart-container")
    .append("div")
    .style("position", "absolute")
    .style("padding", "0.5em")
    .style("background", "white")
    .style("border", "1px solid #333")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0);

const pieCategory = d3.pie()
    .value(d => d.value)
    .sort(null);

const arcsCategory = pieCategory(Object.values(aggregatedData)).map(d => ({
    ...d,
    innerRadius,
    outerRadius
}));

const arcGroup = svg.append("g")
    .attr("class", "arcGroup");


const centerText = svg.append("text")
    .attr("x", 0)
    .attr("y", 0)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Total Value");

const centerValue = svg.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text(Object.values(categoryTotalValues).reduce((a, b) => a + b, 0));

const arcLabels = svg.selectAll(".arcLabel")
    .data(pieCategory(Object.values(categoryTotalValues)))
    .enter()
    .append("text")
    .attr("class", "arcLabel")
    .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text(d => d.data.category);

const centerCircle = svg
    .append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", innerRadius)
    .attr("fill", "#fff")
    .style("pointer-events", "none")
    .transition()
    .duration(800)
    .attr("r", innerRadius * .9)
    .attr("fill", "#fff");

arcPaths
.attr("cursor", "pointer")
.on("mouseenter", function (event, d) {
    tooltip.html(`<strong>${d.data.category}</strong><br>Total Value: ${d.data.value}`)
    .transition()
    .duration(200)
    .style("opacity", 0.9);
    const centerX = +svg.attr("width") / 2;
    const centerY = +svg.attr("height") / 2;
    const valueText = `Value: ${d.data.value}`;

    svg.selectAll(".labelCategory").remove();
    svg.selectAll(".valueText").remove();

    svg.append("text")
        .attr("class", "labelCategory")
        .attr("x", centerX)
        .attr("y", centerY - 10)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d.data.category);

    svg.append("text")
        .attr("class", "valueText")
        .attr("x", centerX)
        .attr("y",  centerY + 10) 
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(valueText);

    const competencyDescriptions = d.data.competencies.map(competency => competency.description).join("\n");
    tooltip.html(`<strong>${d.data.category}</strong><br>Total Value: ${d.data.value}<br><br>${competencyDescriptions}`)
        .transition()
        .duration(200)
        .style("opacity", 0.9);
})
    .on("mouseleave", function (event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    })
    

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
