import { fromLonLat, toLonLat } from "ol/proj.js";
import { getLength, getArea } from "ol/sphere.js";

export function formatLength(line, unit) {
    const length = getLength(line);
    let output;
    if(!length) return output ="";

    switch (unit) {
        case "meters":
            output = length.toFixed(6) + " m";
            break;
        case "kilometers":
            output = (length / 1000).toFixed(6) + " km";
            break;
        case "miles":
            output = (length / 1609.34).toFixed(6) + " miles";
            break;
        case "feet":
            output = (length / 0.3048).toFixed(6) + " ft";
            break;
        default:
            output = "Unit not supported";
    }
    return output;
}
export function FetchFormatLength(line, unit) {
  const length = (line);
  let output;
  if(!length) return output ="";

  switch (unit) {
      case "meters":
          output = length.toFixed(6) + " m";
          break;
      case "kilometers":
          output = (length / 1000).toFixed(6) + " km";
          break;
      case "miles":
          output = (length / 1609.34).toFixed(6) + " miles";
          break;
      case "feet":
          output = (length / 0.3048).toFixed(6) + " ft";
          break;
      default:
          output = "Unit not supported";
  }
  return output;
}
export function formatArea(polygon, unit) {
    const area = getArea(polygon);
    let output;
    if(!area) return output ="";
    switch (unit) {
        case "meters":
            output = area.toFixed(6) + " m²";
            break;
        case "kilometers":
            output = (area / 1e6).toFixed(6) + " km²";
            break;
        case "miles":
            output = (area / 2.58999e6).toFixed(6) + " mi²";
            break;
        case "feet":
            output = (area * 10.7639).toFixed(6) + " ft²";
            break;
        case "acres":
            output = (area / 4046.86).toFixed(6) + " acres";
            break;
        case "hectares":
            output = (area / 10000).toFixed(6) + " hectares";
            break;
        default:
            output = "Unit not supported";
    }
    return output;
}

export function fetchFormatArea(polygon,unit){
  const area = (polygon);
  let output;
  if(!area) return output ="";
  switch (unit) {
      case "meters":
          output = area.toFixed(6) + " m²";
          break;
      case "kilometers":
          output = (area / 1e6).toFixed(6) + " km²";
          break;
      case "miles":
          output = (area / 2.58999e6).toFixed(6) + " mi²";
          break;
      case "feet":
          output = (area * 10.7639).toFixed(6) + " ft²";
          break;
      case "acres":
          output = (area / 4046.86).toFixed(6) + " acres";
          break;
      case "hectares":
          output = (area / 10000).toFixed(6) + " hectares";
          break;
      default:
          output = "Unit not supported";
  }
  return output;
}
export function convertUnit(value, unit, isArea) {
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
export function handleMeasurementSelection(index) {
  const measurementItems = document.querySelectorAll("#measurements li");
  measurementItems.forEach((item, i) => {
    item.classList.toggle("active", i === index);
  });

  const editOptions = document.getElementById("edit-options");
  editOptions.innerHTML = "";

  const selectedFeature = source.getFeatures()[index];
  if (!selectedFeature) return;

  const labelInput = createInput(
    "text",
    selectedFeature.get("label") || "Unnamed",
    (value) => selectedFeature.set("label", value)
  );
  const strokeColorInput = createInput(
    "color",
    selectedFeature.getStyle().getStroke().getColor(),
    updateFeatureStyle
  );

  editOptions.appendChild(createLabeledElement("Label:", labelInput));
  editOptions.appendChild(
    createLabeledElement("Stroke Color:", strokeColorInput)
  );

  if (selectedFeature.getGeometry().getType() === "Polygon") {
    const fillColorInput = createInput(
      "color",
      selectedFeature.getStyle().getFill().getColor(),
      updateFeatureStyle
    );
    editOptions.appendChild(
      createLabeledElement("Fill:", fillColorInput)
    );
  }

  editOptions.style.display = "block";

  function updateFeatureStyle() {
    const newStyle = new Style({
      stroke: new Stroke({ color: strokeColorInput.value, width: 2 }),
      fill:
        selectedFeature.getGeometry().getType() === "Polygon"
          ? new Fill({ color: fillColorInput.value })
          : undefined,
    });
    selectedFeature.setStyle(newStyle);
  }
}
function createInput(type, value, onChange) {
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  input.addEventListener("input", () => onChange(input.value));
  return input;
}

function createLabeledElement(label, element) {
  const container = document.createElement("div");
  container.appendChild(document.createTextNode(label));
  container.appendChild(element);
  return container;
}
