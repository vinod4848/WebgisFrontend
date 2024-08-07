import { convertUnit, formatArea, formatLength } from "./measurements";
import { localRenderEditOptions, renderEditOptions } from "./editOptions";
import { Fill, Stroke, Style, Circle as CircleStyle, Icon } from "ol/style.js";
import axios from "axios";
import { api } from "../Config";
import { LineString, Polygon } from "ol/geom";
import {
  addAnnotationToOrtho,
  deleteAnnotationToOrtho,
  getAnnotationToOrtho,
  stringShortner,
} from "./utils";
import { transform } from "ol/proj";
import { Feature } from "ol";
import { getLength, getArea } from "ol/sphere.js";

function handleCheckboxChange(featureID, checkbox, source) {
  const feature = source.getFeatureById(featureID);
  if (!feature) return;

  if (checkbox.checked) {
    const storedStyle = feature.get("storedStyle") || null;
    feature.setStyle(storedStyle);
  } else {
    feature.set("storedStyle", feature.getStyle());
    feature.setStyle(new Style());
  }
}

function serializeFeature(feature) {
  const geometry = feature.getGeometry();
  const style = new Style({
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.3)",
    }),
    stroke: new Stroke({
      color: "#ffcc33",
      width: 1,
    }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({
        color: "#ffcc33",
      }),
    }),
  });
  const featureID = "feature-" + Date.now();
  feature.setId(featureID);
  return {
    id: featureID,
    type: geometry.getType(),
    coordinates: geometry.getCoordinates(),
    style: {
      strokeColor: style.getStroke().getColor(),
      strokeWidth: style.getStroke().getWidth(),
      fillOpacity: 0.3,
      fillColor: style.getFill() ? style.getFill().getColor() : null,
    },
    properties: feature.getProperties(),
  };
}
// Handle drawing end event
export async function handleDrawEnd(
  event,
  isPolygon,
  measureTooltipElement,
  measureTooltip,
  sketch,
  tooltip,
  source,
  map,
  orthoId
) {
  measureTooltipElement.className = "tooltip tooltip-static";
  measureTooltip.setOffset([0, -7]);
  sketch = null;
  tooltip.innerHTML = "";
  const serializing = serializeFeature(event.feature);
  const geom = event.feature.getGeometry();
  const unit = document.getElementById("unitConversion").value;
  const measurmentValue = isPolygon ? getArea(geom) : getLength(geom);
  const output = isPolygon ? formatArea(geom, unit) : formatLength(geom, unit);
  const convertedOutput = convertUnit(output, unit, isPolygon);
  const editOptions = document.getElementById("edit-options");

  const measurementsList = document.getElementById("measurements");
  const label = document.getElementById("labelInput").value || "Unnamed";
  const index = measurementsList.children.length;

  const featureID = "feature-" + Date.now();

  const featureData = {
    // id: featureID,
    // type: isPolygon ? "polygon" : "line",
    ...serializing,
    // coordinates: geom,
    label: document.getElementById("labelInput").value || "Unnamed",
    measurement: convertedOutput,
    orthoId: orthoId,
    measurmentValue,
  };
  const listItem = createListItem(
    label,
    convertedOutput,
    index,
    featureID,
    isPolygon
  );

  const checkbox = listItem.querySelector("input[type='checkbox']");
  const deleteBtn = listItem.querySelector("button");
  const sideNavDetails = listItem.querySelector(
    `#sidenav-list-item-r1${index}`
  );

  checkbox.addEventListener("change", () =>
    handleCheckboxChange(featureID, checkbox, source)
  );
  deleteBtn.addEventListener("click", () =>
    handleDeleteBtnClick(listItem, featureID, source)
  );

  sideNavDetails.addEventListener("click", () =>
    localHandleListItemClick(
      listItem,
      geom,
      label,
      convertedOutput,
      featureID,
      isPolygon,
      source,
      map,
      serializing
    )
  );

  measurementsList.appendChild(listItem);
  localHandleListItemClick(
    listItem,
    geom,
    label,
    convertedOutput,
    featureID,
    isPolygon,
    source,
    map,
    serializing
  );

  // Reapply hidden styles
  const checkboxes = document.querySelectorAll(".measurement-checkbox");
  checkboxes.forEach((cb) => {
    const id = cb.closest("li").getAttribute("data-feature-id");
    handleCheckboxChange(id, cb, source);
  });
  await addAnnotationToOrtho(orthoId, {
    data: featureData,
    type: isPolygon ? "polygon" : "line",
  });
}

function deserializeFeature(data, isPolygon) {
  let geometry;
  console.log(data);

  // Check geometry type and create accordingly
  if (data.type === "Polygon") {
    geometry = new Polygon(data.coordinates);
  } else if (data.type === "LineString") {
    geometry = new LineString(data.coordinates);
  } else {
    throw new Error("Unsupported geometry type: " + data.type);
  }

  // Create the feature with the geometry
  const feature = new Feature(geometry);
  feature.setId(data.id);

  // Create and set the style
  const style = new Style({
    stroke: new Stroke({
      color: data.style?.strokeColor,
      width: 1,
    }),
    fill: data.style?.fillColor
      ? new Fill({
          color: data.style?.fillColor,
        })
      : null,
    // ...(isPolygon && {
    //   fill: new Fill({
    //     color: `${data.style?.fillColor}${Math.round(
    //       data.style?.fillOpacity * 255
    //     )
    //       .toString(16)
    //       .padStart(2, "0")}`,
    //   }),
    // }),
  });
  console.log(
    `${data.style?.fillColor}`
  );
  feature.setStyle(style);
  feature.set("storedStyle", style);

  // Set additional properties
  if (data.properties) {
    feature.setProperties(data.properties.geometry);
  }

  return feature;
}

export async function FettchedAnnotations(data, isPolygon, source, map) {
  // Update UI
  const measurementsList = document.getElementById("measurements");
  const label = document.getElementById("labelInput").value || data.label;
  const index = measurementsList.children.length;
  const listItem = createListItem(
    data.label,
    data.measurement,
    index,
    data.id,
    isPolygon
  );
  const feature = deserializeFeature(data, isPolygon);
  source.addFeature(feature);
  // Add event listeners for UI interactions
  const checkbox = listItem.querySelector("input[type='checkbox']");
  const deleteBtn = listItem.querySelector("button");
  const sideNavDetails = listItem.querySelector(
    `#sidenav-list-item-r1${index}`
  );

  checkbox.addEventListener("change", () =>
    handleCheckboxChange(data.id, checkbox, source)
  );
  deleteBtn.addEventListener("click", () =>
    handleDeleteBtnClick(listItem, data.id, source)
  );
  sideNavDetails.addEventListener("click", () => {
    handleListItemClick(
      listItem,
      data.properties.geometry,
      label,
      data.measurement,
      data.id,
      isPolygon,
      source,
      map,
      data.measurmentValue,
      data
    );
  });

  measurementsList.appendChild(listItem);

  // Handle checkbox states
  const checkboxes = document.querySelectorAll(".measurement-checkbox");
  checkboxes.forEach((cb) => {
    const id = cb.closest("li").getAttribute("data-feature-id");
    handleCheckboxChange(id, cb, source);
  });
}

function createListItem(label, convertedOutput, index, featureID, isPolygon) {
  const listItem = document.createElement("li");
  listItem.setAttribute("id", "li-item" + index);
  listItem.setAttribute("data-feature-id", featureID);
  // <span>${stringShortner(label+":"+convertedOutput)}</span>

  listItem.innerHTML = `
    <div class='flex'>
      <i class="fa-solid ${
        isPolygon ? "fa-draw-polygon" : "fa-grip-lines-vertical"
      }"></i>
      <input type="checkbox" class="measurement-checkbox" data-index="${index}" checked>
      <div id="sidenav-list-item-r1${index}" style="min-width:200px">
        <span>${stringShortner(label)}</span>
      </div>
    </div>
    <button>
      <i class="fas fa-trash" style="font-size:15px;"></i>
    </button>
  `;

  return listItem;
}

async function handleDeleteBtnClick(listItem, featureID, source) {
  const editOptions = document.getElementById("edit-options");
  const measurementsList = document.getElementById("measurements");
  editOptions.innerHTML = "";
  measurementsList.removeChild(listItem);
  const feature = source.getFeatureById(featureID);
  if (feature) {
    source.removeFeature(feature);
  }
  await deleteAnnotationToOrtho(featureID);
  updateRemainingListItems();
}

function updateRemainingListItems() {
  const measurementsList = document.getElementById("measurements");
  const remainingItems = measurementsList.querySelectorAll("li");
  remainingItems.forEach((item, newIndex) => {
    item
      .querySelector("input[type='checkbox']")
      .setAttribute("data-index", newIndex);
    item.setAttribute("value", newIndex);
  });
}

function localHandleListItemClick(
  listItem,
  geom,
  label,
  convertedOutput,
  featureID,
  isPolygon,
  source,
  map,
  data
) {
  updateListItemStyles(listItem, featureID, source);
  localRenderEditOptions(
    label,
    convertedOutput,
    geom,
    featureID,
    isPolygon,
    map,
    source,
    data
  );
  localCenterMapOnFeature(geom, map);
}
function handleListItemClick(
  listItem,
  geom,
  label,
  convertedOutput,
  featureID,
  isPolygon,
  source,
  map,
  measurement,
  featureData
) {
  updateListItemStyles(listItem, featureID, source);
  renderEditOptions(
    label,
    convertedOutput,
    geom,
    featureID,
    isPolygon,
    map,
    source,
    measurement,
    featureData
  );
  centerMapOnFeature(geom, map);
}

function updateListItemStyles(selectedListItem, featureID, source) {
  const measurementsList = document.getElementById("measurements");
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

  selectedListItem.style.backgroundColor = "#636363";
  const feature = source.getFeatureById(featureID);
  if (feature) {
    const highlightStyle = new Style({
      stroke: new Stroke({ color: "black", width: 3 }),
      fill: new Fill({ color: "rgba(0, 255, 0, 0.2)" }),
      image: new CircleStyle({ radius: 7, fill: new Fill({ color: "black" }) }),
    });
    feature.setStyle(highlightStyle);
  }
}

function centerMapOnFeature(geom, map) {
  const extent = geom.extent_;
  const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
  map.getView().setCenter(center);
  map.getView().fit(extent);
}
function localCenterMapOnFeature(geom, map) {
  const extent = geom.getExtent();
  const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
  map.getView().setCenter(center);
  map.getView().fit(extent);
}
