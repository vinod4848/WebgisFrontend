import GeoJSON from "ol/format/GeoJSON";
import KML from "ol/format/KML";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Fill, Stroke, Style } from "ol/style";
import { deleteAnnotationToOrtho, stringShortner } from "./utils";
import axios from "axios";
import { api } from "../Config";

export function addShpLayerToMap(geojson, fileName, map, id) {
  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojson, {
      featureProjection: map.getView().getProjection(),
    }),
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
  });
  vectorLayer.set("id", "file");
  map.addLayer(vectorLayer);
  addToMeasurementsList(vectorLayer, fileName, map, id);

  map.getView().fit(vectorSource.getExtent(), {
    padding: [50, 50, 50, 50],
    duration: 1000,
  });
}
export function addKmlToMap(kmlContent, fileName, map, ortho, id) {
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
  });
  // if(!ortho){
  vectorLayer.set("id", "file");
  // }
  map.addLayer(vectorLayer);
  map.once("rendercomplete", () => {
    // Get the extent of the vector layer
    const extent = vectorSource.getExtent();
    const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];

    // Center the map view to the extent of the vector layer
    map.getView().setCenter(center);
    map.getView().fit(extent);
    // map.getView().fit(extent);
    if (ortho) {
      addToMeasurementsList(vectorLayer, fileName, map, id);
    }
  });
}

export function addToMeasurementsList(layer, fileName, map, id) {
  const measurementsList = document.getElementById("measurements");
  const layerId = "layer-" + Date.now();
  layer.set("id", layerId);

  const listItem = createListItems(
    layerId,
    fileName,
    measurementsList.children.length
  );
  measurementsList.appendChild(listItem);

  setupEventListeners(listItem, layer, fileName, layerId, map, id);
}
function setupEventListeners(listItem, layer, fileName, layerId, map, id) {
  const checkbox = listItem.querySelector('input[type="checkbox"]');
  const deleteBtn = listItem.querySelector("button");
  const sideNavDetails = listItem.querySelector(
    `#sidenav-list-item-r1${listItem.getAttribute("id").slice(7)}`
  );

  checkbox.addEventListener("change", () => layer.setVisible(checkbox.checked));

  deleteBtn.addEventListener("click", async () => {
    const deletes = await deleteAnnotationToOrtho(id);
    map.removeLayer(layer);
    listItem.remove();
    document.getElementById("edit-options").innerHTML = "";
  });

  sideNavDetails.addEventListener("click", () => {
    document
      .querySelectorAll("#measurements li")
      .forEach((item) => (item.style.backgroundColor = ""));
    listItem.style.backgroundColor = "#636363";
    map.getView().setCenter(layer.getSource().getExtent());
    renderShpEditOptions(layer, fileName, layerId,id);
  });
}

function createListItems(layerId, fileName, index) {
  const listItem = document.createElement("li");
  listItem.setAttribute("id", "li-item" + index);
  listItem.setAttribute("data-feature-id", layerId);
  console.log({fileName:stringShortner(fileName)})

  listItem.innerHTML = `
      <div class='flex'>
        <i class="fa-solid fa-layer-group"></i>
        <input type="checkbox" class="measurement-checkbox" data-index="${index}" checked>
        <div id="sidenav-list-item-r1${index}" style="min-width:200px">
          <span>${stringShortner(fileName)}</span>
        </div>
      </div>
      <button>
        <i class="fas fa-trash" style="font-size:15px;"></i>
      </button>
    `;

  return listItem;
}
function renderShpEditOptions(layer, fileName, layerId,featureID) {
  const editOptions = document.getElementById("edit-options");
  const source = layer.getSource();
  const features = source.getFeatures();
  const feature = features[0];

  const geometryType = feature.getGeometry().getType();
  const propertyNames = Object.keys(feature.getProperties()).filter(
    (key) => key !== "geometry"
  );
  const extent = source.getExtent();

  editOptions.innerHTML = `
      <div class='close-btn-div'>
        <button class='close-btn' id='close-btn'><i class="fa-solid fa-x"></i></button>
      </div>
      <div class='flex align'>
        ${createInputGroup("Layer Name", "name", fileName)}
      </div>
      <div class='shp-details'>
        <h3>File Details</h3>
        <p><strong>Feature Count:</strong> ${features.length}</p>
        <p><strong>Geometry Type:</strong> ${geometryType}</p>
        <p><strong>Extent:</strong> ${extent
          .map((coord) => coord.toFixed(2))
          .join(", ")}</p>
      </div>
      <div id="featureDataContainer" style="display: none;"></div>
    `;

  setupStyleControls(layer, layerId,featureID);
  setupFeatureDataToggle(features, propertyNames);
}
function createInputGroup(
  label,
  id,
  value,
  type = "text",
  min = "",
  max = "",
  step = ""
) {
  return `
      <div>
        <label for='${id}'>${label}</label>
        <input id='${id}' type="${type}" value="${value}" class='edit-${id}'
          ${min ? `min="${min}"` : ""} ${max ? `max="${max}"` : ""} ${
    step ? `step="${step}"` : ""
  }>
      </div>
    `;
}

function setupStyleControls(layer, layerId,featureID) {
  const nameInput = document.getElementById("name");
  const strokeColorInput = document.getElementById("stroke");
  const fillColorInput = document.getElementById("fillColor");
  const fillOpacityInput = document.getElementById("fillOpacity");
  const closeBtn = document.getElementById("close-btn");

  nameInput.addEventListener("change", updateLayerName);
  [strokeColorInput, fillColorInput, fillOpacityInput].forEach((input) =>

    input.addEventListener("input", updateLayerStyle)
  );
  closeBtn.addEventListener("click", closeEditOptions);

  async function updateLayerName() {
    const listItem = document.querySelector(`li[data-feature-id="${layerId}"]`);
    const updateAnnotation = await axios.put(
      `${api}updateMeasurementByFeatureId/${featureID}`,
      {
        lable:nameInput.value,
      }
    );
    if (listItem) {
      listItem.querySelector("span").textContent = nameInput.value;
    }
  }

  function updateLayerStyle() {
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
  }

  function closeEditOptions() {
    document.getElementById("edit-options").innerHTML = "";
  }
}

function setupFeatureDataToggle(features, propertyNames) {
  const toggleDataBtn = document.getElementById("toggleDataBtn");
  const featureDataContainer = document.getElementById("featureDataContainer");
  let isDataVisible = false;

  toggleDataBtn.addEventListener("click", toggleFeatureData);

  function toggleFeatureData() {
    isDataVisible = !isDataVisible;
    featureDataContainer.style.display = isDataVisible ? "block" : "none";
    toggleDataBtn.textContent = isDataVisible
      ? "Hide Feature Data"
      : "View Feature Data";

    if (isDataVisible && featureDataContainer.innerHTML === "") {
      renderFeatureData();
    }
  }

  function renderFeatureData() {
    featureDataContainer.innerHTML =
      "<h4>Feature Data (first 5 features):</h4>";
    const table = createFeatureDataTable();
    featureDataContainer.appendChild(table);
  }

  function createFeatureDataTable() {
    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    table.style.width = "100%";

    const headerRow = createTableRow(propertyNames, "th");
    table.appendChild(headerRow);

    features.slice(0, 5).forEach((feature) => {
      const row = createTableRow(
        propertyNames.map((prop) => feature.get(prop)),
        "td"
      );
      table.appendChild(row);
    });

    return table;
  }

  function createTableRow(data, cellType) {
    const row = document.createElement("tr");
    data.forEach((item) => {
      const cell = document.createElement(cellType);
      cell.textContent = item;
      cell.style.border = "1px solid black";
      cell.style.padding = "5px";
      row.appendChild(cell);
    });
    return row;
  }
}
