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

// Calculate total competency value for each category in the aggregated data
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

// Find the maximum total competency value
const maxCategoryValue = Math.max(...Object.values(categoryTotalValues));

// Function to calculate the outer radius for the category arcs based on the total competency value
function calculateInnerRadius(categoryValue, maxCategoryValue, innerRadius, outerRadius) {
    return innerRadius + (categoryValue / maxCategoryValue) * (outerRadius - innerRadius);
}
// Set dimensions and radius
const width = 600;
const height = 400;
const radius = Math.min(width, height) / 2;
const innerRadius = radius * 0.5; // Adjust the inner radius
const outerRadius = radius * 0.8; // Adjust the outer radius

// Create SVG container
const svg = d3.select("#chart-container")
    .style("display", "block")
    .style("margin", "auto")
    .style("text-align", "center")
    .style("background", "#f4f4f4")
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

// Tooltip for the outer ring
const tooltip = d3.select("#chart-container")
    .append("div")
    .style("position", "absolute")
    .style("padding", "0.5em")
    .style("background", "white")
    .style("border", "1px solid #333")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0);

// Pie layout for the inner ring (categories)
const pieCategory = d3.pie()
    .value(d => d.value)
    .sort(null);

// Generate arcs for the inner ring (categories) with adjusted radius
const arcsCategory = pieCategory(Object.values(aggregatedData)).map(d => ({
    ...d,
    innerRadius,
    outerRadius
}));

// Arc generator for the inner ring with adjusted radius
const arcCategory = d3.arc()
    .innerRadius(d => d.innerRadius)
    .outerRadius(d => d.outerRadius)
    .padAngle(0.02); // Add padding between arcs

// Add arcs for the inner ring (categories) with adjusted radius
const arcCategories = svg.selectAll(".arcCategory")
    .data(arcsCategory)
    .enter()
    .append("path")
    .attr("class", "arcCategory")
    .attr("d", arcCategory)
    .attr("fill", (d, i) => d3.schemeCategory10[i]);

// Add event listeners for inner arcs
arcCategories   
    .on("mouseover", function (event, d) {
        tooltip.html(`<strong>${d.data.category}</strong><br>Total Value: ${d.data.value}`)
            .transition()
            .duration(200)
            .style("opacity", 0.9);
    })
    .on("mouseout", function (event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    });


// Update tooltip position to follow mouse cursor on outer arc mousemove
svg.selectAll(".arcCompetency")
    .on("mousemove", function () {
        tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    });

    
// Add text labels for the inner ring (categories) with adjusted position
svg.selectAll(".labelCategory")
    .data(arcsCategory)
    .enter()
    .append("text")
    .attr("class", "labelCategory")
    .attr("transform", d => {
        const centroid = arcCategory.centroid(d);
        return `translate(${centroid[0]}, ${centroid[1]})`; // Use centroid for positioning
    })
    .attr("text-anchor", "middle")
    .text(d => d.data.category)
    .style("fill", "white")
    .style("font-size", "12px")
    .style("pointer-events", "none"); // Ensure labels don't block mouse events
    
// Pie layout for the outer ring (competencies)
const pieCompetency = d3.pie()
    .value(d => d.value)
    .sort(null);

// Generate arcs for the outer ring
const arcsCompetency = pieCompetency(data.flatMap(d => d.competencies));

// Add arcs for the outer ring (competencies) with adjusted radius
svg.selectAll(".arcCompetency")
    .data(arcsCompetency)
    .enter()
    .append("path")
    .attr("class", "arcCompetency")
    .attr("d", d => arcCategory({
        innerRadius: radius * .9, // Set inner radius
        outerRadius: radius, // Set outer radius
        startAngle: d.startAngle,
        endAngle: d.endAngle
    }))
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("cursor", "pointer")
    .attr("data-competency", d => d.data.name)
    .attr("data-description", d => d.data.description)
    .attr("data-value", d => d.data.value)
    .attr("data-category", d => d.data.category)
    .attr("data-color", (d, i) => d3.schemeCategory10[i % 10])
    .attr("fill", (d, i) => d3.schemeCategory10[i % 10]); // Use


    // Add event listeners for outer arcs
svg.selectAll(".arcCompetency")
    .on("mouseover", function (event, d) {
        tooltip.html(`<strong>${d.data.name}</strong><br>${d.data.description}`)
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
        console.log(`Clicked competency: ${d.data.name}`);
        // Here you can implement your logic to display details for the clicked competency
    });


// Add text labels for the outer ring (competencies) with adjusted position
svg.selectAll(".labelCompetency")
    .data(arcsCompetency)
    .enter()
    .append("text")
    .attr("class", "labelCompetency")
    .attr("transform", d => {
        const centroid = arcCategory.centroid({
            innerRadius: radius * 0.9,
            outerRadius: radius,
            startAngle: d.startAngle,
            endAngle: d.endAngle
        });
        return `translate(${centroid[0]}, ${centroid[1]})`; // Use centroid for positioning
    })
    .attr("text-anchor", "middle")
    .text(d => d.data.name)
    .style("fill", "white")
    .style("font-size", "12px")
    .style("pointer-events", "none"); // Ensure labels don't block mouse events

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
