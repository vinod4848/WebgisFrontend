// src/mapConfig.js
import Map from "ol/Map.js";
import View from "ol/View.js";
import { get as getProjection } from "ol/proj";

export function createMap(target) {
  const utmProjection = getProjection("EPSG:32643");

  return new Map({
    target: target,
    view: new View({
      projection: utmProjection,
      center: [0, 0],
      zoom: 11.5,
    }),
  });
}
