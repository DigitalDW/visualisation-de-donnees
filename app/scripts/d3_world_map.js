const height = 800;
const svg = d3.select('body').append('svg')
  .attr('width', "100%").attr('height', height);
  
const projection = d3.geoNaturalEarth1().scale(250).translate([700, 425]);
const pathGenerator = d3.geoPath().projection(projection);

d3.json('../../data/map/world_map.json')
  .then(data => {
    let features = data.features;
    
    let centroids = [];
    features.forEach(f => {
      let centroid = pathGenerator.centroid(f)
      centroids.push([centroid[0], centroid[1], f.properties.name]);
    });

    // Create map
    const paths = svg.selectAll('path').data(features)
    
    const tip = d3.tip()
      .attr('class', 'd3-tip')
      .html(d => `<span> ${d.properties.name} </span>`)

    paths.enter().append('path')
      .attr('d', pathGenerator)
      .call(tip)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .on('click', (event) => {
        let country = event.properties.name.split(" ").join("_")
        let csv_data = getData();
        csv_data.then(data => {
          let destinations = [];
          data.forEach(element => {
            destinations.push([element.destination, Number(element[country])])
          });

          let center = getCentroid(country.split("_").join(" "), centroids)
          let max = Math.max(...destinations.map(d => d[1]))
          
          createLines(destinations, center, max, centroids)
        });
      })
  })

function createLines(dest, center, max, centroids) {
  svg.selectAll('.arrow').remove()

  let strokes = []
  dest.forEach(e => {
    strokes.push([drawPath(d3.path(), center, getCentroid(e[0].split("_").join(" "), centroids)), e[0]])
  })

  svg.selectAll('.arrow').data(dest).enter()
    .append('path')
    .attr('class', 'arrow')
    .attr('id', (d, i) => `line${i}`)
    .attr('d', d => {
      if(d[1] > 0) {
        return strokes[dest.indexOf(d)][0]
      }
    })
    .style('stroke', (d, i) => `hsla(${i}, 100%, 50%, .33)`)
    .style('opacity', "0")
  
  d3.selectAll('.arrow').each((d, i) => {
    let totalLength = d3.select("#line" + i).node().getTotalLength();
    if(totalLength > 0) {
      d3.selectAll("#line" + i).attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .style('opacity', "1")
        .transition(d3.easeLinear)
          .duration(500)
          .delay(5 * i)
          .attr("stroke-dashoffset", 0)
          .style("stroke-width",3)
    }
  })

  const tip = d3.tip()
    .attr('class', 'd3-tip')
    .html((d, i) => `
      <span style="color: hsla(${i}, 100%, 50%, .33)"> 
        ${d[0].split("_").join(" ")} 
      </span> : ${d[1]}`
    )
    .offset([-12, 0])

  svg.selectAll('.data').remove()

  svg.selectAll('.data').data(dest).enter().append('circle')
    .attr('class', 'data')
    .attr('cx', d => getCentroid(d[0].split("_").join(" "), centroids)[0])
    .attr('cy', d => getCentroid(d[0].split("_").join(" "), centroids)[1])
    .attr('fill', (d, i) => `hsla(${i}, 100%, 50%, .33)`)
    .attr('r', 0)
    .call(tip)
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
    .transition()
      .duration(1000)
      .delay((d, i) => 500 + 5 * i)
      .attr('r', d => (d[1] > 0) ? (d[1] / max * 100 / 2 + 3) : 0)
}

function getCentroid(co, ce) {
  let center;
  ce.forEach(t => {
    if(t.includes(co)) {
      center = t
    }
  });
  return center
}

function getData() {
  return d3.csv("../../data/CSV/migration_2015.csv")
}

function drawPath(path, origin, end) {
  path.moveTo(origin[0], origin[1]);
  path.lineTo(end[0], end[1]);
  path.closePath();
  return path
}