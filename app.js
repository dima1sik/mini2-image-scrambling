const imageInput = document.getElementById("imageInput");
const stageSelect = document.getElementById("stageSelect");
const seedInput = document.getElementById("seedInput");
const scrambleBtn = document.getElementById("scrambleBtn");
const unscrambleBtn = document.getElementById("unscrambleBtn");
const statusText = document.getElementById("statusText");

const originalCanvas = document.getElementById("originalCanvas");
const scrambledCanvas = document.getElementById("scrambledCanvas");
const restoredCanvas = document.getElementById("restoredCanvas");

const originalCtx = originalCanvas.getContext("2d");
const scrambledCtx = scrambledCanvas.getContext("2d");
const restoredCtx = restoredCanvas.getContext("2d");

let currentImage = null;

function setStatus(message) {
  statusText.textContent = "Status: " + message;
}

function fitCanvasToImage(canvas, image) {
  canvas.width = image.width;
  canvas.height = image.height;
}

imageInput.addEventListener("change", function (event) {
  const file = event.target.files[0];

  if (!file) {
    setStatus("nie wybrano obrazu");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const img = new Image();

    img.onload = function () {
      currentImage = img;

      fitCanvasToImage(originalCanvas, img);
      fitCanvasToImage(scrambledCanvas, img);
      fitCanvasToImage(restoredCanvas, img);

      originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
      scrambledCtx.clearRect(0, 0, scrambledCanvas.width, scrambledCanvas.height);
      restoredCtx.clearRect(0, 0, restoredCanvas.width, restoredCanvas.height);

      originalCtx.drawImage(img, 0, 0);
      setStatus("obraz został wczytany");
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
});

scrambleBtn.addEventListener("click", function () {
  if (!currentImage) {
    setStatus("najpierw wczytaj obraz");
    return;
  }

  const selectedStage = stageSelect.value;
  const seed = seedInput.value.trim();

  scrambledCtx.clearRect(0, 0, scrambledCanvas.width, scrambledCanvas.height);
  scrambledCtx.drawImage(currentImage, 0, 0);

  setStatus("test Scramble: etap " + selectedStage + ", klucz " + seed);
});

unscrambleBtn.addEventListener("click", function () {
  if (!currentImage) {
    setStatus("najpierw wczytaj obraz");
    return;
  }

  restoredCtx.clearRect(0, 0, restoredCanvas.width, restoredCanvas.height);
  restoredCtx.drawImage(currentImage, 0, 0);

  setStatus("test Unscramble");
});