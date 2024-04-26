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

        // Return a Promise that resolves with the current accumulator value
        return this.accumulator;
    }
}


// Fetch JSON data asynchronously
async function json(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            } else {
                return response.json();
            }
        })
        .catch(error => {
            console.error('Error fetching JSON:', error);
            throw error;
        });
}


// Generator function to transform data
async function* transformData(accumulator) {
    const { data, categoryTotalValues, aggregatedData } = accumulator;
    yield { data, categoryTotalValues, aggregatedData };
}

// Render function
function render(data) {
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
    
    const width = 600;
    const height = 400;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.45;
    const outerRadius = radius * 0.8;
    const newOuterRadius = radius * 0.75; // New outer radius
    
    const colorScale = d3.scaleOrdinal()
        .domain(Object.keys(aggregatedData))
        .range(d3.schemeCategory10);
    
        const newColorScale = d3.scaleOrdinal()
    .domain(Object.keys(aggregatedData))
    .range(d3.schemeCategory20); // or any other color scheme you prefer
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
    
    const arcLabel = d3.arc()
        .innerRadius(outerRadius)
        .outerRadius(outerRadius + 20);
    
    const arcCategory = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(newOuterRadius); // Use new outer radius

        const arcPaths = svg.selectAll(".arc")
        .data(d3.pie().value(d => d.value).sort(null)(Object.values(aggregatedData)))
        .enter()
        .append("path")
        .attr("class", "arc")
        .attr("d", arcCategory)
        .attr("fill", (d, i) => colorScale(d.data.category))
        .on("click", function (event, d) {
            // Click event handler for both inner and outer arcs
            const centerX = +svg.attr("width") / 2;
            const centerY = +svg.attr("height") / 2;
            const valueText = `Value: ${d.data.value}`;
    
        const centerText = svg.append("text")   
        .attr("text-anchor", "middle")  
        .style("font-size", "12px"  )
        .style("fill", colorScale(d.data.category))
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
                .attr("y", centerY + 10)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .text(valueText);
    
            const competencyDescriptions = d.data.competencies.map(competency => competency.description).join("\n");
            tooltip.html(`<strong>${d.data.category}</strong><br>Total Value: ${d.data.value}<br><br>${competencyDescriptions}`)
                .transition()
                .duration(200)
                .style("opacity", 0.9);
    
            if (!d.data.competencies) return;

            
            // Click event handler for the inner arcs
            svg.selectAll(".innerArc")
                .data(d.data.competencies)
                .enter()
                .append("path")
                .attr("class", "innerArc")
                .attr("fill", (d, i) => d3.schemeCategory10[i])
                .attr("transform", `translate(${arcCategory.centroid(d)})`)
                .style("opacity", 0)
                .on("click", function(event, d) {
                    
                    d3.select(this)
                        .transition()
                        .duration(500)
                        .style("opacity", 1);
    
                    svg.selectAll(".arcCompetency")
                        .filter(outerD => outerD.data.category === d.category)
                        .transition()
                        .duration(500)
                        .attr("d", arcCategory({
                            innerRadius: radius * 0.9,
                            outerRadius: radius
                        }));
    
                    console.log("Clicked on competency:", d.name);
                    console.log("Description:", d.description);
                });

                svg.selectAll(".innerArc")
                .transition()
                .duration(500)
                .style("opacity", 1);
                
        });


        svg.on("mouseleave", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);   
        }
        );
        
    
    const outerArcs = svg.selectAll(".outerArc")    
        .data(pieCategory(Object.values(categoryTotalValues)))
        .enter()
        .append("path")
        .attr("class", "outerArc")
        .attr("d", arcLabel)
        .attr("fill", "none") 
       .on("click", function (event, d) {
        // Click event handler for both inner and outer arcs
        const centerX = +svg.attr("width") / 2;
        const centerY = +svg.attr("height") / 2;
        const valueText = `Value: ${d.data.value}`;

    d3.select(this)
        .transition()
        .duration(500)
        .style("opacity", 1);

    svg.selectAll(".arcCompetency")
        .filter(outerD => outerD.data.category === d.category)
        .transition()
        .duration(500)
        .attr("d", arcCategory({
            innerRadius: radius * 0.9,
            outerRadius: radius
        }));

    console.log("Clicked on competency:", d.name);
    console.log("Description:", d.description);

    const newArc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(newOuterRadius);

    // Remove any existing new arcs
    svg.selectAll(".newArc").remove();

    // Append a new arc for the clicked category
    svg.append("path")
        .attr("class", "newArc")
        .attr("d", newArc)
        .attr("fill", colorScale(d.category))
        .attr("opacity", 0) // Set initial opacity to 0
        .transition()
        .duration(500)
        .attr("opacity", 1); // Transition to full opacity

    // Log the clicked category
    console.log("Clicked category:", d.category);
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

    legend.append("text")
        .attr("x", width / 2 - 10)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style('padding-left', '12px')
        .text(d => categoryTotalValues[d]); 


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
        
        svg.on("dblclick", toggleFullscreen)
    
}




// Main function
async function main() {
    try {
        // Fetch data
        const data = await json('competance.json');
        render(data);
    } catch (error) {
        console.error('Error fetching or rendering data:', error);
    }
}

// Call the main function
main();