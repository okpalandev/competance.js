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
const innerRadius = radius * 0.45;
const outerRadius = radius * 0.8;

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

svg.append("text")
    .attr("x", 0)
    .attr("y", -height / 2 + 20)
    .attr("text-anchor", "middle")
    .text("Competencies by Category")
    .style("font-size", "20px")
    .style("font-weight", "bold");

svg.append("text")
    .attr("x", 0)
    .attr("y", -height / 2 + 40)
    .attr("text-anchor", "middle")
    .text("Click on a category to view competencies")
    .style("font-size", "12px");



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

const labels = Object.keys(categoryTotalValues);
const color = d3.scaleOrdinal(d3.schemeCategory10);

// use labels 
const arcLabel = d3.arc()
    .innerRadius(outerRadius)
    .outerRadius(outerRadius + 20); 

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





// Create the arcs for the categories
const arcs = pieCategory(Object.values(categoryTotalValues)).map(d => ({
    ...d,
    innerRadius,
    outerRadius
}));


const arcsCategory = pieCategory(Object.values(aggregatedData)).map(d => ({
    ...d,
    innerRadius,
    outerRadius
}));

// Create a group element for the arcs
const arcGroup = svg.append("g")
    .attr("class", "arcGroup");

// Create the arc paths
const arc = d3.arc()
    .innerRadius(d => d.innerRadius)
    .outerRadius(d => d.outerRadius)
    .startAngle(d => d.startAngle)
    .endAngle(d => d.endAngle);


const arcPaths = arcGroup.selectAll(".arc")
    .data(arcsCategory)
    .enter()
    .append("path")
    .attr("class", "arc")
    .attr("d", arc)
    .attr("fill", (d, i) => d3.schemeCategory10[i]);


const arcCategory = d3.arc()
    .innerRadius(d => d.innerRadius)
    .outerRadius(d => d.outerRadius)
    .startAngle(d => d.startAngle)
    .endAngle(d => d.endAngle);
    const arcCategories = svg.selectAll(".arcCategory")
    .data(arcsCategory)
    .enter()
    .append("path")
    .attr("class", "arcCategory")
    .attr("d", arcCategory)
    .attr("fill", (d, i) => d3.schemeCategory10[i])
    .transition() // Apply transition here
    .duration(800) // Duration of the transition
    .attrTween("d", function (d) {
        const i = d3.interpolate(d.startAngle, d.endAngle);
        return function (t) {
            d.endAngle = i(t);
            return arcCategory(d);
        };
    });


// Add a circle in the center of the pie chart
const centerCircle = svg
    .append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", innerRadius)
    .attr("fill", "#fff") // Initial fill color
    .style("pointer-events", "none")
    .transition() // Apply transition here
    .duration(800) // Duration of the transition
    .attr("r", innerRadius * .9) // Final radius
    .attr("fill", "#fff"); // Final fill color


arcCategories
.selectAll(".arcCategory")
    .text(d => `${d.data.category}: ${d.data.value}`)
    .attr("data-category", d => d.data.category)
    .attr("data-value", d => d.data.value)
    .attr("data-competencies", d => d.data.competencies)
    .attr("data-color", (d, i) => d3.schemeCategory10[i % 10])
    .attr("cursor", "pointer")
    .attr("cursor", "pointer")
    .attr("data-category", d => d.data.category)
    .attr("data-value", d => d.data.value)
    .attr("data-competencies", d => d.data.competencies)
    .on("mouseenter", function (event, d) {
        tooltip.html(`<strong>${d.data.category}</strong><br>Total Value: ${d.data.value}`)
            .transition()
            .duration(200)
            .style("opacity", 0.9);
    })
    .on("mouseleave", function (event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    }).on("click", function (event, d) {
        console.log(`Clicked category: ${d.data.category}`);
        const centerX = width / 2;
        const centerY = height / 2;
        const valueText = `Value: ${d.data.value}`; // Get the value text
        
        // Remove any existing labels
        svg.selectAll(".labelCategory").remove();
        svg.selectAll(".valueText").remove(); // Remove existing value text
        
        // Add text label for the clicked category at the center of the SVG
        svg.append("text")
            .attr("class", "labelCategory")
            .attr("x", centerX)
            .attr("y", centerY - 20) // Adjust position to make space for value text
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(d.data.category);
        
        // Add text for the value
        svg.append("text")
            .attr("class", "valueText")
            .attr("x", centerX)
            .attr("y", centerY + 20) // Adjust position to make space for value text
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(valueText);
        
        // Show the description of competencies
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
