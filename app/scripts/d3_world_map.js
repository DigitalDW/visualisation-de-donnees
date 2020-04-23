/* MIGRATION 2015 */
/* eslint-disable no-undef */

// Adding basic elements
const body = d3.select('body');

// Title Header
const titleContainer = body
  .append('div')
  .attr('class', 'container')
  .style('display', 'flex')
  .style('width', '100%')
  .style('align-items', 'center')
  .style('justifiy-content', 'center')
  .style('padding-top', '7px');

titleContainer
  .append('h1')
  .text('Migrations 2015')
  .style('margin', '0 auto')
  .style('color', '#7181a6');

// Button header
const buttonContainer = body
  .append('div')
  .attr('class', 'container')
  .style('display', 'flex')
  .style('width', '100%')
  .style('align-items', 'center')
  .style('justifiy-content', 'center')
  .style('padding-top', '5px');

buttonContainer
  .append('a')
  .text('Reset points')
  .style('margin', '0 auto')
  .attr('class', 'button')
  .on('click', () => {
    svg.selectAll('.emigration-line').remove();
    svg.selectAll('.emigration-data').remove();
    svg.selectAll('.immigration-data').remove();
    svg.select('.legend').style('visibility', 'hidden');
  });

// Adding svg
const height = 650;
const svg = body.append('svg').attr('width', '100%').attr('height', height);

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
  .attr('fill', 'hsla(0, 0%, 85%, .66)');

legend
  .append('text')
  .attr('x', 20)
  .attr('y', 550)
  .attr('dx', 27)
  .attr('dy', 11)
  .text('Click to display immigration data')
  .attr('font-size', '12px')
  .attr('fill', 'hsla(0, 0%, 85%, .66)');

legend
  .append('circle')
  .attr('r', 12)
  .attr('cx', 20)
  .attr('cy', 595)
  .attr('stroke', 'hsla(0, 100%, 85%, .366)')
  .attr('stroke-width', '1px')
  .style('fill', 'hsla(0, 100%, 85%, .33)');

legend
  .append('text')
  .attr('x', 20)
  .attr('y', 590)
  .attr('dx', 27)
  .attr('dy', -2)
  .text('Country of emigration')
  .attr('font-size', '12px')
  .attr('fill', 'hsla(0, 100%, 85%, .66)');

legend
  .append('text')
  .attr('x', 20)
  .attr('y', 590)
  .attr('dx', 27)
  .attr('dy', 11)
  .text('Hover to display emigration info')
  .attr('font-size', '12px')
  .attr('fill', 'hsla(0, 100%, 85%, .66)');

legend
  .append('text')
  .attr('x', 20)
  .attr('y', 590)
  .attr('dx', 27)
  .attr('dy', 24)
  .text('Click to access data points behind it')
  .attr('font-size', '12px')
  .attr('fill', 'hsla(0, 100%, 85%, .66)');

// moveToBack function: move an element from the front to the back
d3.selection.prototype.moveToBack = function () {
  return this.each(function () {
    let firstChild = this.parentNode.firstChild;
    if (firstChild) {
      this.parentNode.insertBefore(this, firstChild);
    }
  });
};

// Main const for world map creation
const projection = d3.geoNaturalEarth1().scale(250).translate([700, 375]);
const pathGenerator = d3.geoPath().projection(projection);

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
  const paths = svg.selectAll('path').data(features);

  paths
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
      // Return CSV promise
      let csv_data = getData();
      const country = clicked.properties.name.split(' ').join('_');

      // Display legend
      svg.select('.legend').style('visibility', 'visible');

      // Call main data-driven functions
      getEmigration(csv_data, country, centroids);
      getImmigration(csv_data, country, centroids);
    });
});

/* 
First major data-driven function :
displayEmigration() displays paths from the country of origin
to countries where at least one person emigrated. Each of
these countries are assigned a circle which, when hovered,
display the emigration data from the origin to the emigration country
*/
function displayEmigration(dest, origin, max, centroids) {
  // Deleting previously existing paths
  svg.selectAll('.emigration-line').remove();

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
  svg
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
  d3.selectAll('.emigration-line').each((d, i) => {
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
  svg.selectAll('.emigration-data').remove();

  // Adding data circles
  svg
    .selectAll('.emigration-data')
    .data(dest)
    .enter()
    .append('circle')
    .attr('class', 'emigration-data')
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
      d3.selectAll('.map').moveToBack();
    })
    .transition()
    .duration(1000)
    .delay((d, i) => 500 + 5 * i)
    .attr('r', (d) => {
      if (d[1] > 0) {
        return ((d[1] / max) * 100) / 2 + 3;
      } else {
        return 0;
      }
    });
}

/*
Second major data-driven function :
displayImmigration() is simpler in that it displays a single circle
at the country of origin (the one clicked by the user). When hovered,
the circle displays a tooltip giving the total immigration into the origin.
When clicked, the circle displays a detailed view of the countries from 
which at least one person immigrated.
*/
function displayImmigration(immigration, origin) {
  // Variables to display later
  let displayedImmigration = '';
  let total = 0;

  // Preparing previous variables for display
  immigration.forEach((t) => {
    if (Number(t[1]) > 0) {
      displayedImmigration += `
        From ${t[0].split('_').join(' ')} : 
        <span style="color: hsla(${immigration.indexOf(t)}, 100%, 50%, .33)">
          ${Number(t[1]).toLocaleString('en')}
        </span><br/>`;
    } else {
      displayedImmigration += '';
    }
    total += Number(t[1]);
  });
  total = total.toLocaleString('en');

  // Tooltip for the immigration data circle
  const immigrationTip = d3
    .tip()
    .attr('class', 'd3-tip')
    .offset([-12, 0])
    .html(
      () =>
        `Total immigration : <span style="color: hsla(0, 100%, 50%, .75);">${total}</span>`
    );

  // Removeing previously existing immigration data circle
  svg.selectAll('.immigration-data').remove();

  // Adding immigration data circle
  svg
    .append('circle')
    .attr('class', 'immigration-data')
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
        html: `<h3 style="color: #9ba7c2;"> Immigration to ${origin[2]} </h3>
      <h5 style="color: #9ba7c2;"> Total immigration : ${total} </h5>
      <div style="
        overflow-y: scroll; 
        height: 96px; 
        font-size: 12px;
        color: #9ba7c2;
        background-color: #242830">
        ${displayedImmigration}
      </div>`,
      })
    )
    .transition()
    .duration(500)
    .attr('r', 12)
    .attr('fill', 'hsla(0, 0%, 85%, .66)');
}

// Data gathering functions
// Gathering emigration data
function getEmigration(data, country, centroids) {
  data.then((data) => {
    let destinations = [];
    data.forEach((row) => {
      destinations.push([row.destination, Number(row[country])]);
    });

    let center = getCentroid(country.split('_').join(' '), centroids);
    let max = Math.max(...destinations.map((d) => d[1]));

    // Call the first major data-driven function
    displayEmigration(destinations, center, max, centroids);
  });
}

// Gathering immigration data
function getImmigration(data, country, centroids) {
  data.then((data) => {
    let immigration;
    data.forEach((row) => {
      if (row.destination == country) {
        immigration = Object.entries(row);
      }
    });
    let center = getCentroid(country.split('_').join(' '), centroids);
    immigration.shift();

    // Call the second major data-driven function
    displayImmigration(immigration, center);
  });
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
