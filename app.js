const imageInput = document.getElementById("imageInput");
const stageSelect = document.getElementById("stageSelect");
const seedInput = document.getElementById("seedInput");
const wrongSeedInput = document.getElementById("wrongSeedInput");

const scrambleBtn = document.getElementById("scrambleBtn");
const unscrambleBtn = document.getElementById("unscrambleBtn");
const wrongUnscrambleBtn = document.getElementById("wrongUnscrambleBtn");
const saveScrambledBtn = document.getElementById("saveScrambledBtn");
const saveRestoredBtn = document.getElementById("saveRestoredBtn");

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

function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function normalizeShift(shift, size) {
  let result = shift % size;
  if (result < 0) {
    result += size;
  }
  return result;
}

/* =========================
   ETAP 1 - NAIWNY SCRAMBLING
   ========================= */

function createRowShifts(seed, width, height) {
  const shifts = [];

  for (let y = 0; y < height; y++) {
    const rawShift = seed * (y + 3) + y * y * 17 + 31;
    shifts.push(normalizeShift(rawShift, width));
  }

  return shifts;
}

function createColumnShifts(seed, width, height) {
  const shifts = [];

  for (let x = 0; x < width; x++) {
    const rawShift = seed * (x + 5) + x * x * 19 + 47;
    shifts.push(normalizeShift(rawShift, height));
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

/* =========================
   ETAP 2 - CZYSTA PERMUTACJA
   ========================= */

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

/* =========================
   ETAP 3 - WERSJA WZMOCNIONA
   ========================= */

function buildKeystream(length, seed) {
  const stream = new Uint8Array(length);
  const random = createPRNG(seed);

  for (let i = 0; i < length; i++) {
    stream[i] = Math.floor(random() * 256);
  }

  return stream;
}

function substitutePixels(imageData, seed) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const result = new Uint8ClampedArray(data.length);

  const stream = buildKeystream(width * height * 3, seed);
  let streamIndex = 0;

  for (let i = 0; i < data.length; i += 4) {
    result[i] = (data[i] + stream[streamIndex++]) % 256;
    result[i + 1] = (data[i + 1] + stream[streamIndex++]) % 256;
    result[i + 2] = (data[i + 2] + stream[streamIndex++]) % 256;
    result[i + 3] = data[i + 3];
  }

  return new ImageData(result, width, height);
}

function inverseSubstitutePixels(imageData, seed) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const result = new Uint8ClampedArray(data.length);

  const stream = buildKeystream(width * height * 3, seed);
  let streamIndex = 0;

  for (let i = 0; i < data.length; i += 4) {
    result[i] = (data[i] - stream[streamIndex++] + 256) % 256;
    result[i + 1] = (data[i + 1] - stream[streamIndex++] + 256) % 256;
    result[i + 2] = (data[i + 2] - stream[streamIndex++] + 256) % 256;
    result[i + 3] = data[i + 3];
  }

  return new ImageData(result, width, height);
}

function scrambleStage3(imageData, seed) {
  const permuted = scrambleStage2(imageData, seed);
  const substituted = substitutePixels(permuted, seed * 3 + 17);
  return substituted;
}

function unscrambleStage3(imageData, seed) {
  const unsubstituted = inverseSubstitutePixels(imageData, seed * 3 + 17);
  const restored = unscrambleStage2(unsubstituted, seed);
  return restored;
}

/* =========================
   WSPÓLNE
   ========================= */

function scrambleByStage(imageData, stage, seed) {
  if (stage === "1") {
    return scrambleStage1(imageData, seed);
  }

  if (stage === "2") {
    return scrambleStage2(imageData, seed);
  }

  if (stage === "3") {
    return scrambleStage3(imageData, seed);
  }

  return imageData;
}

function unscrambleByStage(imageData, stage, seed) {
  if (stage === "1") {
    return unscrambleStage1(imageData, seed);
  }

  if (stage === "2") {
    return unscrambleStage2(imageData, seed);
  }

  if (stage === "3") {
    return unscrambleStage3(imageData, seed);
  }

  return imageData;
}

function downloadCanvas(canvas, filename) {
  if (canvas.width === 0 || canvas.height === 0) {
    setStatus("brak obrazu do zapisania");
    return;
  }

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}

/* =========================
   ZDARZENIA
   ========================= */

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

      clearCanvas(originalCtx, originalCanvas);
      clearCanvas(scrambledCtx, scrambledCanvas);
      clearCanvas(restoredCtx, restoredCanvas);

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

  const stage = stageSelect.value;
  const seed = parseInt(seedInput.value, 10) || 10;
  const imageData = getImageData(originalCtx, originalCanvas);

  const scrambled = scrambleByStage(imageData, stage, seed);

  clearCanvas(scrambledCtx, scrambledCanvas);
  putImageData(scrambledCtx, scrambled);

  clearCanvas(restoredCtx, restoredCanvas);

  setStatus("wykonano Scramble dla etapu " + stage);
});

unscrambleBtn.addEventListener("click", function () {
  if (!currentImage) {
    setStatus("najpierw wczytaj obraz");
    return;
  }

  const stage = stageSelect.value;
  const seed = parseInt(seedInput.value, 10) || 10;
  const imageData = getImageData(scrambledCtx, scrambledCanvas);

  const restored = unscrambleByStage(imageData, stage, seed);

  clearCanvas(restoredCtx, restoredCanvas);
  putImageData(restoredCtx, restored);

  setStatus("wykonano Unscramble dla etapu " + stage + " przy poprawnym kluczu");
});

wrongUnscrambleBtn.addEventListener("click", function () {
  if (!currentImage) {
    setStatus("najpierw wczytaj obraz");
    return;
  }

  const stage = stageSelect.value;
  const wrongSeed = parseInt(wrongSeedInput.value, 10) || 11;
  const imageData = getImageData(scrambledCtx, scrambledCanvas);

  const restored = unscrambleByStage(imageData, stage, wrongSeed);

  clearCanvas(restoredCtx, restoredCanvas);
  putImageData(restoredCtx, restored);

  setStatus("wykonano Unscramble dla etapu " + stage + " przy błędnym kluczu");
});

saveScrambledBtn.addEventListener("click", function () {
  const stage = stageSelect.value;
  downloadCanvas(scrambledCanvas, "scrambled_stage_" + stage + ".png");
  setStatus("zapisano obraz scrambled");
});

saveRestoredBtn.addEventListener("click", function () {
  const stage = stageSelect.value;
  downloadCanvas(restoredCanvas, "restored_stage_" + stage + ".png");
  setStatus("zapisano obraz restored");
});