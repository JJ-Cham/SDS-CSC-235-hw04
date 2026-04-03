const width = 700;
const height = 400;
let locked = false;

const svg = d3.select("#lineChart");
const dotSvg = d3.select("#dotPlot");

// Tooltip (single instance)
const tooltip = d3.select("#tooltip");

// Load MULTIPLE forecast files
Promise.all([
    d3.csv("2020-04-27-COVIDhub-ensemble.csv"),
    d3.csv("2020-05-04-COVIDhub-ensemble.csv"),
    d3.csv("2020-05-11-COVIDhub-ensemble.csv")
]).then(files => {

    console.log("FILES:", files);
    const data = files.flat();

    // Parse data
    data.forEach(d => {
        d.value = +d.value;
        d.quantile = +d.quantile;
        d.date = new Date(d.target_end_date);
        d.forecast_date = new Date(d.forecast_date);
    });

    // Filter relevant data
    const filtered = data.filter(d =>
        d.type === "quantile" &&
        d.target.includes("death") &&
        d.location === "US"
    );

    // Dropdown = forecast_date
    const forecastDates = [...new Set(filtered.map(d => d.forecast_date.getTime()))]
        .sort((a, b) => a - b);

    const select = d3.select("#dateSelect");

    select.selectAll("option")
        .data(forecastDates)
        .enter()
        .append("option")
        .text(d => new Date(d).toDateString())
        .attr("value", d => d);

    // Initial render
    const initialDate = forecastDates[0];
    updateCharts(filtered, initialDate);

    // Dropdown interaction
    select.on("change", function () {
        updateCharts(filtered, +this.value);
    });

    drawLegend();
});

function updateCharts(data, selectedForecastDate) {

    const filtered = data.filter(d =>
        d.forecast_date.getTime() === selectedForecastDate
    );

    drawLineChart(filtered);
    drawDotPlot(filtered);
}

function drawLineChart(data) {

    svg.selectAll("*").remove();

    const quantiles = {
        low: 0.025,
        mid: 0.5,
        high: 0.975
    };

    const median = data.filter(d => d.quantile === quantiles.mid);
    const low = data.filter(d => d.quantile === quantiles.low);
    const high = data.filter(d => d.quantile === quantiles.high);

    // Map for safe alignment
    const lowMap = new Map(low.map(d => [d.target_end_date, d.value]));
    const highMap = new Map(high.map(d => [d.target_end_date, d.value]));

    const areaData = median.map(d => ({
        date: d.date,
        value: d.value,
        low: lowMap.get(d.target_end_date),
        high: highMap.get(d.target_end_date)
    })).sort((a, b) => a.date - b.date);

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

    // X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .text("Target Date");

    // Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("Cumulative Deaths");

    // AREA (animated fade-in)
    svg.append("path")
        .datum(areaData)
        .attr("class", "area")
        .attr("d", area)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 0.4);

    // LINE (animated draw)
    const path = svg.append("path")
        .datum(areaData)
        .attr("class", "line")
        .attr("d", line);

    const totalLength = path.node().getTotalLength();

    path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .attr("stroke-dashoffset", 0);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height - 50})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(50,0)`)
        .call(d3.axisLeft(y));

    // Crosshair line
    const focusLine = svg.append("line")
        .attr("stroke", "black")
        .attr("y1", 20)
        .attr("y2", height - 50)
        .style("opacity", 0);

    // Hover interaction
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mousemove", function (event) {

            const [xPos] = d3.pointer(event);
            const date = x.invert(xPos);

            const bisect = d3.bisector(d => d.date).left;
            const i = bisect(areaData, date);

            const d = areaData[i];
            if (!d) return;

            focusLine
                .attr("x1", x(d.date))
                .attr("x2", x(d.date))
                .style("opacity", 1);

            tooltip
                .style("opacity", 1)
                .html(`
                    <strong>${d.date.toDateString()}</strong><br>
                    Median: ${Math.round(d.value)}<br>
                    Low: ${Math.round(d.low)}<br>
                    High: ${Math.round(d.high)}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
            focusLine.style("opacity", 0);
            tooltip.style("opacity", 0);
        });
}

function drawDotPlot(data) {

    dotSvg.selectAll("*").remove();

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.value))
        .range([50, width - 50]);

    // dotSvg.selectAll("circle")
    //     .data(data)
    //     .join("circle")
    //     .attr("class", "dot")
    //     .transition()
    //     .duration(500)
    //     .attr("cx", d => x(d.value))
    //     .attr("cy", d => 150 - d.quantile * 120)
    //     .attr("r", d => d.quantile === 0.5 ? 7 : 4)
    //     .attr("fill", d => {
    //       if (d.quantile === 0.5) return "#2563eb";
    //       if (d.quantile < 0.5) return "#93c5fd";
    //       return "#1e3a8a";
    //   });

    //adding in point click/freeze interaction
    dotSvg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.value))
    .attr("cy", d => 150 - d.quantile * 120)
    .attr("r", d => d.quantile === 0.5 ? 7 : 4)

    // hover
    .on("mouseover", function (event, d) {
        if (locked) return;

        d3.select(this).attr("stroke", "black");

        tooltip
            .style("opacity", 1)
            .html(`
                <strong>Quantile: ${d.quantile}</strong><br>
                Value: ${Math.round(d.value)}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
    })

    .on("mouseout", function () {
        if (locked) return;

        d3.select(this).attr("stroke", null);
        tooltip.style("opacity", 0);
    })

    //click to freeze/unfreeze
    .on("click", function (event, d) {

        locked = !locked;

        if (locked) {
            // Highlight selected point
            dotSvg.selectAll("circle").attr("stroke", null);

            d3.select(this)
                .attr("stroke", "black")
                .attr("stroke-width", 2);

            tooltip
                .style("opacity", 1)
                .html(`
                    <strong>Quantile: ${d.quantile}</strong><br>
                    Value: ${Math.round(d.value)}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");

        } else {
            // Unfreeze
            d3.select(this).attr("stroke", null);
            tooltip.style("opacity", 0);
        }
    });

    dotSvg.append("g")
        .attr("transform", `translate(0,150)`)
        .call(d3.axisBottom(x));

    dotSvg.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .text("Quantile Distribution");

    dotSvg.append("text")
    .attr("x", width / 2)
    .attr("y", 190)
    .attr("text-anchor", "middle")
    .text("Predicted Deaths");

    dotSvg.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .text("Quantile");

}

function drawLegend() {

    const legend = d3.select("#legend");
    legend.selectAll("*").remove();

    const items = [
        { label: "Median (0.5)", color: "#2563eb", type: "line" },
        { label: "Uncertainty (0.025–0.975)", color: "#93c5fd", type: "area" }
    ];

    const container = legend.append("div")
        .style("display", "flex")
        .style("gap", "20px")
        .style("align-items", "center")
        .style("margin", "10px 0");

    const item = container.selectAll(".legend-item")
        .data(items)
        .enter()
        .append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "8px");

    // Color box / line
    item.append("div")
        .style("width", "30px")
        .style("height", d => d.type === "line" ? "4px" : "12px")
        .style("background", d => d.color)
        .style("opacity", d => d.type === "area" ? 0.5 : 1);

    // Label
    item.append("span")
        .text(d => d.label);
}