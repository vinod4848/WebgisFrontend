import { Fill, Icon, Stroke, Style } from "ol/style";
import Point from "ol/geom/Point.js";
import { convertUnit, formatArea, formatLength } from "./measurements";
import axios from "axios";
import { api } from "../Config";
import moment from "moment";

export function getDefaultStyle(feature) {
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
export function getConversions(geom, isPolygon, map) {
  if (isPolygon) {
    return ["meters", "hectares", "acres", "kilometers"]
      .map(
        (unit) =>
          `<p>${unit}: ${convertUnit(formatArea(geom, unit), unit, true)}</p>`
      )
      .join("");
  } else {
    return ["meters", "kilometers", "feet", "miles"]
      .map(
        (unit) =>
          `<p>${unit}: ${convertUnit(
            formatLength(geom, unit),
            unit,
            false
          )}</p>`
      )
      .join("");
  }
}

export const extentionScrapper = (url) => {
  return url.split(".").pop().toLowerCase();
};

export const addAnnotationToOrtho = async (id, body) => {
  const orthoId = localStorage.getItem("orhtoId");
  try {
    const { data } = await axios.put(
      `${api}update-annotations/${orthoId}`,
      body
    );
  } catch (error) {
    alert(error.message);
    console.log(error);
  }
};
export const deleteAnnotationToOrtho = async (id) => {
  try {
    const { data } = await axios.delete(
      `${api}deleteMeasurementByfeatureId/${id}`
    );
  } catch (error) {}
};

export const getAnnotationToOrtho = async (id) => {
  try {
    const { data } = await axios.get(`${api}arthouses/${id}`, {});
    return data;
  } catch (error) {
    console.log(error);
  }
};
export function sortDatesAscending(dates) {
  const dateObjects = dates.map((date) => new Date(date));
  return dateObjects.sort((a, b) => a - b);
}
export function ymdFormat(dates) {
  const dateObjects = dates.map((date) => new Date(date));
  const formatedDates = dateObjects.map((date) => {
    return moment(date).format("YYYY-MM-DD");
  });
  return formatedDates;
}
export function dateDiffInDays(date1, date2) {
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();
  var difference_ms = Math.abs(date1_ms - date2_ms);
  return Math.floor(difference_ms / (1000 * 60 * 60 * 24));
}
export const stringShortner = (string) => {
  if (string?.length > 20) {
    return string.substring(0, 20) + "..";
  }
  else{
    return string
  }
};
