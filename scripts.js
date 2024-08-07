import GeoTIFF from "ol/source/GeoTIFF.js";
import Map from "ol/Map.js";
import TileLayer from "ol/layer/WebGLTile.js";
// import VectorSource from "ol/source/Vector.js";
import VectorLayer from "ol/layer/Vector.js";
import OSM from "ol/source/OSM.js";
import { parseShp, parseDbf } from "shpjs/dist/shp";
// import shp from "shpjs";
import GeoJSON from "ol/format/GeoJSON";
import View from "ol/View.js";
import { fromLonLat, toLonLat } from "ol/proj.js";
import { Fill, Stroke, Style, Circle as CircleStyle, Icon } from "ol/style.js";
import Overlay from "ol/Overlay.js";
import { Draw, Select, Interaction } from "ol/interaction.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import { getLength, getArea } from "ol/sphere.js";
import { XYZ } from "ol/source";
import VectorSource from "ol/source/Vector";
import { get as getProjection } from "ol/proj";
import proj4 from "proj4";
import { transform } from "ol/proj";
import { register } from "ol/proj/proj4";
import KML from "ol/format/KML";
import "./styles.css";
import * as shapefile from "shapefile";
import JSZip from "jszip";
const orthoLayer1 = new TileLayer({
  source: new XYZ({
    url: "https://gisdemo.s3.ap-south-1.amazonaws.com/mahalaxmicog.tif",
    // projection: "EPSG:32643",
  }),
});

// Do the same for orthoLayer2 and orthoLayer3

const orthoLayer2 = new TileLayer({
  source: new XYZ({
    url: `https://gisdemo.s3.ap-south-1.amazonaws.com/mahalaxmicog.tif`,
  }),
});

const orthoLayer3 = new TileLayer({
  source: new XYZ({
    url: `https://gisdemo.s3.ap-south-1.amazonaws.com/mahalaxmicog.tif`,
  }),
});

const mapLayer = new TileLayer({
  source: new OSM({
    // url: "https://matomo.openstreetmap.org/matomo.php?idgoal=5&idsite=1&rec=1&r=159427&h=13&m=57&s=11&url=https%3A%2F%2Fwww.openstreetmap.org%2F%23map%3D3%2F12.73%2F74.36&_id=5a7d08b0f70736f5&_idn=0&send_image=0&_refts=1720081566&_ref=https%3A%2F%2Fwww.google.com%2F&pv_id=bfbOb5&uadata=%7B%22fullVersionList%22%3A%5B%7B%22brand%22%3A%22Not%2FA)Brand%22%2C%22version%22%3A%228.0.0.0%22%7D%2C%7B%22brand%22%3A%22Chromium%22%2C%22version%22%3A%22126.0.6478.127%22%7D%2C%7B%22brand%22%3A%22Google%20Chrome%22%2C%22version%22%3A%22126.0.6478.127%22%7D%5D%2C%22mobile%22%3Afalse%2C%22model%22%3A%22%22%2C%22platform%22%3A%22Windows%22%2C%22platformVersion%22%3A%2215.0.0%22%7D&pdf=1&qt=0&realp=0&wma=0&fla=0&java=0&ag=0&cookie=1&res=1366x768",
  }),
  projection: "EPSG:3857", // OSM uses Web Mercator
});
let lat = 72.82475665277923;
let long = 19.00147500822439;
proj4.defs("EPSG:32643", "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs");
register(proj4);
// GeoTIFF source
const geotiffSource = new GeoTIFF({
  sources: [
    {
      url: "https://gisdemo.s3.ap-south-1.amazonaws.com/mahalaxmicog.tif",
      projection: "EPSG:32643",
    },
  ],
});

// GeoTIFF layer
const geotiffLayer = new TileLayer({
  source: geotiffSource,
});
// Add the marker layer to the map
const utmProjection = getProjection("EPSG:32643");
const map = new Map({
  target: "map",
  layers: [mapLayer, geotiffLayer, orthoLayer1],
  view: new View({
    projection: utmProjection,
    center: [0, 0],
    zoom: 11.5,
  }),
});
// Once the source is loaded, we can get its extent and fit the view to it
geotiffSource.getView().then((viewOptions) => {
  const extent = viewOptions.extent;
  const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
  map.getView().setCenter(center);
  map.getView().fit(extent);
});
const latLongElement = document.getElementById("lat-long");
const latLongClickElement = document.getElementById("lat-long-click");
map.on("pointermove", (e) => {
  if (e.dragging) {
    return;
  }
  const coords = map.getEventCoordinate(e.originalEvent);
  const lonLat = transform(coords, "EPSG:32643", "EPSG:4326");

  latLongElement.textContent = `Lat: ${lonLat[1]}, Lon: ${lonLat[0]}`;
});
map.on("click", (e) => {
  if (e.dragging) {
    return;
  }
  const coords = map.getEventCoordinate(e.originalEvent);
  const lonLat = transform(coords, "EPSG:32643", "EPSG:4326");
  // map.getView().setCenter(fromLonLat(lonLat));
  latLongClickElement.textContent = `Lat: ${lonLat[1]}, Lon: ${lonLat[0]}`;
});
const source = new VectorSource({
  sources: [
    {
      url: "https://gisdemo.s3.ap-south-1.amazonaws.com/mahalaxmicog.tif",
    },
  ],
});

const vectorLayer = new VectorLayer({
  source: source,

  style: new Style({
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.3)",
    }),
    stroke: new Stroke({
      color: "#ffcc33",
      width: 2,
    }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({
        color: "#ffcc33",
      }),
    }),
  }),
});
map.addLayer(vectorLayer);
// Measurement code
const tooltip = document.createElement("div");
tooltip.className = "tooltip";
const tooltipOverlay = new Overlay({
  element: tooltip,
  offset: [15, 0],
  positioning: "center-left",
});
map.addOverlay(tooltipOverlay);

const drawLine = new Draw({
  source: source,
  type: "LineString",
});

const drawPolygon = new Draw({
  source: source,
  type: "Polygon",
});
const placePin = new Interaction({
  handleEvent: function (e) {
    if (e.type === "click") {
      const coords = map.getEventCoordinate(e.originalEvent);
      addPin(coords);
      return false; // Prevent further handling of the event
    }
    return true;
  },
});
const selectInteraction = new Select({
  layers: [orthoLayer1, orthoLayer2, orthoLayer3], // Specify the layers you want to be selectable
});

let activeInteraction = null;
const cursorBtn = document.getElementById("cursor");
const areaBtn = document.getElementById("areaBtn");
const lineBtn = document.getElementById("lineBtn");
const locateBtn = document.getElementById("locate");
const unitConversion = document.getElementById("unitConversion");
const acresOption = document.getElementById("acres");
const hectaresOption = document.getElementById("hectares");

const interactions = {
  select: selectInteraction,
  line: drawLine,
  polygon: drawPolygon,
  pin: placePin,
};

function setActiveInteraction(newInteraction, activeBtn) {
  map.removeInteraction(activeInteraction);
  map.addInteraction(newInteraction);
  activeInteraction = newInteraction;

  [cursorBtn, areaBtn, lineBtn, locateBtn].forEach((btn) => {
    btn.style.backgroundColor = btn === activeBtn ? "#636363" : "transparent";
  });
}

cursorBtn.addEventListener("click", function () {
  setActiveInteraction(interactions.select, cursorBtn);
  unitConversion.disabled = false;
  acresOption.disabled = true;
  hectaresOption.disabled = true;
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    setActiveInteraction(activeInteraction, null);
  }
});

lineBtn.addEventListener("click", function () {
  setActiveInteraction(interactions.line, lineBtn);
  unitConversion.value = "meters";
  unitConversion.disabled = false;
  acresOption.disabled = true;
  hectaresOption.disabled = true;
});

areaBtn.addEventListener("click", function () {
  setActiveInteraction(interactions.polygon, areaBtn);
  unitConversion.disabled = false;
  acresOption.disabled = false;
  hectaresOption.disabled = false;
});

locateBtn.addEventListener("click", function () {
  setActiveInteraction(interactions.pin, locateBtn);
  unitConversion.disabled = false;
  acresOption.disabled = true;
  hectaresOption.disabled = true;
});

let sketch;
let measureTooltipElement;
let measureTooltip;
selectInteraction.on("select", function (event) {
  if (event.selected.length > 0) {
    const selectedLayer = event.selected[0]; // Assuming only one layer can be selected at a time
    handleLayerSelection(selectedLayer);
  } else {
    // Clear sidebar if no layer is selected
    editOptions.innerHTML = "";
  }
});
selectInteraction.getFeatures().on("add", function (event) {
  event.element.setStyle(selectStyle);
});
drawLine.on("drawstart", function (event) {
  sketch = event.feature;

  // Create a tooltip for the measurement
  measureTooltipElement = document.createElement("div");
  measureTooltipElement.className = "tooltip tooltip-static";
  measureTooltip = new Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: "bottom-center",
  });
  map.addOverlay(measureTooltip);

  // Change tooltip content dynamically
  event.feature.getGeometry().on("change", function (evt) {
    const unit = document.getElementById("unitConversion").value;
    const geom = evt.target;
    const output = formatLength(geom, unit);
    const tooltipCoord = geom.getLastCoordinate();
    tooltipOverlay.setPosition(tooltipCoord);
    tooltip.innerHTML = output;
  });
});

drawPolygon.on("drawstart", function (event) {
  sketch = event.feature;

  // Create a tooltip for the measurement
  measureTooltipElement = document.createElement("div");
  measureTooltipElement.className = "tooltip tooltip-static";
  measureTooltip = new Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: "bottom-center",
  });
  map.addOverlay(measureTooltip);

  // Change tooltip content dynamically
  event.feature.getGeometry().on("change", function (evt) {
    const unit = document.getElementById("unitConversion").value;
    const geom = evt.target;
    const output = formatArea(geom, unit);
    const tooltipCoord = geom.getInteriorPoint().getCoordinates();
    tooltipOverlay.setPosition(tooltipCoord);
    tooltip.innerHTML = output;
  });
});
drawLine.on("drawend", function (event) {
  measureTooltipElement.className = "tooltip tooltip-static";
  measureTooltip.setOffset([0, -7]);
  sketch = null;
  tooltip.innerHTML = "";

  const geom = event.feature.getGeometry();
  const unit = document.getElementById("unitConversion").value;
  const output = formatLength(geom, unit);
  const convertedOutput = convertUnit(output, unit, false);
  const editOptions = document.getElementById("edit-options");

  const measurementsList = document.getElementById("measurements");
  const label = document.getElementById("labelInput").value || "Unnamed";
  const index = measurementsList.children.length;

  // Assign a unique ID to the feature
  const featureID = "feature-" + Date.now();
  event.feature.setId(featureID);

  const listItem = document.createElement("li");
  listItem.setAttribute("id", "li-item" + index);
  listItem.setAttribute("data-feature-id", featureID);

  listItem.innerHTML = `     
    <div class='flex'>
      <i class="fa-solid fa-grip-lines-vertical"></i>
      <input type="checkbox" class="measurement-checkbox" data-index="${index}" checked>
      <div id="sidenav-list-item-r1${index}" style="min-width:200px">
        <span>${label}: ${convertedOutput}</span>
      </div>
    </div>
    <button>
      <i class="fas fa-trash" style="font-size:15px;"></i>
    </button>
  `;

  const checkbox = listItem.querySelector("input[type='checkbox']");
  const deleteBtn = listItem.querySelector("button");
  const sideNavDetails = listItem.querySelector(
    "#sidenav-list-item-r1" + index
  );

  const handleCheckboxChange = () => {
    const feature = source.getFeatureById(featureID);
    feature.setStyle(checkbox.checked ? null : new Style());
  };

  const handleDeleteBtnClick = () => {
    editOptions.innerHTML = "";
    measurementsList.removeChild(listItem);
    const feature = source.getFeatureById(featureID);
    if (feature) {
      source.removeFeature(feature);
    }

    // Update data-index attributes for remaining list items
    const remainingItems = measurementsList.querySelectorAll("li");
    remainingItems.forEach((item, newIndex) => {
      item
        .querySelector("input[type='checkbox']")
        .setAttribute("data-index", newIndex);
      item.setAttribute("value", newIndex);
    });
  };

  const handleListItemClick = () => {
    const allListItems = measurementsList.querySelectorAll("li");
    allListItems.forEach((item) => {
      item.style.backgroundColor = "";
      const featureId = item.getAttribute("data-feature-id");
      const feature = source.getFeatureById(featureId);
      if (feature) {
        const storedStyle = feature.get("storedStyle") || null;
        feature.setStyle(storedStyle);
      }
    });

    listItem.style.backgroundColor = "#636363";

    const feature = source.getFeatureById(featureID);
    if (feature) {
      // feature.set("storedStyle", null);
      const highlightStyle = new Style({
        stroke: new Stroke({
          color: "black",
          width: 3,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: "black",
          }),
        }),
      });
      feature.setStyle(highlightStyle);
    }

    renderEditOptions(label, convertedOutput, geom, featureID);

    // Center the view on the feature without zooming
    const extent = geom.getExtent();
    const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
    map.getView().setCenter(center);
    map.getView().fit(extent);

    if (map.getView().getZoom() < 16) {
      map.getView().setZoom(16);
    }
  };

  const renderEditOptions = (label, convertedOutput, geom, featureID) => {
    editOptions.innerHTML = `
      <div class='close-btn-div'>
        <button class='close-btn' id='close-btn'>
          <i class="fa-solid fa-x"></i>
        </button>
      </div>
      <div class='flex align'>
        <div>
          <label for='name'>Name</label>
          <input type="text" value="${label}" class='edit-name' id='name'>
        </div>
        <div>
          <label for='stroke'>Stroke</label>
          <input id='stroke' type="color" value="#ffcc33" class='edit-stroke'>
        </div>
      </div>
      <br>
      <h3>Measurement: ${convertedOutput}</h3>
      <div class='conversions'>
        <p>meters: ${convertUnit(
          formatLength(geom, "meters"),
          "meters",
          false
        )}</p>
        <p>Kilometers: ${convertUnit(
          formatLength(geom, "kilometers"),
          "kilometers",
          false
        )}</p>
        <p>feet: ${convertUnit(formatLength(geom, "feet"), "feet", false)}</p>
        <p>miles: ${convertUnit(
          formatLength(geom, "miles"),
          "miles",
          false
        )}</p>
      </div>
    `;

    const labelInput = editOptions.querySelector("input[type='text']");
    const strokeColorInput = editOptions.querySelectorAll(
      "input[type='color']"
    )[0];

    const updateFeatureStyle = () => {
      const feature = source.getFeatureById(featureID);
      if (feature) {
        const newStyle = new Style({
          stroke: new Stroke({
            color: strokeColorInput.value,
            width: 2,
          }),
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: strokeColorInput.value,
            }),
          }),
        });
        feature.setStyle(newStyle);
        feature.set("storedStyle", newStyle); // Update the stored style
      }
    };

    labelInput.addEventListener("change", function () {
      listItem.querySelector(
        "span"
      ).textContent = `${this.value}: ${convertedOutput}`;
    });

    strokeColorInput.addEventListener("input", updateFeatureStyle);
    document
      .getElementById("close-btn")
      .addEventListener("click", clearEditOptions);
  };

  const clearEditOptions = () => {
    editOptions.innerHTML = "";
    const allListItems = measurementsList.querySelectorAll("li");
    allListItems.forEach((item) => {
      item.style.backgroundColor = "";
      const featureId = item.getAttribute("data-feature-id");
      const feature = source.getFeatureById(featureId);
      if (feature) {
        const storedStyle = feature.get("storedStyle") || null;
        feature.setStyle(storedStyle);
      }
    });
  };

  checkbox.addEventListener("change", handleCheckboxChange);
  deleteBtn.addEventListener("click", handleDeleteBtnClick);
  sideNavDetails.addEventListener("click", handleListItemClick);

  measurementsList.appendChild(listItem);
  handleListItemClick(); // Automatically open the edit options for the new item
});
drawPolygon.on("drawend", function (event) {
  measureTooltipElement.className = "tooltip tooltip-static";
  measureTooltip.setOffset([0, -7]);
  sketch = null;
  tooltip.innerHTML = "";

  const geom = event.feature.getGeometry();
  const unit = document.getElementById("unitConversion").value;
  const output = formatArea(geom, unit);
  const convertedOutput = convertUnit(output, unit, true);
  const editOptions = document.getElementById("edit-options");

  const measurementsList = document.getElementById("measurements");
  const label = document.getElementById("labelInput").value || "Unnamed";
  const index = measurementsList.children.length;

  // Assign a unique ID to the feature
  const featureID = "feature-" + Date.now();
  event.feature.setId(featureID);

  const listItem = document.createElement("li");
  listItem.setAttribute("id", "li-item" + index);
  listItem.setAttribute("data-feature-id", featureID);

  listItem.innerHTML = `
    <div class='flex'>
      <i class="fa-solid fa-draw-polygon"></i>
      <input type="checkbox" class="measurement-checkbox" data-index="${index}" checked>
      <div id="sidenav-list-item-r1${index}" style="min-width:200px">
        <span>${label}: ${convertedOutput}</span>
      </div>    
    </div>
    <button>
      <i class="fas fa-trash" style="font-size:15px;"></i>
    </button>
  `;

  const checkbox = listItem.querySelector("input[type='checkbox']");
  const deleteBtn = listItem.querySelector("button");
  const sideNavDetails = listItem.querySelector(
    "#sidenav-list-item-r1" + index
  );

  const handleCheckboxChange = () => {
    const feature = source.getFeatureById(featureID);
    feature.setStyle(checkbox.checked ? null : new Style());
  };

  const handleDeleteBtnClick = () => {
    editOptions.innerHTML = "";
    measurementsList.removeChild(listItem);
    const feature = source.getFeatureById(featureID);
    source.removeFeature(feature);

    // Update data-index attributes for remaining list items
    const remainingItems = measurementsList.querySelectorAll("li");
    remainingItems.forEach((item, newIndex) => {
      item
        .querySelector("input[type='checkbox']")
        .setAttribute("data-index", newIndex);
      item.setAttribute("value", newIndex);
    });
  };

  const handleListItemClick = () => {
    const allListItems = measurementsList.querySelectorAll("li");
    allListItems.forEach((item) => {
      item.style.backgroundColor = "";
      const featureId = item.getAttribute("data-feature-id");
      const feature = source.getFeatureById(featureId);
      if (feature) {
        // Use the stored style or null (default) when resetting
        const storedStyle = feature.get("storedStyle") || null;
        feature.setStyle(storedStyle);
      }
    });

    // Change the clicked item's background to green
    listItem.style.backgroundColor = "#636363";

    // Change the feature's style to highlight it
    const feature = source.getFeatureById(featureID);
    if (feature) {
      const highlightStyle = new Style({
        stroke: new Stroke({
          color: "black",
          width: 3,
        }),
        fill: new Fill({
          color: "rgba(0, 255, 0, 0.2)", // Light green fill with 0.2 opacity
        }),
      });
      feature.setStyle(highlightStyle);
    }

    renderEditOptions(label, convertedOutput, geom, featureID);

    // Center the view on the feature without zooming
    const extent = geom.getExtent();
    const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
    map.getView().setCenter(center);
    map.getView().fit(extent);
    if (map.getView().getZoom() < 16) {
      map.getView().setZoom(16);
    }
  };

  const renderEditOptions = (label, convertedOutput, geom, featureID) => {
    editOptions.innerHTML = `
      <div class='close-btn-div'>
        <button class='close-btn' id='close-btn'>
          <i class="fa-solid fa-x"></i>
        </button>
      </div>
      <div class='flex align'>
        <div>
          <label for='name'>Name</label>
          <input type="text" value="${label}" class='edit-name' id='name'>
        </div>
        <div>
          <label for='stroke'>Stroke</label>
          <input id='stroke' type="color" value="#ffcc33" class='edit-stroke'>
        </div>
        <div>
          <label for="fillColor">Fill Color:</label>
          <input type="color" id="fillColor" value="#ffcc33" class='edit-fill'>
        </div>
      </div>
      <div class='opacity-div'>
        <label for="fillOpacity">Fill Opacity:</label>
        <input type="range" id="fillOpacity" min="0" max="1" step="0.01" value="0.2" class='edit-opacity'>
      </div>
      <br>
      <h3>Measurement: ${convertedOutput}</h3>
      <div class='conversions'>
        <p>meters: ${convertUnit(
          formatArea(geom, "meters"),
          "meters",
          true
        )}</p>
        <p>hectares: ${convertUnit(
          formatArea(geom, "hectares"),
          "hectares",
          true
        )}</p>
        <p>acres: ${convertUnit(formatArea(geom, "acres"), "acres", true)}</p>
        <p>square kilometers: ${convertUnit(
          formatArea(geom, "kilometers"),
          "square kilometers",
          true
        )}</p>
      </div>
    `;

    const labelInput = editOptions.querySelector("input[type='text']");
    const strokeColorInput = editOptions.querySelectorAll(
      "input[type='color']"
    )[0];
    const fillColorInput = document.getElementById("fillColor");
    const fillOpacityInput = document.getElementById("fillOpacity");

    const updateFeatureStyle = () => {
      const feature = source.getFeatureById(featureID);
      const fillColor = fillColorInput.value;
      const fillOpacity = fillOpacityInput.value;

      const newStyle = new Style({
        stroke: new Stroke({
          color: strokeColorInput.value,
          width: 2,
        }),
        fill: new Fill({
          color: `rgba(${parseInt(fillColor.slice(1, 3), 16)}, ${parseInt(
            fillColor.slice(3, 5),
            16
          )}, ${parseInt(fillColor.slice(5, 7), 16)}, ${fillOpacity})`,
        }),
      });

      feature.setStyle(newStyle);
      // Store the new style with the feature
      feature.set("storedStyle", newStyle);
    };

    labelInput.addEventListener("change", function () {
      listItem.querySelector(
        "span"
      ).textContent = `${this.value}: ${convertedOutput}`;
    });

    strokeColorInput.addEventListener("input", updateFeatureStyle);
    fillColorInput.addEventListener("input", updateFeatureStyle);
    fillOpacityInput.addEventListener("input", updateFeatureStyle);
    document
      .getElementById("close-btn")
      .addEventListener("click", clearEditOptions);
  };

  const clearEditOptions = () => {
    editOptions.innerHTML = "";
    const allListItems = measurementsList.querySelectorAll("li");
    allListItems.forEach((item) => {
      item.style.backgroundColor = "";
      const featureId = item.getAttribute("data-feature-id");
      const feature = source.getFeatureById(featureId);
      if (feature) {
        // Get the stored style for this feature, or use null to reset to default
        const storedStyle = feature.get("storedStyle") || null;
        feature.setStyle(storedStyle);
      }
    });
  };

  checkbox.addEventListener("change", handleCheckboxChange);
  deleteBtn.addEventListener("click", handleDeleteBtnClick);
  sideNavDetails.addEventListener("click", handleListItemClick);

  measurementsList.appendChild(listItem);
  handleListItemClick(); // Automatically open the edit options for the new item
});

// Event listeners for measurement items in the sidebar
const measurementItems = document.querySelectorAll("#measurements li");
measurementItems.forEach((item, index) => {
  item.addEventListener("click", function () {
    handleMeasurementSelection(index);
  });
});
function formatLength(line, unit) {
  const length = getLength(line);
  let output;
  switch (unit) {
    case "meters":
      output = length.toFixed(2) + " m";
      break;
    case "kilometers":
      output = (length / 1000).toFixed(2) + " km";
      break;
    case "miles":
      output = (length / 1609.34).toFixed(2) + " miles";
      break;
    case "feet":
      output = (length / 0.3048).toFixed(2) + " ft";
      break;
    default:
      output = "Unit not supported";
  }
  return output;
}

function formatArea(polygon, unit) {
  const area = getArea(polygon);
  let output;
  switch (unit) {
    case "meters":
      output = area.toFixed(2) + " m²";
      break;
    case "kilometers":
      output = (area / 1e6).toFixed(2) + " km²";
      break;
    case "miles":
      output = (area / 2.58999e6).toFixed(2) + " mi²";
      break;
    case "feet":
      output = (area * 10.7639).toFixed(2) + " ft²";
      break;
    case "acres":
      output = (area / 4046.86).toFixed(2) + " acres";
      break;
    case "hectares":
      output = (area / 10000).toFixed(2) + " hectares";
      break;
    default:
      output = "Unit not supported";
  }
  return output;
}

function convertUnit(value, unit, isArea) {
  const areaUnits = {
    meters: " m²",
    kilometers: " km²",
    feet: " ft²",
    miles: " mi²",
    acres: " acres",
    hectares: " hectares",
  };

  const lengthUnits = {
    meters: " m",
    kilometers: " km",
    feet: " ft",
    miles: " mi",
    acres: " acres",
    hectares: " hectares",
  };

  const units = isArea ? areaUnits : lengthUnits;
  const unitSuffix = units[unit];

  return unitSuffix ? parseFloat(value) + unitSuffix : value;
}

// Function to handle editing and style updates for selected measurement
function handleMeasurementSelection(index) {
  // Remove active class from all items
  const measurementItems = document.querySelectorAll("#measurements li");
  measurementItems.forEach((item) => {
    item.classList.remove("active");
  });

  // Add active class to the selected item
  measurementItems[index].classList.add("active");

  // Implement editing options for the selected measurement here
  const editOptions = document.getElementById("edit-options");
  editOptions.innerHTML = ""; // Clear previous options

  // Get selected feature
  const selectedFeature = source.getFeatures()[index];

  // Create input for label editing
  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.value = selectedFeature.get("label") || "Unnamed";
  labelInput.addEventListener("input", function () {
    selectedFeature.set("label", this.value);
  });

  // Create color picker for stroke color editing
  const strokeColorInput = document.createElement("input");
  strokeColorInput.type = "color";
  strokeColorInput.value = selectedFeature.getStyle().getStroke().getColor();
  strokeColorInput.addEventListener("input", function () {
    const color = this.value;
    selectedFeature.setStyle(
      new Style({
        stroke: new Stroke({
          color: color,
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: color,
          }),
        }),
      })
    );
  });

  // Create color picker for fill color editing (only for polygons)
  if (selectedFeature.getGeometry().getType() === "Polygon") {
    const fillColorInput = document.createElement("input");
    fillColorInput.type = "color";
    fillColorInput.value = selectedFeature.getStyle().getFill().getColor();
    fillColorInput.addEventListener("input", function () {
      const color = this.value;
      selectedFeature.setStyle(
        new Style({
          stroke: new Stroke({
            color: strokeColorInput.value,
            width: 2,
          }),
          fill: new Fill({
            color: color,
          }),
        })
      );
    });
    editOptions.appendChild(document.createTextNode("Fill Color: "));
    editOptions.appendChild(fillColorInput);
    editOptions.appendChild(document.createElement("br"));
  }

  // Append label input and stroke color picker to edit options
  editOptions.appendChild(document.createTextNode("Label: "));
  editOptions.appendChild(labelInput);
  editOptions.appendChild(document.createElement("br"));
  editOptions.appendChild(document.createTextNode("Stroke Color: "));
  editOptions.appendChild(strokeColorInput);

  // Show the edit options sidebar
  editOptions.style.display = "block";
}

// map
const mapElement = document.getElementById("map");
// side nav 1
const sideNavOne = document.getElementsByClassName("sidenav1")[0];
const collapseLeft = document.getElementById("collapse-left");
// side nav 2
const sideNavTwo = document.getElementsByClassName("sidenav2")[0];
const collapseRight = document.getElementById("collapse-right");
//top nav
const secondNav = document.getElementById("secondnav");
const collapseTop = document.getElementById("collapse-top");
// tooltop
const tooltipElement = document.getElementsByClassName("tool-tip")[0];

collapseLeft.addEventListener("click", () => {
  if (sideNavOne.style.display == "none") {
    sideNavOne.style.display = "block";
    collapseLeft.style.left = "25%";
    collapseLeft.innerHTML = "<";
  } else {
    sideNavOne.style.display = "none";
    collapseLeft.style.left = "0px";
    collapseLeft.innerHTML = ">";
  }
});
collapseRight.addEventListener("click", () => {
  if (sideNavTwo.style.display == "none") {
    sideNavTwo.style.display = "block";
    collapseRight.style.right = "25%";
    collapseRight.innerHTML = ">";
    tooltipElement.style.right = "26%";
  } else {
    sideNavTwo.style.display = "none";
    collapseRight.style.right = "0px";
    collapseRight.innerHTML = "<";
    tooltipElement.style.right = "1%";
  }
});

collapseTop.addEventListener("click", () => {
  if (secondNav.style.display == "none") {
    secondNav.style.display = "block";
    // collapseTop.style.right = "25%";
    collapseTop.innerHTML = "<";
    sideNavOne.style.height = "77.9vh";
    sideNavTwo.style.height = "77.9vh";
    mapElement.style.height = "77.9vh";
  } else {
    secondNav.style.display = "none";
    // collapseTop.style.right = "0px";
    collapseTop.innerHTML = ">";
    sideNavOne.style.height = "89.7vh";
    sideNavTwo.style.height = "89.7vh";
    mapElement.style.height = "89.7vh";
  }
});
function addPin(coords) {
  const lonLat = transform(coords, "EPSG:32643", "EPSG:4326");
  const pinFeature = new Feature({
    geometry: new Point(coords), // Use the original coords, not fromLonLat
    name: "New Pin",
  });

  pinFeature.setStyle(
    new Style({
      image: new Icon({
        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        scale: 0.04,
      }),
    })
  );

  source.addFeature(pinFeature);
  addPinToSidenav(pinFeature, lonLat);
}
function addPinToSidenav(pinFeature, lonLat) {
  const pointList = document.getElementById("measurements");
  const index = pointList.children.length;
  const featureID = "feature-" + Date.now();
  pinFeature.setId(featureID);

  const listItem = document.createElement("li");
  listItem.setAttribute("id", "li-item" + index);
  listItem.setAttribute("data-feature-id", featureID);
  const label = document.getElementById("labelInput").value || "Unnamed";

  listItem.innerHTML = `
    <div class='flex'>
      <i class="fa-solid fa-map-marker-alt"></i>
      <input type="checkbox" class="measurement-checkbox" data-index="${index}" checked>
      <div id="sidenav-list-item-r1${index}" style="min-width:200px">
        <span>${label}</span>
      </div>
    </div>
    <button>
      <i class="fas fa-trash" style="font-size:15px;"></i>
    </button>
  `;

  const checkbox = listItem.querySelector("input[type='checkbox']");
  const deleteBtn = listItem.querySelector("button");
  const sideNavDetails = listItem.querySelector(
    "#sidenav-list-item-r1" + index
  );

  const handleCheckboxChange = () => {
    const feature = source.getFeatureById(featureID);
    feature.setStyle(checkbox.checked ? null : new Style());
  };

  const handleDeleteBtnClick = () => {
    const editOptions = document.getElementById("edit-options");
    editOptions.innerHTML = "";
    pointList.removeChild(listItem);
    const feature = source.getFeatureById(featureID);
    source.removeFeature(feature);

    // Update data-index attributes for remaining list items
    const remainingItems = pointList.querySelectorAll("li");
    remainingItems.forEach((item, newIndex) => {
      item
        .querySelector("input[type='checkbox']")
        .setAttribute("data-index", newIndex);
      item.setAttribute("value", newIndex);
    });
  };

  const handleListItemClick = () => {
    const allListItems = pointList.querySelectorAll("li");
    allListItems.forEach((item) => {
      item.style.backgroundColor = "";
      const featureID = item.getAttribute("data-feature-id");
      const feature = source.getFeatureById(featureID);
      if (feature) {
        feature.setStyle(getDefaultStyle(feature));
      } else {
        // This might be a KML/KMZ layer
        const layer = map
          .getLayers()
          .getArray()
          .find((l) => l.get("id") === featureID);
        if (layer) {
          // Handle KML/KMZ layer click if needed
          // For example, you might want to highlight the layer or zoom to its extent
          const extent = layer.getSource().getExtent();
          map
            .getView()
            .fit(extent, { padding: [100, 100, 100, 100], maxZoom: 16 });
        }
      }
    });

    listItem.style.backgroundColor = "gray";

    if (pinFeature) {
      // Change the icon of the selected pin
      pinFeature.setStyle(
        new Style({
          image: new Icon({
            src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
            scale: 0.06,
          }),
        })
      );

      renderEditOptions(pinFeature, lonLat, featureID);
      const extent = pinFeature.getGeometry().getExtent();
      const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
      map.getView().setCenter(center);
      // map.getView().fit(extent);
      if (map.getView().getZoom() <= 16) {
        map.getView().setZoom(16);
      }
    }
  };

  checkbox.addEventListener("change", handleCheckboxChange);
  deleteBtn.addEventListener("click", handleDeleteBtnClick);
  sideNavDetails.addEventListener("click", handleListItemClick);

  pointList.appendChild(listItem);
  handleListItemClick(); // Automatically open the edit options for the new item
}

function renderEditOptions(pinFeature, lonLat, featureID) {
  const editOptions = document.getElementById("edit-options");
  editOptions.innerHTML = `
    <div class='close-btn-div'>
      <button class='close-btn' id='close-btn'>
        <i class="fa-solid fa-x"></i>
      </button>
    </div>
    <div class='flex align'>
      <div>
        <label for='name'>Name</label>
        <input type="text" value="New Pin" class='edit-name' id='name'>
      </div>

    </div>
    <br>
    <h3>Coordinates: ${lonLat[1].toFixed(6)}, ${lonLat[0].toFixed(6)}</h3>
  `;

  const labelInput = editOptions.querySelector("input[type='text']");
  labelInput.addEventListener("change", function () {
    pinFeature.set("name", this.value);
    const listItem = document.querySelector(
      `li[data-feature-id="${featureID}"]`
    );
    listItem.querySelector("span").textContent = this.value;
  });

  document.getElementById("close-btn").addEventListener("click", () => {
    editOptions.innerHTML = "";
  });
}
function getDefaultStyle(feature) {
  const geometry = feature.getGeometry();
  if (geometry instanceof Point) {
    return new Style({
      image: new Icon({
        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        scale: 0.04,
      }),
    });
  } else {
    return new Style({
      stroke: new Stroke({
        color: "#ffcc33",
        width: 2,
      }),
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.3)",
      }),
    });
  }
}
async function handleShpFile(event) {
  const files = event.target.files;
  for (let file of files) {
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      let geojson;

      if (file.name.endsWith(".zip")) {
        geojson = await processZipFile(arrayBuffer);
      } else {
        geojson = await processShpFile(arrayBuffer);
      }

      addShpLayerToMap(geojson, file.name);
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      alert(`Error processing ${file.name}: ${error.message}`);
    }
  }
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

async function processZipFile(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const shpFile = zip.file(/.shp$/i)[0];
  const dbfFile = zip.file(/.dbf$/i)[0];
  if (!shpFile || !dbfFile)
    throw new Error("Required files not found in the zip");
  const shpBuffer = await shpFile.async("arraybuffer");
  const dbfBuffer = await dbfFile.async("arraybuffer");
  const shpData = await parseShp(shpBuffer);
  const dbfData = await parseDbf(dbfBuffer);
  return combineShpDbf(shpData, dbfData);
}

async function processShpFile(arrayBuffer) {
  const shpData = await parseShp(arrayBuffer);
  return {
    type: "FeatureCollection",
    features: shpData.map((shape) => ({
      type: "Feature",
      properties: {},
      geometry: shape,
    })),
  };
}

function addShpLayerToMap(geojson, fileName) {
  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojson, {
      featureProjection: map.getView().getProjection(),
    }),
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
  });

  map.addLayer(vectorLayer);
  addToMeasurementsList(vectorLayer, fileName);

  map.getView().fit(vectorSource.getExtent(), {
    padding: [50, 50, 50, 50],
    duration: 1000,
  });
}

function combineShpDbf(shpData, dbfData) {
  return {
    type: "FeatureCollection",
    features: shpData.map((shape, index) => ({
      type: "Feature",
      properties: dbfData[index],
      geometry: shape,
    })),
  };
}
async function shapefileToGeoJSON(arrayBuffer) {
  const source = await shapefile.open(arrayBuffer);
  const features = [];
  let result;
  while ((result = await source.read()) && !result.done) {
    features.push(result.value);
  }
  return {
    type: "FeatureCollection",
    features: features,
  };
}

document.getElementById("shp-file").addEventListener("change", handleShpFile);
// document.getElementById("kml-file").addEventListener("change", handleKmlFile);
// function handleKmlFile(event) {
//   const file = event.target.files[0];
//   const reader = new FileReader();
//   reader.onload = function (e) {
//     const kml = new KML();
//     const features = kml.readFeatures(e.target.result, {
//       featureProjection: map.getView().getProjection(),
//     });
//     const vectorSource = new VectorSource({
//       features: features,
//     });
//     const vectorLayer = new VectorLayer({
//       source: vectorSource,
//     });
//     map.addLayer(vectorLayer);
//   };
//   reader.readAsText(file);
// }
document
  .getElementById("kml-kmz-file")
  .addEventListener("change", handleKmlKmzFiles);

async function handleKmlKmzFiles(event) {
  const files = event.target.files;
  for (let file of files) {
    try {
      let kmlContent;
      if (file.name.toLowerCase().endsWith(".kmz")) {
        kmlContent = await extractKmlFromKmz(file);
      } else {
        kmlContent = await readFileAsText(file);
      }
      addKmlToMap(kmlContent, file.name);
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
    }
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

async function extractKmlFromKmz(file) {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  const kmlFile = Object.values(zipContent.files).find((f) =>
    f.name.toLowerCase().endsWith(".kml")
  );
  if (!kmlFile) throw new Error("No KML file found in KMZ");
  return await kmlFile.async("text");
}

function addKmlToMap(kmlContent, fileName) {
  const kmlFormat = new KML({
    extractStyles: true,
    extractAttributes: true,
  });

  const features = kmlFormat.readFeatures(kmlContent, {
    featureProjection: map.getView().getProjection(),
  });

  const vectorSource = new VectorSource({
    features: features,
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    // style: function (feature) {
    //   // Use the style defined in the KML if available
    //   return feature.getStyleFunction()(feature);
    // },
  });
  map.addLayer(vectorLayer);
  addToMeasurementsList(vectorLayer, fileName);
}
function addToMeasurementsList(layer, fileName) {
  const measurementsList = document.getElementById("measurements");
  const index = measurementsList.children.length;
  const layerId = "layer-" + Date.now();
  layer.set("id", layerId);

  const listItem = document.createElement("li");
  listItem.setAttribute("id", "li-item" + index);
  listItem.setAttribute("data-feature-id", layerId);

  listItem.innerHTML = `
    <div class='flex'>
      <i class="fa-solid fa-layer-group"></i>
      <input type="checkbox" class="measurement-checkbox" data-index="${index}" checked>
      <div id="sidenav-list-item-r1${index}" style="min-width:200px">
        <span>${fileName}</span>
      </div>
    </div>
    <button>
      <i class="fas fa-trash" style="font-size:15px;"></i>
    </button>
  `;

  const checkbox = listItem.querySelector('input[type="checkbox"]');
  const deleteBtn = listItem.querySelector("button");
  const sideNavDetails = listItem.querySelector(
    `#sidenav-list-item-r1${index}`
  );

  checkbox.addEventListener("change", () => {
    layer.setVisible(checkbox.checked);
  });

  deleteBtn.addEventListener("click", () => {
    map.removeLayer(layer);
    measurementsList.removeChild(listItem);
    document.getElementById("edit-options").innerHTML = "";
  });

  sideNavDetails.addEventListener("click", () => {
    const allListItems = measurementsList.querySelectorAll("li");
    allListItems.forEach((item) => {
      item.style.backgroundColor = "";
    });

    listItem.style.backgroundColor = "#636363";
    const extent = layer.getSource().getExtent();
    map.getView().fit(extent, {
      // padding: [50, 50, 50, 50],
      // duration: 1000,
    });

    renderShpEditOptions(layer, fileName, layerId);
  });

  measurementsList.appendChild(listItem);
}
function renderShpEditOptions(layer, fileName, layerId) {
  const editOptions = document.getElementById("edit-options");
  const source = layer.getSource();
  const features = source.getFeatures();
  const featureCount = features.length;

  const geometryType = features[0].getGeometry().getType();

  const properties = features[0].getProperties();
  const propertyNames = Object.keys(properties).filter(
    (key) => key !== "geometry"
  );

  const extent = source.getExtent();
  const extentFormatted = extent.map((coord) => coord.toFixed(2)).join(", ");

  editOptions.innerHTML = `
    <div class='close-btn-div'>
      <button class='close-btn' id='close-btn'>
        <i class="fa-solid fa-x"></i>
      </button>
    </div>
    <div class='flex align'>
      <div>
        <label for='name'>Layer Name</label>
        <input type="text" value="${fileName}" class='edit-name' id='name'>
      </div>
      <div>
        <label for='stroke'>Stroke Color</label>
        <input id='stroke' type="color" value="#ffcc33" class='edit-stroke'>
      </div>
      <div>
        <label for="fillColor">Fill Color</label>
        <input type="color" id="fillColor" value="#ffcc33" class='edit-fill'>
      </div>
    </div>
    <div class='opacity-div'>
      <label for="fillOpacity">Fill Opacity</label>
      <input type="range" id="fillOpacity" min="0" max="1" step="0.1" value="0.3" class='edit-opacity'>
    </div>
    <div class='shp-details'>
      <h3>Shapefile Details</h3>
      <p><strong>Feature Count:</strong> ${featureCount}</p>
      <p><strong>Geometry Type:</strong> ${geometryType}</p>
      <p><strong>Extent:</strong> ${extentFormatted}</p>
      <h4>Properties:</h4>
      <ul>
        ${propertyNames.map((prop) => `<li>${prop}</li>`).join("")}
      </ul>
    </div>
    <button id="toggleDataBtn">View Feature Data</button>
    <div id="featureDataContainer" style="display: none;"></div>
  `;

  const nameInput = editOptions.querySelector("#name");
  const strokeColorInput = editOptions.querySelector("#stroke");
  const fillColorInput = editOptions.querySelector("#fillColor");
  const fillOpacityInput = editOptions.querySelector("#fillOpacity");
  const toggleDataBtn = editOptions.querySelector("#toggleDataBtn");
  const featureDataContainer = editOptions.querySelector(
    "#featureDataContainer"
  );

  nameInput.addEventListener("change", () => {
    const listItem = document.querySelector(`li[data-feature-id="${layerId}"]`);
    listItem.querySelector("span").textContent = nameInput.value;
  });

  const updateStyle = () => {
    const newStyle = new Style({
      stroke: new Stroke({
        color: strokeColorInput.value,
        width: 2,
      }),
      fill: new Fill({
        color: `${fillColorInput.value}${Math.round(
          fillOpacityInput.value * 255
        )
          .toString(16)
          .padStart(2, "0")}`,
      }),
    });
    layer.setStyle(newStyle);
  };

  strokeColorInput.addEventListener("input", updateStyle);
  fillColorInput.addEventListener("input", updateStyle);
  fillOpacityInput.addEventListener("input", updateStyle);

  document.getElementById("close-btn").addEventListener("click", () => {
    editOptions.innerHTML = "";
  });

  let isDataVisible = false;
  toggleDataBtn.addEventListener("click", () => {
    isDataVisible = !isDataVisible;
    if (isDataVisible) {
      featureDataContainer.style.display = "block";
      toggleDataBtn.textContent = "Hide Feature Data";

      if (featureDataContainer.innerHTML === "") {
        featureDataContainer.innerHTML =
          "<h4>Feature Data (first 5 features):</h4>";
        const table = document.createElement("table");
        table.style.borderCollapse = "collapse";
        table.style.width = "100%";

        // Create header row
        const headerRow = document.createElement("tr");
        propertyNames.forEach((prop) => {
          const th = document.createElement("th");
          th.textContent = prop;
          th.style.border = "1px solid black";
          th.style.padding = "5px";
          headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Add data rows (limit to first 5 features)
        features.slice(0, 5).forEach((feature) => {
          const row = document.createElement("tr");
          propertyNames.forEach((prop) => {
            const td = document.createElement("td");
            td.textContent = feature.get(prop);
            td.style.border = "1px solid black";
            td.style.padding = "5px";
            row.appendChild(td);
          });
          table.appendChild(row);
        });

        featureDataContainer.appendChild(table);
      }
    } else {
      featureDataContainer.style.display = "none";
      toggleDataBtn.textContent = "View Feature Data";
    }
  });
}
