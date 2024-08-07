import JSZip from "jszip";
import { parseShp, parseDbf } from "shpjs/dist/shp";
import { addKmlToMap, addShpLayerToMap } from "../layerManagement";
import { addAnnotationToOrtho } from "../utils";

async function fetchFileFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.blob();
}
export async function handleShpFile(event, map, url = null) {
  let files;

  if (url) {
    files = [await fetchFileFromUrl(url)];
  } else {
    files = event.target.files;
  }

  for (let file of files) {
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      let geojson;
      let type;
      if (file.name.endsWith(".zip")) {
        geojson = await processZipFile(arrayBuffer);
        type = "zip";
      } else {
        geojson = await processShpFile(arrayBuffer);
        type = "shp";
      }
      const featureID = "feature-" + Date.now();
      const formData = new FormData();
      const obj = { id: featureID, name: file.name };
      formData.append("data", obj);
      formData.append("id", featureID);
      formData.append("lable", file.name);
      formData.append("file", file);
      formData.append("type", type);
      await addAnnotationToOrtho("", formData);
      addShpLayerToMap(geojson, file.name, map, featureID);
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      alert(`Error processing ${file.name}: ${error.message}`);
    }
  }
}
export async function FetchedhHandleShpFile(map, url, id,label) {
  const files = [await fetchFileFromUrl(url)];
  for (let file of files) {
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      let geojson;
      let type;
      console.log(url)
      if (url.endsWith(".zip")) {
        geojson = await processZipFile(arrayBuffer);
        type = "zip";
      } else {
        geojson = await processShpFile(arrayBuffer);
        type = "shp";
      }
      console.log(label)
      addShpLayerToMap(geojson, label, map, id);
    } catch (error) {
      console.error(`Error processing ${label}:`, error);
      alert(`Error processing ${label}: ${error.message}`);
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

export async function handleKmlKmzFiles(
  event,
  presignedUrl = null,
  map,
  ortho = true,
  id = null,
  lable = null
) {
  if (presignedUrl) {
    try {
      const fileExtension = presignedUrl.split(".").pop().toLowerCase();
      let kmlContent;

      if (fileExtension === "kmz") {
        const blob = await fetchFileFromUrl(presignedUrl);
        kmlContent = await extractKmlFromKmz(blob);
      } else if (fileExtension === "kml") {
        kmlContent = await fetchKmlFromPresignedUrl(presignedUrl);
      } else {
        throw new Error("Unsupported file type");
      }
console.log(lable)
      addKmlToMap(kmlContent, lable, map, ortho, id);
    } catch (error) {
      console.error("Error processing presigned KML:", error);
    }
  } else if (event && event.target.files) {
    const files = event.target.files;
    for (let file of files) {
      try {
        let kmlContent;
        let type;
        if (file.name.toLowerCase().endsWith(".kmz")) {
          kmlContent = await extractKmlFromKmz(file);
          type = "kmz";
        } else {
          kmlContent = await readFileAsText(file);
          type = "kml";
        }
        const formData = new FormData();
        const featureID = "feature-" + Date.now();
        const obj = { id: featureID, name: file.name };
        formData.append("data", obj);
        formData.append("file", file);
        formData.append("id", featureID);
        formData.append("label", file.name);
        formData.append("type", type);
        await addAnnotationToOrtho("", formData);
        console.log(file.name);
        addKmlToMap(kmlContent, file.name, map, ortho, featureID);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
    }
  }
}
async function fetchKmlFromPresignedUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Error fetching KML from presigned URL:", error);
    throw error;
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
