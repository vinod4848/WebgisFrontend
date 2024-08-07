export const formatLength = (line, unit) => {
    const length = ol.sphere.getLength(line);
    let output;
    switch (unit) {
      case "meters":
        output = `${length.toFixed(2)} m`;
        break;
      case "kilometers":
        output = `${(length / 1000).toFixed(2)} km`;
        break;
      case "miles":
        output = `${(length / 1609.34).toFixed(2)} miles`;
        break;
      case "feet":
        output = `${(length / 0.3048).toFixed(2)} ft`;
        break;
      default:
        output = "Unit not supported";
    }
    return output;
  };
  
  export const formatArea = (polygon, unit) => {
    const area = ol.sphere.getArea(polygon);
    let output;
    switch (unit) {
      case "meters":
        output = `${area.toFixed(2)} m²`;
        break;
      case "kilometers":
        output = `${(area / 1e6).toFixed(2)} km²`;
        break;
      case "miles":
        output = `${(area / 2.58999e6).toFixed(2)} mi²`;
        break;
      case "feet":
        output = `${(area * 10.7639).toFixed(2)} ft²`;
        break;
      case "acres":
        output = `${(area / 4046.86).toFixed(2)} acres`;
        break;
      case "hectares":
        output = `${(area / 10000).toFixed(2)} hectares`;
        break;
      default:
        output = "Unit not supported";
    }
    return output;
  };
  
  export const convertUnit = (value, unit, isArea) => {
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
    };
  
    const units = isArea ? areaUnits : lengthUnits;
    const unitSuffix = units[unit];
  
    return unitSuffix ? `${parseFloat(value)}${unitSuffix}` : "Unit not supported";
  };
  
  