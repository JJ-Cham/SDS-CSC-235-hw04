const width = 960;
const height = 600;

const svg = d3.select("#map")
 .attr("width", width)
   .attr("height", height);

// Projection 
// const projection = d3.geoAlbersUsa()
//     .scale(1500)
//     .translate([width / 2, height / 2]);
const projection = d3.geoAlbersUsa();

const path = d3.geoPath().projection(projection);

//const path = d3.geoPath().projection(projection);

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

const defaultZoneFill = "#69b3a2";
const highlightFill = "orange";
const dimmedOpacity = 0.25;
let selectedState = null;

const stateAbbreviations = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
  "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
  "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
  "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
  "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
  "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
  "54": "WV", "55": "WI", "56": "WY"
};

function updateZoneStyles() {
  svg.selectAll(".zone")
    .attr("fill", feature =>
      selectedState && feature.properties.State === selectedState
        ? highlightFill
        : defaultZoneFill
    )
    .attr("opacity", feature =>
      selectedState && feature.properties.State !== selectedState
        ? dimmedOpacity
        : 1
    );
}

// Load US states + GeoJSON zones
Promise.all([
  d3.json(),
  d3.json("data.geojson")
]).then(([us, data]) => {

  console.log(data); // check data in console

  const states = topojson.feature(us, us.objects.states).features;

  // filter bad data (missing geometry)
  const validFeatures = data.features.filter(d => 
    d.geometry && d.geometry.coordinates
  );

  const combined = {
  type: "FeatureCollection",
  features: [...states, ...validFeatures]
  };
  // fit the full US map to the SVG
  // projection.fitSize([width, height], {
  //   type: "FeatureCollection",
  //   features: states
  // });
  projection.fitSize([width, height], combined);

  // draw state outlines first
  svg.selectAll(".state")
    .data(states)
    .enter()
    .append("path")
    .attr("class", "state")
    .attr("d", path)
    .attr("fill", "#f2f2f2")
    .attr("stroke", "#666")
    .attr("stroke-width", 0.8);

  const labelData = states
    .map(state => {
      const [x, y] = path.centroid(state);
      const code = stateAbbreviations[String(state.id).padStart(2, "0")];

      return Number.isFinite(x) && Number.isFinite(y) && code
        ? { code, x, y }
        : null;
    })
    .filter(Boolean);

  svg.selectAll(".state-label")
    .data(labelData)
    .enter()
    .append("text")
    .attr("class", "state-label")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .text(d => d.code);

  // draw resilience zones on top
  svg.selectAll(".zone")
    .data(validFeatures)
    .enter()
    .append("path")
    .attr("class", "zone")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#5264c9")
    .attr("stroke-width", 0.3)

    // hover interactions
    .on("mouseover", function(event, d) {
      d3.select(this)
        .attr("fill", highlightFill)
        .attr("opacity", 1);

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
      updateZoneStyles();
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
      validFeatures,
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
        selectedState = d.state;
        updateZoneStyles();
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

    d3.select("#resetMap").on("click", function() {
      selectedState = null;
      updateZoneStyles();
    });

    updateZoneStyles();
});


