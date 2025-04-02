const filterA = document.getElementById("blur");
const filterB = document.getElementById("contrast");
const filterC = document.getElementById("hue-rotate");
const filterD = document.getElementById("sepia");

const noFlipBtn = document.getElementById("no-flip");
const flipXBtn = document.getElementById("flip-x");
const flipYBtn = document.getElementById("flip-y");

const uploadButton = document.getElementById("upload-button");
const image = document.getElementById("chosen-image");
const downloadButton = document.getElementById("download-button");

function resetFilter(){

    filterA.value = "0";
    filterB.value = "100";
    filterC.value = "0";
    filterD.value = "0";
    noFlipBtn.checked = true;
}

resetFilter();
