// Openlayers
// https://openlayers.org/
import 'ol/ol.css';
import {Map, View} from 'ol';
import TopoJSON from 'ol/format/TopoJSON';
import GeoJSON from 'ol/format/GeoJSON';
import {Fill, Stroke, Style, Text} from 'ol/style';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import {Vector as VectorSource, XYZ, WMTS} from "ol/source"
import {fromLonLat, get as getProjection} from "ol/proj";
import {getWidth} from 'ol/extent';
import {defaults as defaultControls, ScaleLine} from "ol/control.js";
import {inAndOut} from 'ol/easing';


// showdown - Markdown to HTML converter
// https://github.com/showdownjs/showdown
const showdown  = require('showdown'),
      converter = new showdown.Converter();





/*=============================
=            Setup            =
==============================*/

/**
 * 1 - List of administrative vector layers
 */

// List of administrative vector layers
const layerList = [
  {
    id: "bv", 
    label: "Bassins versants", 
    jsonName: "bv_web_topo.json"
  },
  {
    id: "epci", 
    label: "Communautés de communes", 
    jsonName: "epci_web_topo.json"
  },
  {
    id: "communes", 
    label: "Communes", 
    jsonName: "communes_web_topo.json"
  }
];


// Populate administrative vector layers selector
const scaleSwitch = document.getElementById("scaleSwitch");

for (const layer of layerList) {
  const option = document.createElement("option");
  option.value = layer.id;
  option.text = layer.label;
  scaleSwitch.appendChild(option);
};


/*=====  End of Setup  ======*/





/*========================================
=            Basic maps setup            =
=========================================*/


/**
 * 1 - Basemaps layers
 * 2 - Departement 35 layers
 * 3 - View and maps
 */


/*----------  Base maps  ---------*/


// ESRI basemap
// Topo
const EsriWorldTopo = new TileLayer({
  source: new XYZ({
    attributions: "Tiles © <a href='https://services.arcgisonline.com/ArcGIS/" +
        "rest/services/World_Topo_Map/MapServer'>ArcGIS</a>",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/" +
        "World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
  }),
  preload: Infinity,
  zIndex: 0,
  layerLabel: "EsriWorldTopo"
});


// Imagery
const EsriWorldImagery = new TileLayer({
  source: new XYZ({
    attributions: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed," + 
                  " USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN," + 
                  " IGP, UPR-EGP, and the GIS User Community",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/" +
        "World_Imagery/MapServer/tile/{z}/{y}/{x}"
  }),
  preload: Infinity,
  zIndex: 0,
  layerLabel: "EsriWorldImagery"
});


// OpenStreetMap
// OSM France
const osmFr = new TileLayer({
  source: new XYZ({
    attributions: "&copy; Openstreetmap France | &copy; " + 
                  "<a href='https://www.openstreetmap.org/copyright'>" + 
                  "OpenStreetMap</a> contributors",
    url: "https://{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"

  }),
  preload: Infinity,
  zIndex: 0,
  layerLabel: "osmFr"
});


// IGN 
const resolutions = [];
const matrixIds = [];
const proj3857 = getProjection('EPSG:3857');
const maxResolution = getWidth(proj3857.getExtent()) / 256;

for (let i = 0; i < 18; i++) {
  matrixIds[i] = i.toString();
  resolutions[i] = maxResolution / Math.pow(2, i);
}

const tileGrid = new WMTSTileGrid({
  origin: [-20037508, 20037508],
  resolutions: resolutions,
  matrixIds: matrixIds,
});

// For more information about the IGN API key see
// https://geoservices.ign.fr/documentation/donnees-ressources-wmts.html

const ignSource = new WMTS({
  url: 'https://wxs.ign.fr/pratique/geoportail/wmts',
  layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
  matrixSet: 'PM',
  format: 'image/jpeg',
  projection: 'EPSG:3857',
  tileGrid: tileGrid,
  style: 'normal',
  attributions:
    '<a href="http://www.ign.fr" target="_blank">' +
    '<img src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'' +
    'information géographique et forestière" alt="IGN"></a>',
});

var ign = new TileLayer({
  source: ignSource,
  zIndex: 0,
  layerLabel: "ign"
});  

// List of base maps layers
const baseLayers = [EsriWorldTopo, osmFr, EsriWorldImagery, ign];
  

/*----------  Ol map setup  ----------*/

// Center of the map (convert from longLat to Mercator)
const centerLonLat = [-1.6, 48.1];
const centerWebMercator = fromLonLat(centerLonLat);

// View for the main map
const view = new View({ 
  center: centerWebMercator, 
  zoom: 9,
  minZoom: 3 
});

//  Additional controls
const scaleLineControl = new ScaleLine();

// Map
const map = new Map({ 
  layers: baseLayers, 
  target: "map", 
  view: view,
  controls: defaultControls().extend([
    scaleLineControl
  ])
}); 



// /*----------  Base maps switch  ----------*/

const baseMapBtn = document.getElementById("baseMapBtn");
const baseMapSwitchDiv = document.getElementById("baseMapSwitchDiv");
const baseMapSwitch = document.getElementById("baseMapSwitch");

// Bind select DOM to layers visibility
const baseLayersOnChange = () => {
  baseLayers.forEach(layer => layer.setVisible(layer.get('layerLabel') == baseMapSwitch.value))
};
baseLayersOnChange();

// Show or hide basemap switch
baseMapBtn.addEventListener("click", () => {
  baseMapSwitchDiv.classList.toggle("hidden");
});

// Change basemap layer
baseMapSwitchDiv.addEventListener("change", () => {
  baseLayersOnChange();
  baseMapSwitchDiv.classList.add("hidden");
});




/*----------  Layers of departement 35  ----------*/

// Style of departement 35 layer
// Style with 2 strokes
const dep35StyleShadow = new Style({
  stroke: new Stroke({
    // color: [0, 0, 127, 0.15],
    color: "rgba(36, 128, 69, 0.15)",
    width: 10
  }),
  zIndex: 1
});

const dep35Style = new Style({
  stroke: new Stroke({
    color: "rgba(36, 128, 69, 0.8)",
    width: 3,
  }),
  zIndex: 2
});


// Create layer of departement 35
const dep35Vector = new VectorLayer({
  source: new VectorSource({
    url: "data/topojson/dep35_web_topo.json",
    format: new GeoJSON(),
    overlaps: false,
  }),
  style: [dep35StyleShadow, dep35Style],
  zIndex: 100
});


// Add departement 35 layer to the map
map.addLayer(dep35Vector);


// Bind dep. 35 visibility to checkbox
const departCheck = document.getElementById("departCheck");

departCheck.addEventListener("change", () =>  {
  dep35Vector.setVisible(departCheck.checked)
});



/*=====  End of Maps setup  ======*/





/*=======================================
=            Thematic layers            =
========================================*/



/*----------  OL Vector Style  ----------*/


// Fill color according to feature prperties
const getColor = (feature) => {
  if (feature.get("actions")) {
    return "rgba(242, 217, 116, 0.4)";
  } else {
    return "rgba(255, 255, 255, 0.2)";
  };
};

// Default style function of feature properties
const defaultStyle = (feature) => {
  return new Style({
    fill: new Fill({
      color: getColor(feature),
    }),
    stroke: new Stroke({
      color: "rgba(90, 90, 90, 0.8)",
      width: 2,
    }),
    text: new Text({
      text: feature.get("nom"),
      font: "12px 'Segoe UI',sans-serif",
      fill: new Fill({
        color: '#000',
      }),
      stroke: new Stroke({
        color: "rgba(255, 255, 255, 0.5)",
        width: 2.5,
      }),
    }),
  });
}



// Style for selected territory
const featureSelectStyle = new Style({
  stroke: new Stroke({
    color: "rgba(204, 93, 36, 0.9)",
    width: 5
  })
});


/*----------  Add vector  ----------*/

// Get info DOM
const infoLayerName = document.getElementById("infoLayerName");
const infoLayerActions = document.getElementById("infoLayerActions");
const infoLayerfiche_bio = document.getElementById("infoLayerfiche_bio");
const infoLayerCarto_bio = document.getElementById("infoLayerCarto_bio");
const defaultInfo = document.getElementById("defaultInfo");

// Container for feature selected
let featureSelected;

// Create vector layers for all entries of layer list
for (const layer of layerList) {
  // Create data url
  const url = `/data/topojson/${layer.jsonName}`;
  // Create layer
  layer.vectorLayer = new VectorLayer({
    source: new VectorSource({
      url: url,
      format: new TopoJSON(),
      overlaps: false,
    }),
    style: defaultStyle
  });
};

// Create vector layer for feature selected
const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: featureSelectStyle
});


/*----------  Vector layer switch  ----------*/

// Set the selected vector on swith layer on the map
const layerVectorChange = () => {
  for (const layer of layerList) {
    if (layer.id == scaleSwitch.value) {
      map.addLayer(layer.vectorLayer);
    } else {
      map.removeLayer(layer.vectorLayer);
    }
  };
};

// Display default layer
layerVectorChange();

// Bind scale switch to map layers
scaleSwitch.addEventListener("change", () => {
  // Clear vector selected source
  featureOverlay.getSource().clear();
  // Clear info
  defaultInfo.classList.remove("hidden");
  infoLayerName.innerHTML = "&nbsp;";
  infoLayerActions.innerHTML = "&nbsp;";
  infoLayerfiche_bio.style.display = "none"
  infoLayerCarto_bio.style.display = "none";
  // Display layer selected
  layerVectorChange();
});



/*----------  Map interactions  ----------*/
 

const displayFeatureInfo = (pixel) => {

  // Get features at click coordinates (pixel)
  const features = map.getFeaturesAtPixel(pixel);

  // Extract the first feature
  const feature = features.length ? features[0] : undefined;


  if (feature) {

    // Hide default text in info panel
    defaultInfo.classList.add("hidden");

    // Add feature info to panel

    // Nom of features
    infoLayerName.innerHTML = feature.get("nom");

    // GAB35 actions
    // Convert description from md to html
    const actions = feature.get("actions");
    if (actions) {
      const html = converter.makeHtml(feature.get("actions"));
      infoLayerActions.innerHTML = html;
    } else {
      infoLayerActions.innerHTML = "&nbsp;";
    };

    // GAB 35 fiche bio
    if (feature.get("fiche_bio")) {
      infoLayerfiche_bio.style.display = "block"
      infoLayerfiche_bio.href = feature.get("fiche_bio");
    } else {
      infoLayerfiche_bio.style.display = "none"
    };

    // GAB 35 carto bio
    if (feature.get("carto_bio")) {
      infoLayerCarto_bio.style.display = "block"
      infoLayerCarto_bio.href = feature.get("carto_bio");
    } else {
      infoLayerCarto_bio.style.display = "none"
    };



    // Style select feature
    if (feature !== featureSelected) {
      if (featureSelected) {
        featureOverlay.getSource().clear();
      };
      featureOverlay.getSource().addFeature(feature);
      featureSelected = feature;
    };

    // Fit view to selected feature
    view.fit(feature.getGeometry(), {
      padding: [100, 25, 25, 100],
      duration: 600,
      easing: inAndOut
    });

  } else {
    defaultInfo.classList.remove("hidden");
    infoLayerName.innerHTML = "&nbsp;";
    infoLayerActions.innerHTML = "&nbsp;";
    infoLayerfiche_bio.style.display = "none";
    infoLayerCarto_bio.style.display = "none";
    featureOverlay.getSource().clear();

  };

};
  

// Add event to map
map.on("click", (evt) => {
  displayFeatureInfo(evt.pixel);
});