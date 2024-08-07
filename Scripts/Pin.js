import { Feature } from "ol";
import { Point } from "ol/geom";
import { transform } from "ol/proj";
import { Icon, Style } from "ol/style";
import {
  addAnnotationToOrtho,
  deleteAnnotationToOrtho,
  getAnnotationToOrtho,
  getDefaultStyle,
} from "./utils";
import { label } from "three/examples/jsm/nodes/Nodes.js";
import axios from "axios";
import { api } from "../Config";

// Add pin to the map
export async function addPin(coords, map, source, orthoId) {
  const pinFeature = createPinFeature(coords);
  const featureID = "feature-" + Date.now();
  pinFeature.setId(featureID);
  source.addFeature(pinFeature);

  addAnnotationToOrtho(orthoId, {
    data: { coords, id: featureID, lable: "Pin" },
    type: "pin",
  });
  updateSideNavigation(featureID, pinFeature, source, map, "Pin");
  // map.getView().fit(coords)
  const extent = pinFeature.getGeometry().getExtent();
  map.getView().fit(extent);
}

export function FethcedaddPin(coords, map, source) {
  const pinFeature = createPinFeature(coords.coords);
  pinFeature.setId(coords.id);
  source.addFeature(pinFeature);
  updateSideNavigation(coords.id, pinFeature, source, map, coords.lable);
}

function createPinFeature(coords) {
  const pinFeature = new Feature({
    geometry: new Point(coords),
    name: "New Pin",
  });

  const pinStyle = new Style({
    image: new Icon({
      src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      scale: 0.04,
    }),
  });

  pinFeature.setStyle(pinStyle);
  return pinFeature;
}

function handleCheckboxChange(featureID, checkbox, source) {
  const feature = source.getFeatureById(featureID);
  if (!feature) return;

  if (checkbox.checked) {
    const storedStyle = feature.get("storedStyle") || null;
    feature.setStyle(storedStyle || getDefaultStyle(feature));
  } else {
    feature.set("storedStyle", feature.getStyle());
    feature.setStyle(new Style());
  }
}

function updateSideNavigation(featureID, pinFeature, source, map, lable) {
  const pointList = document.getElementById("measurements");
  const index = pointList.children.length;
  // const featureID = pinFeature.getId();

  const listItem = document.createElement("li");
  listItem.setAttribute("id", `li-item${index}`);
  listItem.setAttribute("data-feature-id", featureID);
  const label = document.getElementById("labelInput").value || lable;

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

  addEventListenersToListItem(
    listItem,
    featureID,
    source,
    pinFeature,
    map,
    index,
    label
  );

  pointList.appendChild(listItem);
  listItem.querySelector("div").click(); // Automatically open the edit options for the new item
}

function addEventListenersToListItem(
  listItem,
  featureID,
  source,
  pinFeature,
  map,
  index,
  lable
) {
  const checkbox = listItem.querySelector("input[type='checkbox']");
  const deleteBtn = listItem.querySelector("button");
  const sideNavDetails = listItem.querySelector(
    `#sidenav-list-item-r1${index}`
  );

  checkbox.addEventListener("change", () =>
    handleCheckboxChange(featureID, checkbox, source)
  );

  deleteBtn.addEventListener("click", async () => {
    await handleDeleteFeature(featureID, listItem, source);
  });

  sideNavDetails.addEventListener("click", () => {
    handleSideNavItemClick(pinFeature, featureID, source, map, listItem, lable);
  });
}

async function handleDeleteFeature(featureID, listItem, source) {
  const feature = source.getFeatureById(featureID);
  if (feature) {
    source.removeFeature(feature);
    listItem.remove();  // Remove the list item from the DOM
    updateListItemIndexes();  // Update the indexes of remaining list items
    await deleteAnnotationToOrtho(featureID);  // Remove annotation from ortho
  } else {
    console.error(`Feature with ID ${featureID} not found.`);
  }
}
function updateListItemIndexes() {
  const remainingItems = document.querySelectorAll("#measurements li");
  remainingItems.forEach((item, newIndex) => {
    item
      .querySelector("input[type='checkbox']")
      .setAttribute("data-index", newIndex);
    item.setAttribute("value", newIndex);
  });
}

function handleSideNavItemClick(
  pinFeature,
  featureID,
  source,
  map,
  listItem,
  lable
) {
  const allListItems = document.querySelectorAll("#measurements li");
  allListItems.forEach((item) => {
    item.style.backgroundColor = "";
    const feature = source.getFeatureById(item.getAttribute("data-feature-id"));
    if (feature) {
      feature.setStyle(getDefaultStyle(feature));
    }
  });

  listItem.style.backgroundColor = "gray";
  pinFeature.setStyle(
    new Style({
      image: new Icon({
        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        scale: 0.06,
      }),
    })
  );

  renderEditOption(pinFeature, featureID, map, lable);
  const extent = pinFeature.getGeometry().getExtent();
  const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
  map.getView().fit(extent);
}

function renderEditOption(feature, featureID, map, lable) {
  const editOptions = document.getElementById("edit-options");
  const geom = feature.getGeometry();
  const extent = geom.getExtent();
  const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
  const [lon, lat] = transform(
    center,
    map.getView().getProjection(),
    "EPSG:4326"
  );

  editOptions.innerHTML = `
    <div class='close-btn-div'>
      <button class='close-btn' id='close-btn'><i class="fa-solid fa-x"></i></button>
    </div>
    <div class='flex align'>
      <div>
        <label for='name'>Name</label>
        <input type="text" value="${
          lable || "Pin"
        }" class='edit-name' id='name'>
      </div>
    </div>
    <br>
    <h4>Center Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}</h4>
    `;

  setupEditOptionEventListeners(feature, featureID, lable);
}

function setupEditOptionEventListeners(feature, featureID, lable) {
  const editOptions = document.getElementById("edit-options");
  const labelInput = editOptions.querySelector("input[type='text']");

  labelInput.addEventListener("change", () =>
    updateLabel(labelInput, featureID)
  );
  document
    .getElementById("close-btn")
    .addEventListener("click", () => (editOptions.innerHTML = ""));
}

async function updateLabel(input, featureID) {
  try {
    const listItem = document.querySelector(
      `li[data-feature-id="${featureID}"]`
    );
    await axios.put(`${api}updateMeasurementByFeatureId/${featureID}`, {
      lable: input.value,
    });

    listItem.querySelector("span").textContent = input.value;
  } catch (error) {
    console.log(error);
  }
}
