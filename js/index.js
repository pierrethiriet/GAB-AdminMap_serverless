import 'ol/ol.css';
import {Map, View} from 'ol';
import TopoJSON from 'ol/format/TopoJSON';
import {Fill, Stroke, Style, Text} from 'ol/style';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource, XYZ} from "ol/source"
import {fromLonLat} from "ol/proj";
import {defaults as defaultControls, ScaleLine} from "ol/control.js";
import {inAndOut} from 'ol/easing';





/*=============================
=            Setup            =
==============================*/


// List of layers
const layerList = [
  {
    id: "bv", 
    label: "Bassins versants", 
    jsonName: "bv_web_topo.json", 
    pgTableCol: `id, bv2018_id, bv2018_lb AS name, surf_cart_, etiquette, dep, name_join, maj_dt, couleur`
  },
  {
    id: "pays", 
    label: "Pays", 
    jsonName: "pays_web_topo.json", 
    pgTableCol: `frab_id AS id, insee_dep, nom_reg, insee_reg, link, nom_pays AS name, nom_dep`
  },
  {
    id: "epci", 
    label: "Communautés de communes", 
    jsonName: "epci_web_topo.json", 
    pgTableCol: `id_epci AS id, nom_epci AS name, nature_epc, type_epci, siren_epci AS siren`},
  {
    id: "communes", 
    label: "Communes", 
    jsonName: "communes_web_topo.json", 
    pgTableCol: `id, name, type`
  }
];


// Setup option of scale list
const scaleSwitch = document.getElementById("scaleSwitch");

for (const layer of layerList) {
  const option = document.createElement("option");
  option.value = layer.id;
  option.text = layer.label;
  scaleSwitch.appendChild(option);
};


/*=====  End of Setup  ======*/





/*==================================
=            Maps setup            =
===================================*/


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


// List of base layers
const baseLayers = [EsriWorldTopo, osmFr, EsriWorldImagery];
  

/*----------  Ol map  ----------*/

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
  if (baseMapSwitchDiv.style.display == "block") {
    baseMapSwitchDiv.style.display = "none"
  } else {
    baseMapSwitchDiv.style.display = "block"
  }
});

// Change basemap layer
baseMapSwitchDiv.addEventListener("change", () => {
  baseLayersOnChange();
  baseMapSwitchDiv.style.display = "none";
});


/*=====  End of Maps setup  ======*/





/*=======================================
=            Thematic layers            =
========================================*/



/*----------  OL Vector Style  ----------*/

// Default style
const defaultStyle = new Style({
  fill: new Fill({
    color: "rgba(255, 255, 255, 0.5)",
  }),
  stroke: new Stroke({
    color: "rgba(90, 90, 90, 0.8)",
    width: 2,
  }),
  text: new Text({
    font: "12px 'Segoe UI',sans-serif",
    fill: new Fill({
      color: '#000',
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 3,
    }),
  }),
});


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
const infoLayerDescription = document.getElementById("infoLayerDescription");
const infoLayerDataLink = document.getElementById("infoLayerDataLink");

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
    // style: style,
    style: function (feature) {
      defaultStyle.getText().setText(feature.get("nom"));
      return defaultStyle;
    },
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

scaleSwitch.addEventListener("change", () => {
  // Clear vector selected source
  featureOverlay.getSource().clear();
  // Clear info
  infoLayerName.innerHTML = "&nbsp;";
  infoLayerDescription.innerHTML = "&nbsp;";
  infoLayerDataLink.innerHTML = "&nbsp;";
  // Display layer selected
  layerVectorChange();
});



/*----------  Map interactions  ----------*/
 

const displayFeatureInfo = (pixel) => {
  // Get features at click coordinates (pixel)
  const features = map.getFeaturesAtPixel(pixel);
  // Extract first features
  const feature = features.length ? features[0] : undefined;


  if (feature) {
    // Add feature info to panel
    infoLayerName.innerHTML = feature.get("nom");
    infoLayerDescription.innerHTML = feature.get("description");
    if (feature.get("pdf") != "") {
      const pdfUrl = `<a href="data/pdf/${feature.get("pdf")}.pdf" download>
                          <i class="fas fa-file-download"></i>
                      </a>`;
      infoLayerDataLink.innerHTML = pdfUrl;
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
    infoLayerName.innerHTML = "&nbsp;";
    infoLayerDescription.innerHTML = "&nbsp;";
    infoLayerDataLink.innerHTML = "&nbsp;";
    featureOverlay.getSource().clear();

  };
};
  

// Add event to map
map.on('click', (evt) => {
  displayFeatureInfo(evt.pixel);
});