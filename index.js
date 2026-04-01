const width = 700;
const height = 400;
const margin = { top: 20, right: 30, bottom: 40, left: 50 };

const svg = d3.select("#lineChart");
const dotSvg = d3.select("#dotPlot");

d3.csv("2020-03-31-IHME-CurveFit.csv").then(data => {

    data.forEach(d => {
        d.value = +d.value;
        d.quantile = d.quantile ? +d.quantile : null;
        d.date = new Date(d.target_end_date);
    });

    // Filter one location (simplify!)
    const filtered = data.filter(d => d.location === "US");

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

    select.on("change", function () {
        drawDotPlot(filtered, this.value);
    });
});

function drawLineChart(data) {

    const median = data.filter(d => d.quantile === 0.5);
    const low = data.filter(d => d.quantile === 0.1);
    const high = data.filter(d => d.quantile === 0.9);

    const x = d3.scaleTime()
        .domain(d3.extent(median, d => d.date))
        .range([50, width - 50]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(high, d => d.value)])
        .range([height - 50, 20]);

    const area = d3.area()
        .x(d => x(d.date))
        .y0((d, i) => y(low[i].value))
        .y1((d, i) => y(high[i].value));

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value));

    svg.append("path")
        .datum(median)
        .attr("class", "area")
        .attr("d", area);

    svg.append("path")
        .datum(median)
        .attr("class", "line")
        .attr("d", line);

    svg.append("g")
        .attr("transform", `translate(0,${height - 50})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(50,0)`)
        .call(d3.axisLeft(y));
}

function drawDotPlot(data, selectedDate) {

    dotSvg.selectAll("*").remove();

    const filtered = data.filter(d => d.target_end_date === selectedDate && d.quantile !== null);

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
        .attr("r", 5)
        .append("title")
        .text(d => `Quantile: ${d.quantile}, Value: ${d.value}`);

    dotSvg.append("g")
        .attr("transform", `translate(0,150)`)
        .call(d3.axisBottom(x));
}