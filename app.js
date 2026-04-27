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

function getImageData(ctx, canvas) {
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function putImageData(ctx, imageData) {
  ctx.putImageData(imageData, 0, 0);
}

function normalizeShift(shift, size) {
  let result = shift % size;
  if (result < 0) {
    result += size;
  }
  return result;
}

function createRowShifts(seed, width, height) {
  const shifts = [];

  for (let y = 0; y < height; y++) {
    const shift = normalizeShift(seed + y * 7, width);
    shifts.push(shift);
  }

  return shifts;
}

function createColumnShifts(seed, width, height) {
  const shifts = [];

  for (let x = 0; x < width; x++) {
    const shift = normalizeShift(seed + x * 11, height);
    shifts.push(shift);
  }

  return shifts;
}

function shiftRowsByArray(imageData, rowShifts) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const result = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    const shift = normalizeShift(rowShifts[y], width);

    for (let x = 0; x < width; x++) {
      const newX = (x + shift) % width;

      const oldIndex = (y * width + x) * 4;
      const newIndex = (y * width + newX) * 4;

      result[newIndex] = data[oldIndex];
      result[newIndex + 1] = data[oldIndex + 1];
      result[newIndex + 2] = data[oldIndex + 2];
      result[newIndex + 3] = data[oldIndex + 3];
    }
  }

  return new ImageData(result, width, height);
}

function shiftColumnsByArray(imageData, columnShifts) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const result = new Uint8ClampedArray(data.length);

  for (let x = 0; x < width; x++) {
    const shift = normalizeShift(columnShifts[x], height);

    for (let y = 0; y < height; y++) {
      const newY = (y + shift) % height;

      const oldIndex = (y * width + x) * 4;
      const newIndex = (newY * width + x) * 4;

      result[newIndex] = data[oldIndex];
      result[newIndex + 1] = data[oldIndex + 1];
      result[newIndex + 2] = data[oldIndex + 2];
      result[newIndex + 3] = data[oldIndex + 3];
    }
  }

  return new ImageData(result, width, height);
}

function scrambleStage1(imageData, seed) {
  const width = imageData.width;
  const height = imageData.height;

  const rowShifts = createRowShifts(seed, width, height);
  const columnShifts = createColumnShifts(seed * 2 + 5, width, height);

  const rowsShifted = shiftRowsByArray(imageData, rowShifts);
  const fullyShifted = shiftColumnsByArray(rowsShifted, columnShifts);

  return fullyShifted;
}

function unscrambleStage1(imageData, seed) {
  const width = imageData.width;
  const height = imageData.height;

  const rowShifts = createRowShifts(seed, width, height);
  const columnShifts = createColumnShifts(seed * 2 + 5, width, height);

  const inverseColumnShifts = columnShifts.map((value) => -value);
  const inverseRowShifts = rowShifts.map((value) => -value);

  const columnsRestored = shiftColumnsByArray(imageData, inverseColumnShifts);
  const fullyRestored = shiftRowsByArray(columnsRestored, inverseRowShifts);

  return fullyRestored;
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
  const seed = parseInt(seedInput.value, 10) || 10;
  const imageData = getImageData(originalCtx, originalCanvas);

  if (selectedStage === "1") {
    const scrambled = scrambleStage1(imageData, seed);

    scrambledCtx.clearRect(0, 0, scrambledCanvas.width, scrambledCanvas.height);
    putImageData(scrambledCtx, scrambled);

    setStatus("wykonano Scramble dla etapu 1");
    return;
  }

  scrambledCtx.clearRect(0, 0, scrambledCanvas.width, scrambledCanvas.height);
  scrambledCtx.drawImage(currentImage, 0, 0);
  setStatus("test Scramble: etapy 2 i 3 jeszcze nie są zaimplementowane");
});

unscrambleBtn.addEventListener("click", function () {
  if (!currentImage) {
    setStatus("najpierw wczytaj obraz");
    return;
  }

  const selectedStage = stageSelect.value;
  const seed = parseInt(seedInput.value, 10) || 10;

  if (selectedStage === "1") {
    const imageData = getImageData(scrambledCtx, scrambledCanvas);
    const restored = unscrambleStage1(imageData, seed);

    restoredCtx.clearRect(0, 0, restoredCanvas.width, restoredCanvas.height);
    putImageData(restoredCtx, restored);

    setStatus("wykonano Unscramble dla etapu 1");
    return;
  }

  restoredCtx.clearRect(0, 0, restoredCanvas.width, restoredCanvas.height);
  restoredCtx.drawImage(currentImage, 0, 0);
  setStatus("test Unscramble: etapy 2 i 3 jeszcze nie są zaimplementowane");
});