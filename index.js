const width = 960;
const height = 600;

const svg = d3.select("#map");

// Projection (fits US nicely)
const projection = d3.geoAlbersUsa()
    .scale(1200)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Load GeoJSON
d3.json("data.geojson").then(data => {

  console.log(data); // check your data in console

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

});