//d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 9])
    .on("zoom", move);


var width = document.getElementById('container').offsetWidth;
var height = width / 2;

var topo,projection,path,svg,g;
var asylum = {};

//var graticule = d3.geo.graticule();

var tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");

color = ["#D4B9DA","#C994C7","#DF65B0","#DD1C77","#980043"];
var quantize = d3.scale.quantize()
    .domain([0, 9000])
    .range(d3.range(5).map(function(i) { return color[i] }));
    
setup(width,height);

function setup(width,height){
  projection = d3.geo.mercator()
    .translate([(width/2), (height/2)])
    .scale( width / 2 / Math.PI);

  path = d3.geo.path().projection(projection);

  svg = d3.select("#container").append("svg")
      .attr("width", width)
      .attr("height", height)
      //.call(zoom)
      .on("click", click)
      .append("g");

  g = svg.append("g");

}

queue().defer(d3.json, "data/world-topo-min.json")
	.defer(d3.csv, "data/dutch.csv")
    .await(ready);

function ready(error,world,asylumRequests){
	var countries = topojson.feature(world, world.objects.countries).features;
    topo = countries;
    
    //load csv and build json
    for (var i = 0; i < asylumRequests.length; i++) {
        var obj = asylumRequests[i];
        //console.log(obj);
        if(asylum[obj["Country"]]== null){
        	 tmp ={};
        	 //TODO : remove later done to simplify json building
        	 tmp['Citizenship'] = obj['Citizenship'];
        	 tmp[2007] = {'Total':0,'M':{1:0,2:0},F:{1:0,2:0}};
			 tmp[2008] = {'Total':0,'M':{1:0,2:0},F:{1:0,2:0}};
			 tmp[2009] = {'Total':0,'M':{1:0,2:0},F:{1:0,2:0}};
			 tmp[2010] = {'Total':0,'M':{1:0,2:0},F:{1:0,2:0}};
			 tmp[2011] = {'Total':0,'M':{1:0,2:0},F:{1:0,2:0}};
			 tmp[2012] = {'Total':0,'M':{1:0,2:0},F:{1:0,2:0}};
			 tmp[2013] = {'Total':0,'M':{1:0,2:0},F:{1:0,2:0}};
			 tmp[2014] = {'Total':0,'M':{1:0,2:0},F:{1:0,2:0}};
        	 tmp[obj['Periods']]['Total'] = +obj['number'];  
        	 tmp[obj['Periods']][obj['Sex']][obj['Age']] =  +obj['number'];  	
        	 //console.log(JSON.stringify(tmp));
        	 asylum[obj["Country"]]  = tmp;	
        	//var tmp = {'Citizenship' : obj['Citizenship'], obj['Periods'] : { 'Total': obj['numbers'], obj['Sex'] : { obj['Age'] : obj['numbers'] }}};
        	//asylum[obj["Country"]] = {'Citizenship' : obj['Citizenship'], obj['Periods'] :{ Total:obj['numbers'], obj['Sex']:{ obj['Age']:obj['numbers'] }}};       	
        }
       else{
         tmp[obj['Periods']]['Total'] += +obj['number']; 
         tmp[obj['Periods']][obj['Sex']][obj['Age']] +=  +obj['number']; 
       } 
    }   
    //console.log(JSON.stringify(asylum));   
    draw(topo);
}
    
/*d3.json("data/world-topo-min.json", function(error, world) {
  var countries = topojson.feature(world, world.objects.countries).features;
  topo = countries;
  draw(topo);

});*/


function draw(topo) {

  /*svg.append("path")
     .datum(graticule)
     .attr("class", "graticule")
     .attr("d", path);


  g.append("path")
   .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
   .attr("class", "equator")
   .attr("d", path);*/


  var country = g.selectAll(".country").data(topo);
  console.log(country);
  country.enter().insert("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("id", function(d,i) { return d.id; })
      .attr("title", function(d,i) { return d.properties.name; })
      .style("fill", function(d, i) { if(asylum[d.properties.name]){
      								    console.log(asylum[d.properties.name]['2007']['Total']);
      								  	return quantize(asylum[d.properties.name]['2007']['Total']);
      								  } 
      								  return "#DDE7EB"; });

  //offsets for tooltips
  var offsetL = document.getElementById('container').offsetLeft+20;
  var offsetT = document.getElementById('container').offsetTop+10;

  //tooltips
  country
    .on("mousemove", function(d,i) {

      var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );

      tooltip.classed("hidden", false)
             .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
             .html(d.properties.name);

      })
      .on("mouseout",  function(d,i) {
        tooltip.classed("hidden", true);
      }); 


  //EXAMPLE: adding some capitals from external CSV file
  /*d3.csv("data/country-capitals.csv", function(err, capitals) {

    capitals.forEach(function(i){
      addpoint(i.CapitalLongitude, i.CapitalLatitude, i.CapitalName );
    });

  });*/

}


function redraw() {
  width = document.getElementById('container').offsetWidth;
  height = width / 2;
  d3.select('svg').remove();
  setup(width,height);
  draw(topo);
}


function move() {

  var t = d3.event.translate;
  var s = d3.event.scale; 
  zscale = s;
  var h = height/4;


  t[0] = Math.min(
    (width/height)  * (s - 1), 
    Math.max( width * (1 - s), t[0] )
  );

  t[1] = Math.min(
    h * (s - 1) + h * s, 
    Math.max(height  * (1 - s) - h * s, t[1])
  );

  zoom.translate(t);
  g.attr("transform", "translate(" + t + ")scale(" + s + ")");

  //adjust the country hover stroke width based on zoom level
  d3.selectAll(".country").style("stroke-width", 1.5 / s);

}



/*var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 200);
}*/


//geo translation on mouse click in map
function click() {
  //var latlon = projection.invert(d3.mouse(this));
  alert("clicked");
  //console.log(latlon);
}


//function to add points and text to the map (used in plotting capitals)
/*function addpoint(lat,lon,text) {

  var gpoint = g.append("g").attr("class", "gpoint");
  var x = projection([lat,lon])[0];
  var y = projection([lat,lon])[1];

  gpoint.append("svg:circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("class","point")
        .attr("r", 1.5);

  //conditional in case a point has no associated text
  if(text.length>0){

    gpoint.append("text")
          .attr("x", x+2)
          .attr("y", y+2)
          .attr("class","text")
          .text(text);
  }

}*/
