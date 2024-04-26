'use strict';

// Define the PipePromise class
class PipePromise {
    constructor() {
        this.accumulator = null;
    }

    async pipe(generatorFunc) {
        // If accumulator is null, initialize it with the result of the generator function
        if (this.accumulator === null) {
            this.accumulator = await generatorFunc();
        } else {
            // Accumulate data from right to left by applying the generator function to the current accumulator
            this.accumulator = await generatorFunc(this.accumulator);
        }

        // Simulate some asynchronous operation
        await new Promise(resolve => setTimeout(resolve, 100));

        // Return the accumulated data
        return this.accumulator;
    }
}

// Fetch JSON data asynchronously
async function json(url) {
    return fetch(url).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            return response.json();
        }
    });
}

// Generator function to transform data
async function* transformData(accumulator) {
    const { data, categoryTotalValues, aggregatedData } = accumulator;
    yield { data, categoryTotalValues, aggregatedData };
}

// Render function
function render(data) {
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
    
    const arcsCategory = pieCategory(Object.values(aggregatedData)).map(d => ({
        ...d,
        innerRadius,
        outerRadius
    }));
    
    const arcGroup = svg.append("g")
        .attr("class", "arcGroup");
    
    const arcCategory = d3.arc()
        .innerRadius(d => d.innerRadius)
        .outerRadius(d => d.outerRadius)
        .startAngle(d => d.startAngle)
        .endAngle(d => d.endAngle);
    
    const arcPaths = arcGroup.selectAll(".arc")
        .data(arcsCategory)
        .enter()
        .append("path")
        .attr("class", "arc")
        .attr("d", arcCategory)
        .attr("fill", (d, i) => d3.schemeCategory10[i]);
    
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
    
    
    const arcLabel = d3.arc()
        .innerRadius(outerRadius)
        .outerRadius(outerRadius + 20);
    
    arcPaths
    .attr("cursor", "pointer")
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
        })
        .on("click", function (event, d) {
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
        });
    
    const outerArcs = svg.selectAll(".outerArc")    
        .data(pieCategory(Object.values(categoryTotalValues)))
        .enter()
        .append("path")
        .attr("class", "outerArc")
        .attr("d", arcLabel)
        .attr("fill", "none");  
    
    outerArcs
        
    
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
    

}


// Consume data using PipePromise
async function *consumer() {
    const pipePromise = new PipePromise();
    const data = await json("competance.json");
    const result = await pipePromise.pipe(transformData(data));
    pipePromise.pipe(() => render(result));
    
}

// Load the data

consumer();