/* MIGRATION 2015 */
/* eslint-disable no-undef */

// Adding basic elements
const body = d3.select('body');

// Buttons
const buttons = d3.select('#buttons')
buttons
  .append('a')
  .text('Reset data')
  .attr('class', 'button')
  .on('click', removeDisplayedItems);

buttons
  .append('a')
  .text('Reset map & data')
  .attr('class', 'button')
  .style('margin-left', '10px')
  .on('click', reset);

// Adding svg
const zoom = d3.zoom().scaleExtent([1, 40]).on('zoom', zoomed);
const height = 650;
const svg = d3
  .select('#map')
  .append('svg')
  .attr('width', '100%')
  .attr('height', height)
  .call(zoom);

// Adding svg data-free elements
const legend = svg
  .append('g')
  .attr('class', 'legend')
  .style('visibility', 'hidden');

legend
  .append('circle')
  .attr('r', 12)
  .attr('cx', 20)
  .attr('cy', 550)
  .style('fill', 'hsla(0, 0%, 85%, .66)');

legend
  .append('text')
  .attr('x', 20)
  .attr('y', 550)
  .attr('dx', 27)
  .attr('dy', -2)
  .text('Country of origin')
  .attr('font-size', '12px')
  .attr('font-weight', 'bold')
  .attr('fill', 'hsla(0, 0%, 100%, .66)');

legend
  .append('text')
  .attr('x', 20)
  .attr('y', 550)
  .attr('dx', 27)
  .attr('dy', 11)
  .text('Click to display immigration data')
  .attr('font-size', '12px')
  .attr('fill', 'hsla(0, 0%, 85%, .66)');

const immigrationCircle = legend
  .append('circle')
  .attr('r', 12)
  .attr('cx', 20)
  .attr('cy', 595)
  .attr('stroke', 'hsla(0, 100%, 85%, .66)')
  .attr('stroke-width', '1px')
  .style('fill', 'hsla(0, 100%, 85%, .33)');

const immigrationText = legend
  .append('text')
  .attr('x', 20)
  .attr('y', 590)
  .attr('dx', 27)
  .attr('dy', -2)
  .text('Country of emigration')
  .attr('font-size', '12px')
  .attr('fill', 'hsla(0, 0%, 85%, .66)');
repeat();

legend
  .append('text')
  .attr('x', 20)
  .attr('y', 590)
  .attr('dx', 27)
  .attr('dy', 11)
  .text('Hover to display emigration info')
  .attr('font-size', '12px')
  .attr('fill', 'hsla(0, 0%, 85%, .66)');

legend
  .append('text')
  .attr('x', 20)
  .attr('y', 590)
  .attr('dx', 27)
  .attr('dy', 24)
  .text('Click to access data points behind it')
  .attr('font-size', '12px')
  .attr('fill', 'hsla(0, 0%, 85%, .66)');

legend.attr('transform', 'translate(0, -20)');

// moveToBack function: move an element from the front to the back
d3.selection.prototype.moveToBack = function () {
  return this.each(function () {
    let firstChild = this.parentNode.firstChild;
    if (firstChild) {
      this.parentNode.insertBefore(this, firstChild);
    }
  });
};

d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};

// Main const for world map creation
const projection = d3
  .geoNaturalEarth1()
  .scale(250)
  .translate([0.5 * window.innerWidth, 375]);
const pathGenerator = d3.geoPath().projection(projection);

const worldMapDiasplay = svg.append('g');
const map = worldMapDiasplay.append('g').attr('id', 'map');
const emLines = worldMapDiasplay.append('g').attr('id', 'emigration-lines');
const emCircles = worldMapDiasplay.append('g').attr('id', 'emigration-data');

// Tooltip for emigration data circles
const emigrationTip = d3
  .tip()
  .attr('class', 'd3-tip')
  .offset([-12, 0])
  .html(
    (d, i) => `Emigration to ${d[0].split('_').join(' ')} : 
    <span style="color: hsla(${i}, 100%, 50%, .75)"> 
      ${Number(d[1]).toLocaleString('en')}
    </span>`
  );

// Creation of the world map
d3.json('../../data/map/world_map.json').then((data) => {
  let features = data.features;

  // Gathering country centroids
  let centroids = [];
  features.forEach((f) => {
    let centroid = pathGenerator.centroid(f);
    centroids.push([centroid[0], centroid[1], f.properties.name]);
  });

  // Generate map

  map
    .selectAll('path')
    .data(features)
    .enter()
    .append('path')
    .attr('class', 'map')
    .attr('d', pathGenerator)
    .style('fill', '#273147')
    .style('stroke', 'rgb(0, 0, 0)')
    .style('stroke-opacity', '0.25')
    .on('mouseover', () => d3.select(event.target).style('fill', '#485470'))
    .on('mouseout', () => d3.select(event.target).style('fill', '#273147'))
    .on('click', (clicked) => {
      legend.moveToFront();
      generateDataDisplay(clicked, centroids);
    });
});

/* 
First major data-driven function :
displayEmigration() displays paths from the country of origin
to countries where at least one person emigrated. Each of
these countries are assigned a circle which, when hovered,
display the emigration data from the origin to the emigration country
*/
function displayEmigration(dest, origin, max, min, centroids) {
  // Deleting previously existing paths
  emLines.selectAll('.emigration-line').remove();

  // Create new paths according to the data
  let strokes = [];
  dest.forEach((e) => {
    strokes.push([
      drawPath(
        d3.path(),
        origin,
        getCentroid(e[0].split('_').join(' '), centroids)
      ),
      e[0],
    ]);
  });

  // Adding the paths to the svg
  let emigrationLines = emLines
    .selectAll('.emigration-line')
    .data(dest)
    .enter()
    .append('path')
    .attr('class', 'emigration-line')
    .attr('id', (d, i) => `line${i}`)
    .attr('d', (d) => {
      if (d[1] > 0) {
        return strokes[dest.indexOf(d)][0];
      }
    })
    .style('stroke', (d, i) => `hsla(${i}, 100%, 50%, .33)`)
    .style('opacity', '0');

  // Animating the paths
  emigrationLines.each((d, i) => {
    let totalLength = d3
      .select('#line' + i)
      .node()
      .getTotalLength();
    if (totalLength > 0) {
      d3.selectAll('#line' + i)
        .attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .style('opacity', '1')
        .transition(d3.easeLinear)
        .duration(500)
        .delay(500 + 5 * i)
        .attr('stroke-dashoffset', 0)
        .style('stroke-width', 3);
    }
  });

  // Remove previously existing data circles
  emCircles.selectAll('.emigration-circle').remove();

  const circle_r_scale = d3.scaleSqrt([min, max], [2, 50])

  // Adding data circles
  emCircles
    .selectAll('.emigration-circle')
    .data(dest)
    .enter()
    .append('circle')
    .attr('class', 'emigration-circle')
    .attr('cx', (d) => getCentroid(d[0].split('_').join(' '), centroids)[0])
    .attr('cy', (d) => getCentroid(d[0].split('_').join(' '), centroids)[1])
    .attr('fill', (d, i) => `hsla(${i}, 100%, 50%, .33)`)
    .attr('stroke', (d, i) => `hsla(${i}, 100%, 50%, .66)`)
    .attr('stroke-width', '1px')
    .attr('r', 0)
    // Adding tooltip
    .call(emigrationTip)
    .on('mouseover', emigrationTip.show)
    .on('mouseout', emigrationTip.hide)
    .on('click', () => {
      d3.select(event.target).moveToBack();
      map.moveToBack();
    })
    .transition()
    .duration(1000)
    .delay((d, i) => 500 + 5 * i)
    .attr('r', (d) =>  d[1] > 0 ? circle_r_scale(d[1]) : 0);
}

/*
Second major data-driven function :
displayImmigration() is simpler in that it displays a single circle
at the country of origin (the one clicked by the user). When hovered,
the circle displays a tooltip giving the total immigration into the origin.
When clicked, the circle displays a detailed view of the countries from 
which at least one person immigrated.
*/
function displayImmigration(immigration, emigration, origin) {
  // Variables to display later
  let immigrationData = displayableMigrationData(immigration, true);
  let emigrationData = displayableMigrationData(emigration, false);

  // Tooltip for the immigration data circle
  const immigrationTip = d3
    .tip()
    .attr('class', 'd3-tip')
    .offset([-12, 0])
    .html(
      () =>
        `Total immigration : <span style="color: hsla(120, 100%, 50%, .75);">${immigrationData[1]}</span><br/>
        Total emigration : <span style="color: hsla(0, 100%, 50%, .75);">${emigrationData[1]}</span>`
    );

  // Removeing previously existing immigration data circle
  svg.select('#immigration-data').remove();

  // Adding immigration data circle
  worldMapDiasplay
    .append('circle')
    .attr('id', 'immigration-data')
    .attr('cx', origin[0])
    .attr('cy', origin[1])
    .attr('r', 0)
    .attr('fill', 'hsla(0, 0%, 0%, .0)')
    // Adding tooltip
    .call(immigrationTip)
    .on('mouseover', immigrationTip.show)
    .on('mouseout', immigrationTip.hide)
    .on('click', () =>
      // Creating modal to display immigration data
      swal.fire({
        icon: 'info',
        background: '#343a47',
        confirmButtonColor: '#474d5c',
        html: `<h3 style="color: #9ba7c2;"> Migration data for ${origin[2]} </h3>
          <h5 style="color: #9ba7c2;"> Total immigration : ${immigrationData[1]} </h5>
          <div style="
            overflow-y: scroll; 
            height: 96px; 
            font-size: 12px;
            color: #9ba7c2;
            background-color: #242830">
            ${immigrationData[0]}
          </div>
          <h5 style="color: #9ba7c2;"> Total emigration : ${emigrationData[1]} </h5>
          <div style="
            overflow-y: scroll; 
            height: 96px; 
            font-size: 12px;
            color: #9ba7c2;
            background-color: #242830">
            ${emigrationData[0]}
          </div>`,
      })
    )
    .transition()
    .duration(500)
    .attr('r', 12)
    .attr('fill', 'hsla(0, 0%, 85%, .66)');
}

function generateDataDisplay(element, centroids) {
  // Return CSV promise
  let csv_data = getData();
  const country = element.properties.name.split(' ').join('_');

  // Calculate the clicked country's centroid
  let center = getCentroid(country.split('_').join(' '), centroids);

  // Call the data gathering function
  getMigration(csv_data, country, center, centroids);
}

// Gathering migration data
function getMigration(data, country, origin, centroids) {
  data.then((data) => {
    // Gather emigration data
    let emigration = [];
    data.forEach((row) => {
      emigration.push([row.destination, Number(row[country])]);
    });

    const flatten_data_values = data.map(row => {
      const out = []
      for (const [k, v] of Object.entries(row)) {
        if (!isNaN(Number(v))) out.push(Number(v))
      }
      return out
    }).flat()

    // let max = Math.max(...emigration.map((d) => d[1]));
    // let min = Math.min(...emigration.filter((d) => d[1] > 0).map((d) => d[1]));

    let max = Math.max(...flatten_data_values);
    let min = Math.min(...flatten_data_values.filter((val) => val > 0));

    // Gather immigration data
    let immigration;
    data.forEach((row) => {
      if (row.destination == country) {
        immigration = Object.entries(row);
      }
    });
    if (typeof immigration !== 'undefined') {
      immigration.shift();
    }

    if (!isNaN(max) || typeof immigration !== 'undefined') {
      // Display legend
      svg.select('.legend').style('visibility', 'visible');

      // Call major data-driven functions
      displayEmigration(emigration, origin, max, min, centroids);
      displayImmigration(immigration, emigration, origin);
    } else {
      swal.fire({
        icon: 'error',
        background: '#343a47',
        confirmButtonColor: '#474d5c',
        html: `<h3 style="color: #9ba7c2;"> No data for ${country} </h3>
          <h5 style="color: #9ba7c2;"> 
            There is sadly no migration data provided by the U.N. for ${country} !
          </h5>`,
      });
    }
  });
}

// Gather information to display in the origin data circle
function displayableMigrationData(data, immigrated) {
  // Main variables
  let displayedMigration = '';
  let totalMigration = 0;

  // Create an HTML-filled string with the name of the country
  // And the number of people migrating either from or to it
  // Count the total amount of people migrating
  data.forEach((t) => {
    if (Number(t[1]) > 0) {
      displayedMigration += `${immigrated ? 'From' : 'To'}
        ${t[0].split('_').join(' ')} : 
        <span style="color: hsla(${data.indexOf(t)}, 100%, 50%, .33)">
          ${Number(t[1]).toLocaleString('en')}
        </span><br/>`;
    } else {
      displayedMigration += '';
    }
    totalMigration += Number(t[1]);
  });
  totalMigration = totalMigration.toLocaleString('en');

  return [displayedMigration, totalMigration];
}

// Function to iterate over dataset and returning centroid for corresponding country
function getCentroid(co, ce) {
  let center;
  ce.forEach((t) => {
    if (t.includes(co)) {
      center = t;
    }
  });
  return center;
}

// Path creation function for data lines
function drawPath(path, origin, end) {
  path.moveTo(origin[0], origin[1]);
  path.lineTo(end[0], end[1]);
  path.closePath();
  return path;
}

// Data loading function
function getData() {
  return d3.csv('../../data/CSV/migration_2015.csv');
}

// Repeat function for legend's circle and text
function repeat() {
  let random = Math.ceil(Math.random() * 240);
  immigrationCircle
    .transition()
    .duration(2500)
    .style('fill', `hsla(${random}, 100%, 85%, .33)`)
    .attr('stroke', `hsla(${random}, 100%, 85%, .66)`)
    .attr('stroke-width', '1px');

  immigrationText
    .transition()
    .duration(2500)
    .style('fill', `hsla(${random}, 100%, 85%, .33)`)
    .attr('stroke', `hsla(${random}, 100%, 85%, .66)`)
    .attr('stroke-width', '1px')
    .on('end', repeat);
}

function zoomed() {
  worldMapDiasplay.attr('transform', d3.event.transform);
}

function reset() {
  svg.transition().duration(1500).call(zoom.transform, d3.zoomIdentity);
  removeDisplayedItems();
}

function removeDisplayedItems() {
  emLines.selectAll('.emigration-line').each((d, i) => {
    let totalLength = d3
      .select('#line' + i)
      .node()
      .getTotalLength();
    d3.selectAll('#line' + i)
      .transition()
      .duration(1000)
      .attr('stroke-dashoffset', totalLength)
      .remove();
  });
  emCircles
    .selectAll('.emigration-circle')
    .transition()
    .duration(1000)
    .attr('r', 0)
    .remove();
  d3.select('#immigration-data').transition().duration(1000).remove();
  legend.style('visibility', 'hidden');
}
