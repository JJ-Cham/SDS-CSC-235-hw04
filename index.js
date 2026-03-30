const width = 960;
const height = 600;

const svg = d3.select("#map");

// Projection 
const projection = d3.geoAlbersUsa()
    .scale(1500)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Load GeoJSON
d3.json("data.geojson").then(data => {

  console.log(data); // check data in console

  svg.selectAll("path")
    .data(data.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#69b3a2")
    .attr("stroke", "#333")
    .attr("stroke-width", 0.2)

    // hover interactions
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill", "orange");

      tooltip.style("opacity", 1)
        .html(`
          <strong>State:</strong> ${d.properties.State}<br/>
          <strong>County:</strong> ${d.properties.County}<br/>
          <strong>Tract:</strong> ${d.properties.Tract_FIPS}
        `);
    })

    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })

    .on("mouseout", function() {
      d3.select(this).attr("fill", "#69b3a2");
      tooltip.style("opacity", 0);
    });

    //second visualization 
    const margin = {top: 20, right: 20, bottom: 50, left: 60};
    const widthBar = 600 - margin.left - margin.right;
    const heightBar = 400 - margin.top - margin.bottom;

    const svgBar = d3.select("#barchart")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const counts = d3.rollups(
      data.features,
      v => v.length,
      d => d.properties.State
    );

    // Convert to objects
    const stateData = counts.map(d => ({
      state: d[0],
      count: d[1]
    }));

    // Sort descending 
    stateData.sort((a, b) => b.count - a.count);

    const x = d3.scaleBand()
      .domain(stateData.map(d => d.state))
      .range([0, widthBar])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stateData, d => d.count)])
      .nice()
      .range([heightBar, 0]);

    svgBar.selectAll("rect")
      .data(stateData)
      .enter()
      .append("rect")
      .attr("x", d => x(d.state))
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => heightBar - y(d.count))
      .attr("fill", "steelblue")

      //click interaction (links to map)
      .on("click", function(event, d) {

        svg.selectAll("path")
          .attr("fill", feature =>
            feature.properties.State === d.state
              ? "orange"
              : "#ccc"
          );
      });

      svgBar.append("g")
      .attr("transform", `translate(0,${heightBar})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svgBar.append("g")
      .call(d3.axisLeft(y));

    svgBar.append("text")
      .attr("x", widthBar / 2)
      .attr("y", heightBar + 40)
      .attr("text-anchor", "middle")
      .text("State");

    svgBar.append("text")
      .attr("x", -heightBar / 2)
      .attr("y", -40)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Number of Zones");
});


