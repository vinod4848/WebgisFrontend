import { GeoJSON } from "ol/format";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Stroke, Fill } from "ol/style";
import DxfParser from "dxf-parser";
import { addToMeasurementsList } from "./layerManagement";
import { get as getProjection } from "ol/proj";
import { addAnnotationToOrtho } from "./utils";

export async function handleDwgDxfFiles(
  event,
  map,
  presignedUrl = null,
  id = null,
  lable = null
) {
  if (presignedUrl) {
    try {
      const response = await fetch(presignedUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch DXF file from URL: ${response.statusText}`
        );
      }
      const dxfContent = await response.text();
      console.log(lable)
      const geojson = await processDxfContent(dxfContent);
      addDwgDxfLayerToMap(geojson, lable || "DXF", map, id);
    } catch (error) {
      console.error("Error processing presigned KML:", error);
    }
  } else if (event && event.target.files) {
    const files = event.target.files;
    for (let file of files) {
      try {
        const fileExtension = file.name.split(".").pop().toLowerCase();
        let geojson;
        let type;
        if (fileExtension === "dxf") {
          geojson = await processDxfFile(file);
          type = "dxf";
        } else if (fileExtension === "dwg") {
          geojson = await processDwgFile(file);
          type = "dxf";
        } else {
          throw new Error("Unsupported file type");
        }
        const featureID = "feature-" + Date.now();
        const formData = new FormData();
        const obj = { id: featureID, name: file.name };
        formData.append("data", obj);
        formData.append("id", featureID);
        formData.append("label", file.name);
        formData.append("file", file);
        formData.append("type", type);
        await addAnnotationToOrtho("", formData);
        addDwgDxfLayerToMap(geojson, file.name, map, featureID);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        alert(`Error processing ${file.name}: ${error.message}`);
      }
    }
  }
}
async function processDxfContent(dxfContent) {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DxfParser();
      const dxf = parser.parseSync(dxfContent);
      const geojson = dxfToGeoJSON(dxf);
      resolve(geojson);
    } catch (error) {
      reject(error);
    }
  });
}
async function processDxfFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parser = new DxfParser();
        const dxf = parser.parseSync(e.target.result);
        const geojson = dxfToGeoJSON(dxf);
        resolve(geojson);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file); // Changed to readAsText
  });
}

function dxfToGeoJSON(dxf) {
  const features = [];

  Object.values(dxf.entities).forEach((entity) => {
    let geometry;
    switch (entity.type) {
      case "LINE":
        if (
          isValidCoordinate(entity.vertices[0]) &&
          isValidCoordinate(entity.vertices[1])
        ) {
          geometry = {
            type: "LineString",
            coordinates: [
              [entity.vertices[0].x, entity.vertices[0].y],
              [entity.vertices[1].x, entity.vertices[1].y],
            ],
          };
        }
        break;
      case "LWPOLYLINE":
      case "POLYLINE":
        const validVertices = entity.vertices.filter(isValidCoordinate);
        if (validVertices.length >= 2) {
          geometry = {
            type: "LineString",
            coordinates: validVertices.map((v) => [v.x, v.y]),
          };
        }
        break;
      // Add more cases for other entity types as needed
    }

    if (geometry) {
      features.push({
        type: "Feature",
        geometry: geometry,
        properties: {},
      });
    }
  });

  return {
    type: "FeatureCollection",
    features: features,
  };
}

function isValidCoordinate(vertex) {
  return (
    vertex &&
    typeof vertex.x === "number" &&
    typeof vertex.y === "number" &&
    isFinite(vertex.x) &&
    isFinite(vertex.y)
  );
}
async function processDwgFile(file) {
  throw new Error(
    "DWG processing is not implemented. Consider converting to DXF first."
  );
}

function addDwgDxfLayerToMap(geojson, fileName, map, id) {
  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(geojson, {
      featureProjection: map.getView().getProjection(),
    }),
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      stroke: new Stroke({
        color: "blue",
        width: 2,
      }),
      fill: new Fill({
        color: "rgba(0, 0, 255, 0.1)",
      }),
    }),
  });
  vectorLayer.set("id", "file");
  map.addLayer(vectorLayer);

  addToMeasurementsList(vectorLayer, fileName, map, id);

  // Zoom to the extent of the new layer
  map.getView().fit(vectorSource.getExtent(), { padding: [50, 50, 50, 50] });
}
