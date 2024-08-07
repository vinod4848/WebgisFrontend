const cursorBtn = document.getElementById("cursor");
const areaBtn = document.getElementById("areaBtn");
const lineBtn = document.getElementById("lineBtn");
const locateBtn = document.getElementById("locate");
const unitConversion = document.getElementById("unitConversion");
const acresOption = document.getElementById("acres");
const hectaresOption = document.getElementById("hectares");
let activeInteraction = null;
const interactions = {
  select: selectInteraction,
  line: drawLine,
  polygon: drawPolygon,
  pin: placePin,
};
export function setActiveInteraction(newInteraction, activeBtn, map) {
  map.removeInteraction(activeInteraction);
  map.addInteraction(newInteraction);
  activeInteraction = newInteraction;

  [cursorBtn, areaBtn, lineBtn, locateBtn].forEach((btn) => {
    btn.style.backgroundColor = btn === activeBtn ? "#636363" : "transparent";
  });
}

cursorBtn.addEventListener("click", function () {
  setActiveInteraction(interactions.select, cursorBtn);
  unitConversion.disabled = false;
  acresOption.disabled = true;
  hectaresOption.disabled = true;
});

lineBtn.addEventListener("click", function () {
  setActiveInteraction(interactions.line, lineBtn);
  unitConversion.value = "meters";
  unitConversion.disabled = false;
  acresOption.disabled = true;
  hectaresOption.disabled = true;
});

areaBtn.addEventListener("click", function () {
  setActiveInteraction(interactions.polygon, areaBtn);
  unitConversion.disabled = false;
  acresOption.disabled = false;
  hectaresOption.disabled = false;
});

locateBtn.addEventListener("click", function () {
  setActiveInteraction(interactions.pin, locateBtn);
  unitConversion.disabled = false;
  acresOption.disabled = true;
  hectaresOption.disabled = true;
});
