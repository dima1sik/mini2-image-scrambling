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

function createPRNG(seed) {
  let state = seed >>> 0;

  if (state === 0) {
    state = 123456789;
  }

  return function () {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function buildPermutation(length, seed) {
  const permutation = new Uint32Array(length);

  for (let i = 0; i < length; i++) {
    permutation[i] = i;
  }

  const random = createPRNG(seed);

  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));

    const temp = permutation[i];
    permutation[i] = permutation[j];
    permutation[j] = temp;
  }

  return permutation;
}

function invertPermutation(permutation) {
  const inverse = new Uint32Array(permutation.length);

  for (let i = 0; i < permutation.length; i++) {
    inverse[permutation[i]] = i;
  }

  return inverse;
}

function permutePixels(imageData, permutation) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const result = new Uint8ClampedArray(data.length);

  const pixelCount = width * height;

  for (let oldPixelIndex = 0; oldPixelIndex < pixelCount; oldPixelIndex++) {
    const newPixelIndex = permutation[oldPixelIndex];

    const oldOffset = oldPixelIndex * 4;
    const newOffset = newPixelIndex * 4;

    result[newOffset] = data[oldOffset];
    result[newOffset + 1] = data[oldOffset + 1];
    result[newOffset + 2] = data[oldOffset + 2];
    result[newOffset + 3] = data[oldOffset + 3];
  }

  return new ImageData(result, width, height);
}

function scrambleStage2(imageData, seed) {
  const pixelCount = imageData.width * imageData.height;
  const permutation = buildPermutation(pixelCount, seed);
  return permutePixels(imageData, permutation);
}

function unscrambleStage2(imageData, seed) {
  const pixelCount = imageData.width * imageData.height;
  const permutation = buildPermutation(pixelCount, seed);
  const inversePermutation = invertPermutation(permutation);
  return permutePixels(imageData, inversePermutation);
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

  if (selectedStage === "2") {
    const scrambled = scrambleStage2(imageData, seed);

    scrambledCtx.clearRect(0, 0, scrambledCanvas.width, scrambledCanvas.height);
    putImageData(scrambledCtx, scrambled);

    setStatus("wykonano Scramble dla etapu 2");
    return;
  }

  scrambledCtx.clearRect(0, 0, scrambledCanvas.width, scrambledCanvas.height);
  scrambledCtx.drawImage(currentImage, 0, 0);
  setStatus("test Scramble: etap 3 jeszcze nie jest zaimplementowany");
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

  if (selectedStage === "2") {
    const imageData = getImageData(scrambledCtx, scrambledCanvas);
    const restored = unscrambleStage2(imageData, seed);

    restoredCtx.clearRect(0, 0, restoredCanvas.width, restoredCanvas.height);
    putImageData(restoredCtx, restored);

    setStatus("wykonano Unscramble dla etapu 2");
    return;
  }

  restoredCtx.clearRect(0, 0, restoredCanvas.width, restoredCanvas.height);
  restoredCtx.drawImage(currentImage, 0, 0);
  setStatus("test Unscramble: etap 3 jeszcze nie jest zaimplementowany");
});