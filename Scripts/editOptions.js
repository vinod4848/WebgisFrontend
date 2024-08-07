import { transform } from "ol/proj";
import {
  convertUnit,
  fetchFormatArea,
  formatArea,
  formatLength,
  handleMeasurementSelection,
  FetchFormatLength,
} from "./measurements";
import { Fill, Icon, Stroke, Style } from "ol/style";
import axios from "axios";
import { api } from "../Config";

function extractNumericValue(areaString) {
  // Use a regular expression to extract the number from the string
  const match = areaString.match(/([\d.]+)/);
  if (match) {
    return parseFloat(match[1]);
  } else {
    console.error("Invalid area string format.");
    return null;
  }
}

export function renderEditOptions(
  label,
  convertedOutput,
  geom,
  featureID,
  isPolygon,
  map,
  source,
  measurement,
  featureData
) {
  const editOptions = document.getElementById("edit-options");
  const extent = geom.extent_;
  const conversion = measurement;
  const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];

  const lonLat = transform(center, map.getView().getProjection(), "EPSG:32643");

  const lat = typeof lonLat[1] === "number" ? lonLat[1].toFixed(6) : "N/A";
  const lon = typeof lonLat[0] === "number" ? lonLat[0].toFixed(6) : "N/A";

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
          <input id='stroke' type="color" value="#636363" class='edit-stroke'>
        </div>
        ${
          isPolygon
            ? `
        <div>
          <label for="fillColor">Fill</label>
          <input type="color" id="fillColor" value="#636363" class='edit-fill'>
        </div>
        `
            : ""
        }
      </div>
      ${
        isPolygon
          ? `
      <div class='opacity-div'>
        <label for="fillOpacity">Fill Opacity:</label>
        <input type="range" id="fillOpacity" min="0" max="1" step="0.01" value="0.2" class='edit-opacity'>
      </div>
      `
          : ""
      }
      <br>
      <h3>Measurement: ${convertedOutput}</h3>
      <h4>Center Coordinates: ${lat}, ${lon}</h4>
      <div class='conversions'>
        ${
          isPolygon
            ? `
        <p>meters: ${convertUnit(
          fetchFormatArea(conversion, "meters"),
          "meters",
          true
        )}</p>
        <p>hectares: ${convertUnit(
          fetchFormatArea(conversion, "hectares"),
          "hectares",
          true
        )}</p>
        <p>acres: ${convertUnit(
          fetchFormatArea(conversion, "acres"),
          "acres",
          true
        )}</p>
        <p>square kilometers: ${convertUnit(
          fetchFormatArea(conversion, "kilometers"),
          "square kilometers",
          true
        )}</p>
        `
            : `
        <p>meters: ${convertUnit(
          FetchFormatLength(conversion, "meters"),
          "meters",
          false
        )}</p>
        <p>Kilometers: ${convertUnit(
          FetchFormatLength(conversion, "kilometers"),
          "kilometers",
          false
        )}</p>
        <p>feet: ${convertUnit(
          FetchFormatLength(conversion, "feet"),
          "feet",
          false
        )}</p>
        <p>miles: ${convertUnit(
          FetchFormatLength(conversion, "miles"),
          "miles",
          false
        )}</p>
        `
        }
      </div>
      <button id="save-btn-line">Save</button>
    `;

  const labelInput = editOptions.querySelector("input[type='text']");
  const strokeColorInput = editOptions.querySelector("#stroke");
  const saveButton = document.getElementById("save-btn-line");
  saveButton.style.display = "none";
  let fillColorInput, fillOpacityInput;

  if (isPolygon) {
    fillColorInput = editOptions.querySelector("#fillColor");
    fillOpacityInput = editOptions.querySelector("#fillOpacity");
  }

  const feature = source.getFeatureById(featureID);
  const updateFeatureStyle = () => {
    if (saveButton.style.display == "none") saveButton.style.display = "block";
    if (feature) {
      const newStyle = new Style({
        stroke: new Stroke({
          color: strokeColorInput.value,
          width: 2,
        }),
        ...(isPolygon && {
          fill: new Fill({
            color: `${fillColorInput.value}${Math.round(
              fillOpacityInput.value * 255
            )
              .toString(16)
              .padStart(2, "0")}`,
          }),
        }),
      });
      feature.setStyle(newStyle);
      feature.set("storedStyle", newStyle);
    }
  };

  labelInput.addEventListener("change", function () {
    saveButton.style.display = "block";
    const listItem = document.querySelector(
      `li[data-feature-id="${featureID}"]`
    );
    listItem.querySelector(
      "span"
    ).textContent = `${this.value}: ${convertedOutput}`;
  });

  strokeColorInput.addEventListener("input", updateFeatureStyle);

  if (isPolygon) {
    fillColorInput.addEventListener("input", updateFeatureStyle);
    fillOpacityInput.addEventListener("input", updateFeatureStyle);
  }

  document.getElementById("close-btn").addEventListener("click", () => {
    editOptions.innerHTML = "";
  });
  const stroke =
    strokeColorInput.value == featureData.style.strokeColor
      ? featureData.style.strokeColor
      : strokeColorInput.value;
  saveButton.addEventListener("click", () => {
    saveFeatureDetails(
      featureID,
      labelInput.value,
      stroke,
      fillColorInput ? fillColorInput.value : featureData.style.fillColor,
      fillOpacityInput
        ? fillOpacityInput.value
        : featureData?.style?.fillOpacity,
      feature
    );
  });
}
export function localRenderEditOptions(
  label,
  convertedOutput,
  geom,
  featureID,
  isPolygon,
  map,
  source,
  featureData
) {
  const editOptions = document.getElementById("edit-options");
  const extent = geom.getExtent();
  const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
  const lonLat = transform(center, map.getView().getProjection(), "EPSG:4326");
  const lat = typeof lonLat[1] === "number" ? lonLat[1].toFixed(6) : "N/A";
  const lon = typeof lonLat[0] === "number" ? lonLat[0].toFixed(6) : "N/A";

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
          <input id='stroke' type="color" value="#636363" class='edit-stroke'>
        </div>
        ${
          isPolygon
            ? `
        <div>
          <label for="fillColor">Fill Color:</label>
          <input type="color" id="fillColor" value="#636363" class='edit-fill'>
        </div>
        `
            : ""
        }
      </div>
      ${
        isPolygon
          ? `
      <div class='opacity-div'>
        <label for="fillOpacity">Fill Opacity:</label>
        <input type="range" id="fillOpacity" min="0" max="1" step="0.01" value="0.2" class='edit-opacity'>
      </div>
      `
          : ""
      }
      <br>
      <h3>Measurement: ${convertedOutput}</h3>
      <h4>Center Coordinates: ${lat}, ${lon}</h4>
      <div class='conversions'>
        ${
          isPolygon
            ? `
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
        `
            : `
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
        `
        }
      </div>
            <button id="save-btn">Save</button>
    `;

  const labelInput = editOptions.querySelector("input[type='text']");
  const strokeColorInput = editOptions.querySelector("#stroke");
  let fillColorInput, fillOpacityInput;
  const saveButton = document.getElementById("save-btn");
  saveButton.style.display = "none";

  if (isPolygon) {
    fillColorInput = editOptions.querySelector("#fillColor");
    fillOpacityInput = editOptions.querySelector("#fillOpacity");
  }

  const updateFeatureStyle = () => {
    saveButton.style.display = "block";
    const feature = source.getFeatureById(featureID);
    if (feature) {
      const newStyle = new Style({
        stroke: new Stroke({
          color: strokeColorInput.value,
          width: 2,
        }),
        ...(isPolygon && {
          fill: new Fill({
            color: `${fillColorInput.value}${Math.round(
              fillOpacityInput.value * 255
            )
              .toString(16)
              .padStart(2, "0")}`,
          }),
        }),
      });
      feature.setStyle(newStyle);
      feature.set("storedStyle", newStyle);
    }
  };

  labelInput.addEventListener("change", function () {
    saveButton.style.display = "block";
    const listItem = document.querySelector(
      `li[data-feature-id="${featureID}"]`
    );
    listItem.querySelector(
      "span"
    ).textContent = `${this.value}: ${convertedOutput}`;
  });

  strokeColorInput.addEventListener("input", updateFeatureStyle);

  if (isPolygon) {
    fillColorInput.addEventListener("input", updateFeatureStyle);
    fillOpacityInput.addEventListener("input", updateFeatureStyle);
  }

  document.getElementById("close-btn").addEventListener("click", () => {
    editOptions.innerHTML = "";
  });
  const feature = source.getFeatureById(featureID);
  const stroke =
    strokeColorInput.value == featureData.style.strokeColor
      ? featureData.style.strokeColor
      : strokeColorInput.value;
  saveButton.addEventListener("click", () => {
    saveFeatureDetails(
      featureID,
      labelInput.value,
      stroke,
      fillColorInput ? fillColorInput.value : featureData.style.fillColor,
      fillOpacityInput
        ? fillOpacityInput.value
        : featureData?.style?.fillOpacity,
      feature
    );
  });
}
function hexToRgba(hex, opacity) {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, "");

  // Parse the r, g, b values
  let bigint = parseInt(hex, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  // Return the rgba string
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
async function saveFeatureDetails(
  featureID,
  label,
  strokeColor,
  fillColor,
  fillOpacity,
  feature
) {
  try {
    if (feature) {
      const geometry = feature.getGeometry();
      feature.set("name", label);
      feature.set("strokeColor", strokeColor);
      if (fillColor !== null) {
        feature.set("fillColor", hexToRgba(fillColor, fillOpacity));
        feature.set("fillOpacity", fillOpacity);
      }
      console.log({
        id: featureID,
        type: geometry.getType(),
        label,
        coordinates: geometry.getCoordinates(),
        style: {
          strokeColor,
          fillColor: hexToRgba(fillColor, fillOpacity),
          fillOpacity,
        },
        properties: feature.getProperties(),
      });
      console.log(feature)

      const updateAnnotation = await axios.put(
        `${api}updateMeasurementByFeatureId/${featureID}`,
        {
          id: featureID,
          type: geometry.getType(),
          label,
          coordinates: geometry.getCoordinates(),
          style: {
            strokeColor,
            fillColor: hexToRgba(fillColor, fillOpacity),
            fillOpacity,
          },
          properties: feature.getProperties(),
        }
      );
      document.getElementById("save-btn-line").style.display = "none";
    }
  } catch (error) {
    console.log(error);
  }
}
