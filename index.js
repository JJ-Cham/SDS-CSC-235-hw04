// const width = 700;
// const height = 400;
// const margin = { top: 20, right: 30, bottom: 40, left: 50 };

// const svg = d3.select("#lineChart");
// const dotSvg = d3.select("#dotPlot");

// d3.csv("2020-03-31-IHME-CurveFit.csv").then(data => {
//     console.log(data[0]);

//     data.forEach(d => {
//         d.value = +d.value;
//         d.quantile = d.quantile ? +d.quantile : null;
//         d.date = new Date(d.target_end_date);
//     });

//     // Filter one location (simplify!)
//     const filtered = data.filter(d => d.type === "quantile");

//     const dates = [...new Set(filtered.map(d => d.target_end_date))];

//     const select = d3.select("#dateSelect");

//     select.selectAll("option")
//         .data(dates)
//         .enter()
//         .append("option")
//         .text(d => d)
//         .attr("value", d => d);

//     drawLineChart(filtered);
//     drawDotPlot(filtered, dates[0]);

//     select.on("change", function () {
//         drawDotPlot(filtered, this.value);
//     });
// });

// function drawLineChart(data) {

//     const median = data.filter(d => d.quantile === 0.5);
//     const low = data.filter(d => d.quantile === 0.1);
//     const high = data.filter(d => d.quantile === 0.9);

//     const x = d3.scaleTime()
//         .domain(d3.extent(median, d => d.date))
//         .range([50, width - 50]);

//     const y = d3.scaleLinear()
//         .domain([0, d3.max(high, d => d.value)])
//         .range([height - 50, 20]);

//     median.sort((a, b) => a.date - b.date);
//     low.sort((a, b) => a.date - b.date);
//     high.sort((a, b) => a.date - b.date);

//     const area = d3.area()
//         .x(d => x(d.date))
//         .y0((d, i) => y(low[i].value))
//         .y1((d, i) => y(high[i].value));

//     const line = d3.line()
//         .x(d => x(d.date))
//         .y(d => y(d.value));

//     svg.append("path")
//         .datum(median)
//         .attr("class", "area")
//         .attr("d", area);

//     svg.append("path")
//         .datum(median)
//         .attr("class", "line")
//         .attr("d", line);

//     svg.append("g")
//         .attr("transform", `translate(0,${height - 50})`)
//         .call(d3.axisBottom(x));

//     svg.append("g")
//         .attr("transform", `translate(50,0)`)
//         .call(d3.axisLeft(y));

//     // X Axis Label
//     svg.append("text")
//         .attr("x", width / 2)
//         .attr("y", height)
//         .attr("text-anchor", "middle")
//         .text("Date");

//     // Y Axis Label
//     svg.append("text")
//         .attr("transform", "rotate(-90)")
//         .attr("x", -height / 2)
//         .attr("y", 15)
//         .attr("text-anchor", "middle")
//         .text("Predicted Value");

//     svg.selectAll(".hover-dot")
//     .data(median)
//     .attr("r", d => d.quantile === 0.5 ? 7 : 4)
//     .enter()
//     .append("circle")
//     .attr("cx", d => x(d.date))
//     .attr("cy", d => y(d.value))
//     .attr("r", 4)
//     .attr("opacity", 0)
//     .on("mouseover", function (event, d) {
//         d3.select(this).attr("opacity", 1);

//         d3.select("#tooltip")
//             .style("opacity", 1)
//             .html(`Date: ${d.date.toDateString()}<br>Value: ${d.value}`)
//             .style("left", (event.pageX + 10) + "px")
//             .style("top", (event.pageY - 20) + "px");
//     })
//     .on("mouseout", function () {
//         d3.select(this).attr("opacity", 0);
//         d3.select("#tooltip").style("opacity", 0);
//     });
// }

// function drawDotPlot(data, selectedDate) {

//     dotSvg.selectAll("*").remove();

//     const filtered = data.filter(d => d.target_end_date === selectedDate && d.quantile !== null);

//     const x = d3.scaleLinear()
//         .domain(d3.extent(filtered, d => d.value))
//         .range([50, width - 50]);

//     dotSvg.selectAll("circle")
//         .data(filtered)
//         .enter()
//         .append("circle")
//         .attr("class", "dot")
//         .attr("cx", d => x(d.value))
//         .attr("cy", 100)
//         .attr("r", 5)
//         .append("title")
//         .text(d => `Quantile: ${d.quantile}, Value: ${d.value}`);

//     dotSvg.append("g")
//         .attr("transform", `translate(0,150)`)
//         .call(d3.axisBottom(x));
//     // X Axis Label
//     dotSvg.append("text")
//         .attr("x", width / 2)
//         .attr("y", 190)
//         .attr("text-anchor", "middle")
//         .text("Forecast Value");

//     // Title (optional but nice)
//     dotSvg.append("text")
//         .attr("x", width / 2)
//         .attr("y", 20)
//         .attr("text-anchor", "middle")
//         .text("Quantile Distribution");
// }

const width = 700;
const height = 400;
const margin = { top: 20, right: 30, bottom: 40, left: 50 };

const svg = d3.select("#lineChart");
const dotSvg = d3.select("#dotPlot");

// Tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background", "white")
    .style("border", "1px solid black")
    .style("padding", "5px");

d3.csv("2020-03-31-IHME-CurveFit.csv").then(data => {

    data.forEach(d => {
        d.value = +d.value;
        d.quantile = d.quantile ? +d.quantile : null;
        d.date = new Date(d.target_end_date);
    });

    // ✅ ONLY keep quantile data + one target
    const filtered = data.filter(d =>
        d.type === "quantile" &&
        d.target.includes("inc hosp")
    );

    // Get unique dates
    const dates = [...new Set(filtered.map(d => d.target_end_date))];

    const select = d3.select("#dateSelect");

    select.selectAll("option")
        .data(dates)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    drawLineChart(filtered);
    drawDotPlot(filtered, dates[0]);

    // Dropdown interaction
    select.on("change", function () {
        drawDotPlot(filtered, this.value);
    });
});

function drawLineChart(data) {

    svg.selectAll("*").remove();

    const median = data.filter(d => d.quantile === 0.5);
    const low = data.filter(d => d.quantile === 0.1);
    const high = data.filter(d => d.quantile === 0.9);

    // Sort to align data
    median.sort((a, b) => a.date - b.date);
    low.sort((a, b) => a.date - b.date);
    high.sort((a, b) => a.date - b.date);

    // Combine safely for area
    const areaData = median.map((d, i) => ({
        date: d.date,
        value: d.value,
        low: low[i]?.value,
        high: high[i]?.value
    }));

    const x = d3.scaleTime()
        .domain(d3.extent(areaData, d => d.date))
        .range([50, width - 50]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(areaData, d => d.high)])
        .range([height - 50, 20]);

    const area = d3.area()
        .x(d => x(d.date))
        .y0(d => y(d.low))
        .y1(d => y(d.high));

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value));

    // Uncertainty band
    svg.append("path")
        .datum(areaData)
        .attr("class", "area")
        .attr("d", area);

    // Median line
    svg.append("path")
        .datum(areaData)
        .attr("class", "line")
        .attr("d", line);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height - 50})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(50,0)`)
        .call(d3.axisLeft(y));

    // Axis Labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height)
        .attr("text-anchor", "middle")
        .text("Date");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("Predicted Value");

    // ✅ Hover interaction (SECOND interaction)
    svg.selectAll(".hover-dot")
        .data(areaData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.value))
        .attr("r", 4)
        .attr("opacity", 0)
        .on("mouseover", function (event, d) {
            d3.select(this).attr("opacity", 1);

            tooltip
                .style("opacity", 1)
                .html(`Date: ${d.date.toDateString()}<br>Value: ${d.value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("opacity", 0);
            tooltip.style("opacity", 0);
        });
}

function drawDotPlot(data, selectedDate) {

    dotSvg.selectAll("*").remove();

    const filtered = data.filter(d =>
        d.target_end_date === selectedDate &&
        d.quantile !== null
    );

    const x = d3.scaleLinear()
        .domain(d3.extent(filtered, d => d.value))
        .range([50, width - 50]);

    dotSvg.selectAll("circle")
        .data(filtered)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.value))
        .attr("cy", 100)
        .attr("r", d => d.quantile === 0.5 ? 7 : 4) // highlight median
        .append("title")
        .text(d => `Quantile: ${d.quantile}, Value: ${d.value}`);

    dotSvg.append("g")
        .attr("transform", `translate(0,150)`)
        .call(d3.axisBottom(x));

    dotSvg.append("text")
        .attr("x", width / 2)
        .attr("y", 190)
        .attr("text-anchor", "middle")
        .text("Forecast Value");

    dotSvg.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .text(`Quantile Distribution (${selectedDate})`);
}