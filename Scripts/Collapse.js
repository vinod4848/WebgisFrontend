// map
const mapElement = document.getElementById("map");
// side nav 1
const sideNavOne = document.getElementsByClassName("sidenav1")[0];
const collapseLeft = document.getElementById("collapse-left");
// side nav 2
const sideNavTwo = document.getElementsByClassName("sidenav2")[0];
const collapseRight = document.getElementById("collapse-right");
//top nav
const secondNav = document.getElementById("secondnav");
const collapseTop = document.getElementById("collapse-top");
// tooltop
const tooltipElement = document.getElementsByClassName("tool-tip")[0];

collapseLeft.addEventListener("click", () => {
  if (sideNavOne.style.display == "none") {
    sideNavOne.style.display = "block";
    collapseLeft.style.left = "25%";
    collapseLeft.innerHTML = "<";
  } else {
    sideNavOne.style.display = "none";
    collapseLeft.style.left = "0px";
    collapseLeft.innerHTML = ">";
  }
});
collapseRight.addEventListener("click", () => {
  if (sideNavTwo.style.display == "none") {
    sideNavTwo.style.display = "block";
    collapseRight.style.right = "25%";
    collapseRight.innerHTML = ">";
    tooltipElement.style.right = "26%";
  } else {
    sideNavTwo.style.display = "none";
    collapseRight.style.right = "0px";
    collapseRight.innerHTML = "<";
    tooltipElement.style.right = "1%";
  }
});

collapseTop.addEventListener("click", () => {
  if (secondNav.style.display == "none") {
    secondNav.style.display = "block";
    // collapseTop.style.right = "25%";
    collapseTop.innerHTML = "<";
    sideNavOne.style.height = "77.9vh";
    sideNavTwo.style.height = "77.9vh";
    mapElement.style.height = "77.9vh";
  } else {
    secondNav.style.display = "none";
    // collapseTop.style.right = "0px";
    collapseTop.innerHTML = ">";
    sideNavOne.style.height = "89.7vh";
    sideNavTwo.style.height = "89.7vh";
    mapElement.style.height = "89.7vh";
  }
});
