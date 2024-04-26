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

// Aggregate competencies by category
const aggregatedData = {};
data.forEach(category => {
    let categoryValue = 0;
    category.competencies.forEach(competency => {
        categoryValue += competency.value;
    });
    aggregatedData[category.category] = {
        category: category.category,
        value: categoryValue
    };
});

// Transform aggregated data into an array
const transformedData = Object.values(aggregatedData);

console.log(transformedData);

// Set up chart
// Set dimensions
const width = 600;
const height = 400;
const radius = Math.min(width, height) / 2;

// Create SVG container
const svg = d3.select("#chart-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`)
    .style("font", "10px sans-serif");

// Add title
svg.append("text")
    .attr("x", 0)
    .attr("y", -height / 2 + 20)
    .attr("text-anchor", "middle")
    .text("Competencies by Category")
    .style("font-size", "20px")
    .style("font-weight", "bold");

// Pie layout
const pie = d3.pie()
    .value(d => d.value)
    .sort(null);

// Arc generator
const arc = d3.arc()
    .innerRadius(.5 * Math.min(width, height) / 2)
    .outerRadius(Math.min(width, height) / 2 - 10)
    .padAngle(0.03)
    .cornerRadius(8);

// Tooltip
const tooltip = d3
.select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "0.5em")
    .style("background", "white")
    .style("border", "1px solid #333")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0);

// Generate arcs
const arcs = pie(transformedData);

// Add arcs
svg.selectAll(".arc")
    .data(arcs)
    .enter()
    .append("path")
    .attr("class", "arc")
    .attr("d", arc)
    .attr("fill", (d, i) => d3.schemeCategory10[i])
    .on("mouseover", function (event, d) {
        tooltip.html(`<strong>${d.data.category}</strong><br>${d.data.value} competencies`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px")
            .transition()
            .duration(200)
            .style("opacity", 0.9);
    })
    .on("mouseout", function (event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    })
    .on("click", function (event, d) {
        console.log(`Clicked category: ${d.data.category}`);
        // Here you can implement your logic to display competencies for the clicked category
    });

// Add text labels
svg.selectAll(".label")
    .data(arcs)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .text(d => d.data.category)
    .style("fill", "white")
    .style("font-size", "12px");

// Add credits
svg.append("text")
    .attr("x", width / 2 - 10)
    .attr("y", height / 2 - 10)
    .attr("text-anchor", "end")
    .text("Data source: competance.json")
    .style("font-size", "10px");

// Function to toggle fullscreen mode
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

// Listen for fullscreen change event
document.addEventListener("fullscreenchange", () => {
    // Adjust SVG dimensions on fullscreen change
    svg.attr("width", document.getElementById('chart-container').offsetWidth)
        .attr("height", document.getElementById('chart-container').offsetHeight);
});

// Toggle fullscreen mode on double-click
svg.on("dblclick", toggleFullscreen);
