/* eslint-disable no-undef */
const body = d3.select('body');

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

const height = 650;
const svg = body.append('svg').attr('width', '100%').attr('height', height);

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

d3.selection.prototype.moveToBack = function () {
  return this.each(function () {
    let firstChild = this.parentNode.firstChild;
    if (firstChild) {
      this.parentNode.insertBefore(this, firstChild);
    }
  });
};

const projection = d3.geoNaturalEarth1().scale(250).translate([700, 375]);
const pathGenerator = d3.geoPath().projection(projection);

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

d3.json('../../data/map/world_map.json').then((data) => {
  let features = data.features;

  let centroids = [];
  features.forEach((f) => {
    let centroid = pathGenerator.centroid(f);
    centroids.push([centroid[0], centroid[1], f.properties.name]);
  });

  // Create map
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
      let csv_data = getData();
      const country = clicked.properties.name.split(' ').join('_');
      svg.select('.legend').style('visibility', 'visible');
      getEmigration(csv_data, country, centroids);
      getImmigration(csv_data, country, centroids);
    });
});

function displayEmigration(dest, origin, max, centroids) {
  svg.selectAll('.emigration-line').remove();

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

  svg.selectAll('.emigration-data').remove();

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
    .attr('r', (d) => (d[1] > 0 ? ((d[1] / max) * 100) / 2 + 3 : 0));
}

function displayImmigration(immigration, origin) {
  let displayedImmigration = '';
  let total = 0;

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

  const immigrationTip = d3
    .tip()
    .attr('class', 'd3-tip')
    .offset([-12, 0])
    .html(
      () =>
        `Total immigration : <span style="color: hsla(0, 100%, 50%, .75);">${total}</span>`
    );

  svg.selectAll('.immigration-data').remove();

  svg
    .append('circle')
    .attr('class', 'immigration-data')
    .attr('cx', origin[0])
    .attr('cy', origin[1])
    .attr('r', 0)
    .attr('fill', 'hsla(0, 0%, 0%, .0)')
    .call(immigrationTip)
    .on('mouseover', immigrationTip.show)
    .on('mouseout', immigrationTip.hide)
    .on('click', () =>
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

function getEmigration(data, country, centroids) {
  data.then((data) => {
    let destinations = [];
    data.forEach((row) => {
      destinations.push([row.destination, Number(row[country])]);
    });

    let center = getCentroid(country.split('_').join(' '), centroids);
    let max = Math.max(...destinations.map((d) => d[1]));

    displayEmigration(destinations, center, max, centroids);
  });
}

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

    displayImmigration(immigration, center);
  });
}

function getCentroid(co, ce) {
  let center;
  ce.forEach((t) => {
    if (t.includes(co)) {
      center = t;
    }
  });
  return center;
}

function getData() {
  return d3.csv('../../data/CSV/migration_2015.csv');
}

function drawPath(path, origin, end) {
  path.moveTo(origin[0], origin[1]);
  path.lineTo(end[0], end[1]);
  path.closePath();
  return path;
}
