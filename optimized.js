import GeoTIFF from "ol/source/GeoTIFF.js";
import Map from "ol/Map.js";
import TileLayer from "ol/layer/WebGLTile.js";
import VectorLayer from "ol/layer/Vector.js";
import OSM from "ol/source/OSM.js";
import View from "ol/View.js";
import { Fill, Stroke, Style, Circle as CircleStyle, Icon } from "ol/style.js";
import Overlay from "ol/Overlay.js";
import { Draw, Select, Interaction } from "ol/interaction.js";
import { XYZ } from "ol/source";
import VectorSource from "ol/source/Vector";
import { get as getProjection } from "ol/proj";
import proj4 from "proj4";
import { transform } from "ol/proj";
import { register } from "ol/proj/proj4";
import "./styles.css";
import {
  formatLength,
  formatArea,
  handleMeasurementSelection,
} from "./Scripts/measurements";
import {
  FetchedhHandleShpFile,
  handleKmlKmzFiles,
  handleShpFile,
} from "./Scripts/FileHandler/fileHandlers";
import { FettchedAnnotations, handleDrawEnd } from "./Scripts/drawTools";
import { addPin, FethcedaddPin } from "./Scripts/Pin";
import { handleDwgDxfFiles } from "./Scripts/DwgDxfFile";
import moment from "moment";
import {
  dateDiffInDays,
  extentionScrapper,
  getAnnotationToOrtho,
  sortDatesAscending,
  ymdFormat,
} from "./Scripts/utils";
import axios from "axios";
import { api } from "./Config";

let width = 10;
let scale = 2;
let sortedDates = [];
let dates = [];
let activeInteraction = null;
let geotiffLayer;
let sketch;
let measureTooltipElement;
let startIndex = 0;
let selectedItem = null;
let measureTooltip;
let list;
let annotations = [];
let orthoId = "";
const widthIncrement = 1;

const secondnav = document.getElementById("secondnav");
const layerList = document.getElementById("layer-list");
const layerListItems = document.getElementsByClassName("layer-list-item");
const cursorBtn = document.getElementById("cursor");
const areaBtn = document.getElementById("areaBtn");
const lineBtn = document.getElementById("lineBtn");
const locateBtn = document.getElementById("locate");
const unitConversion = document.getElementById("unitConversion");
const acresOption = document.getElementById("acres");
const hectaresOption = document.getElementById("hectares");
const latLongElement = document.getElementById("lat-long");
const latLongClickElement = document.getElementById("lat-long-click");
const overlay = document.getElementById("overlay");
const editOptions = document.getElementById("edit-options");

proj4.defs("EPSG:32643", "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs");
register(proj4);

document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await axios.get(
    `${api}arthouses/project/668e5b8a563e4675ea04724b`
  );
  list = data;
  dates = list.map((e) => e.date);
  sortedDates = sortDatesAscending(dates);
  const lastDate = sortedDates[sortedDates.length - 1];
  const formatedDates = ymdFormat(sortedDates);

  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const differenceInDays = dateDiffInDays(sortedDates[0], today);
  for (let d = differenceInDays; d >= 0; d--) {
    const listItem = document.createElement("div");
    if (
      formatedDates.includes(
        moment(new Date(today.getTime() - d * 24 * 60 * 60 * 1000)).format(
          "YYYY-MM-DD"
        )
      )
    ) {
      if (
        formatedDates[formatedDates.length - 1] ==
        moment(new Date(today.getTime() - d * 24 * 60 * 60 * 1000)).format(
          "YYYY-MM-DD"
        )
      ) {
        selectedItem = listItem;
        listItem.setAttribute("class", "layer-list-date-div selected-item");
      } else {
        listItem.setAttribute("class", "layer-list-date-div");
      }
      listItem.setAttribute("id", `layer-list-date-id=${d}`);
      listItem.innerHTML = `
            <div class="layer-list-item-filled">
              <div class="filled-div">
                <div class"filled-div-thumbnail">
                </div>
                <div class="filled-div-date">
                  <p>${moment(
                    new Date(today.getTime() - d * 24 * 60 * 60 * 1000)
                  ).format("YYYY-MM-DD")}</p>
                </div>
              </div>        
            </div>
            <div class='stand'>
            </div>                
            <div class='circle'>
            </div>
          `;
      listItem.addEventListener("click", () => {
        selectLister(listItem);
      });
    } else {
      listItem.setAttribute("class", "layer-list-item");
      listItem.style.color = "black";
      listItem.style.width = `${width}px`;
      listItem.style.minWidth = `${width}px`;
    }
    layerList.appendChild(listItem);
  }
  let url = "";
  list.map(async (e) => {
    if (e.date == lastDate) {
      url = e.images[0];
      orthoId = e._id;
      const data = await getAnnotationToOrtho(e._id);
      localStorage.setItem("orhtoId", e._id);
      annotations = data.annotations;
      fetchedAnnotations(data.annotations);
    }
  });
  updateGeoTIFFLayer(url);
  setTimeout(() => {
    scrollToEnd();
    updateVisibleItems();
  }, 100);
});

const orthoLayer1 = new TileLayer({
  source: new XYZ({
    url: "https://gisdemo.s3.ap-south-1.amazonaws.com/mahalaxmicog.tif",
    // projection: "EPSG:32643",
  }),
});
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
  projection: "EPSG:32643", // OSM uses Web Mercator
});
mapLayer.set({ id: "mapLayer" });

// Add the marker layer to the map
const utmProjection = getProjection("EPSG:32643");
const map = new Map({
  target: "map",
  layers: [mapLayer],
  view: new View({
    projection: utmProjection,
    center: [0, 0],
    zoom: 11.5,
  }),
});

function updateGeoTIFFLayer(newUrl) {
  const fileExtension = extentionScrapper(newUrl);
  map.removeLayer(geotiffLayer);
  map
    .getLayers()
    .getArray()
    .forEach((layer) => {
      if (layer.get("id") == "file") {
        console.log(layer.get("id"));
        map.removeLayer(layer);
      }
    });
  if (fileExtension == "tif") {
    const newGeotiffSource = new GeoTIFF({
      sources: [
        {
          url: newUrl,
          projection: "EPSG:32643",
        },
      ],
    });

    // Create a new GeoTIFF layer
    geotiffLayer = new TileLayer({
      source: newGeotiffSource,
    });

    // Add the new layer to the map at index 1 (just above the base OSM layer)
    map.getLayers().insertAt(2, geotiffLayer);
    // Update the view once the new source is loaded
    newGeotiffSource.getView().then((viewOptions) => {
      const extent = viewOptions.extent;
      const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
      map.getView().setCenter(center);
      map.getView().fit(extent);
    });
  } else if (fileExtension == "kml") {
    handleKmlKmzFiles(null, newUrl, map, false);
  }
}

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
      addPin(coords, map, source, orthoId);
      return false; // Prevent further handling of the event
    }
    return true;
  },
});
const selectInteraction = new Select({
  layers: [orthoLayer1, orthoLayer2, orthoLayer3], // Specify the layers you want to be selectable
});

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

drawLine.on("drawend", (event) =>
  handleDrawEnd(
    event,
    false,
    measureTooltipElement,
    measureTooltip,
    sketch,
    tooltip,
    source,
    map,
    orthoId
  )
);
drawPolygon.on("drawend", (event) =>
  handleDrawEnd(
    event,
    true,
    measureTooltipElement,
    measureTooltip,
    sketch,
    tooltip,
    source,
    map,
    orthoId
  )
);

// Event listeners for measurement items in the sidebar
const measurementItems = document.querySelectorAll("#measurements li");
measurementItems.forEach((item, index) => {
  item.addEventListener("click", function () {
    handleMeasurementSelection(index);
  });
});
document.getElementById("files").addEventListener("change", (e) => {
  const fileExtension = extentionScrapper(e.target.files[0]?.name);

  switch (fileExtension) {
    case "kml":
    case "kmz":
      handleKmlKmzFiles(e, null, map);
      break;
    case "zip":
    case "shp":
      handleShpFile(e, map);
      break;
    case "dwg":
    case "dxf":
      handleDwgDxfFiles(e, map);
      break;
    default:
      console.log("Unsupported file type:", fileExtension);
  }
});

// overlay
const body = document.body;

body.addEventListener("dragenter", (e) => {
  e.preventDefault();
  e.stopPropagation();
  overlay.style.display = "flex";
});

body.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
});

body.addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.relatedTarget === null) {
    overlay.style.display = "none";
  }
});

body.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  overlay.style.display = "none";

  const files = e.dataTransfer.files;
  handleFiles(files, map);
});

function handleFiles(files, map) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = file.name;
    const fileExtension = extentionScrapper(fileName);

    switch (fileExtension) {
      case "kml":
      case "kmz":
        handleKmlKmzFiles({ target: { files: [file] } }, null, map);
        break;
      case "zip":
      case "shp":
        handleShpFile({ target: { files: [file] } }, map);
        break;
      case "dwg":
      case "dxf":
        handleDwgDxfFiles({ target: { files: [file] } }, map);
        break;
      default:
        console.log("Unsupported file type:", fileExtension);
    }
  }
}

function scrollToEnd() {
  layerList.scrollLeft = layerList.scrollWidth;
}

secondnav.addEventListener("wheel", (event) => {
  event.preventDefault();

  const delta = Math.sign(event.deltaY);
  const reversedDelta = -delta; // Invert the direction of scroll
  scale += reversedDelta * widthIncrement; // Increment the scale by a fixed amount

  // Ensure scale stays within bounds
  scale = Math.max(0.1, Math.min(scale, 500)); // Adjust the maximum scale as needed

  width = 1 * scale; // Update the width based on the new scale

  Array.from(layerListItems).forEach((element) => {
    element.style.width = `${width}px`;
    element.style.minWidth = `${width}px`;
  });

  startIndex = Math.max(0, startIndex - reversedDelta); // Invert the direction
  updateVisibleItems();
});


function updateVisibleItems() {
  const visibleCount = Math.floor(secondnav.clientWidth / width);
  Array.from(layerListItems).forEach((element, index) => {
    if (index >= startIndex && index < startIndex + visibleCount) {
      element.style.display = "block";
    }
  });
}

// Update visible items when window is resized
window.addEventListener("resize", updateVisibleItems);
const selectLister = async (element) => {
  if (selectedItem) {
    selectedItem.classList.remove("selected-item");
  }
  source.clear();
  element.classList.add("selected-item");
  selectedItem = element;
  document.getElementById("measurements").innerHTML = "";
  const dateElement = element.querySelector(".filled-div-date p");
  if (dateElement) {
    const selectedDate = dateElement.textContent;
    let url = "";
    list.map(async (e) => {
      if (moment(e.date).format("YYYY-MM-DD") == selectedDate) {
        url = e.images[0];
        const data = await getAnnotationToOrtho(e._id);
        annotations = data.annotations;
        fetchedAnnotations(data.annotations);
        orthoId = e._id;
        localStorage.setItem("orhtoId", e._id);
      }
    });
    if (url) {
      updateGeoTIFFLayer(url);
    } else {
      console.log(`No file found for date: ${selectedDate}`);
    }
  }
  editOptions.innerHTML=''
};

export const fetchedAnnotations = (annotations) => {
  source.clear();
  for (let i = 0; i < annotations?.length; i++) {
    switch (annotations[i].type) {
      case "line":
        FettchedAnnotations(annotations[i].data, false, source, map);
        break;
      case "polygon":
        FettchedAnnotations(annotations[i].data, true, source, map);
        break;
      case "pin":
        FethcedaddPin(annotations[i].data, map, source);
        break;
      case "kml":
      case "kmz":
        handleKmlKmzFiles(
          null,
          annotations[i].data.url,
          map,
          true,
          annotations[i].data.id,
          annotations[i].data.lable,
        );
        break;
      case "zip":
      case "shp":
        FetchedhHandleShpFile(
          map,
          annotations[i].data.url,
          annotations[i].data.id,
          annotations[i].data.lable
        );
        break;
      case "dwg":
      case "dxf":
        handleDwgDxfFiles(
          null,
          map,
          annotations[i].data.url,
          annotations[i].data.id,
          annotations[i].data.lable
        );
        break;
      default:
        console.log("Unsupported file type:", annotations[i].type);
    }
  }
};
