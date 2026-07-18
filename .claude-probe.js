const sharp = require("sharp");

(async () => {
  const img = sharp("rightimage.jpeg");
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Weighted centroid of brightness within a window around the known core,
  // restricted above the tablet (y < 480) so the beam/tablet glow doesn't
  // pull the centroid down.
  let sumX = 0, sumY = 0, sumW = 0;
  const x0 = 250, x1 = 730, y0 = 60, y1 = 480;
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const idx = (y * width + x) * channels;
      const b = data[idx] + data[idx + 1] + data[idx + 2];
      // Only count meaningfully bright pixels so empty black space doesn't
      // just drag everything toward the window's own geometric center.
      if (b > 90) {
        sumX += x * b;
        sumY += y * b;
        sumW += b;
      }
    }
  }
  console.log("weighted centroid:", { x: sumX / sumW, y: sumY / sumW });

  // Also: pure dense-core centroid using a much higher brightness threshold
  let sumX2 = 0, sumY2 = 0, sumW2 = 0;
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const idx = (y * width + x) * channels;
      const b = data[idx] + data[idx + 1] + data[idx + 2];
      if (b > 300) {
        sumX2 += x * b;
        sumY2 += y * b;
        sumW2 += b;
      }
    }
  }
  console.log("dense-core centroid (b>300):", { x: sumX2 / sumW2, y: sumY2 / sumW2 });
})();
