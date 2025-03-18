const imageDataToCanvas = (imageData: ImageData): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("Canvas context not supported.");
    return canvas;
  }

  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0); // Ensure imageData is drawn onto the canvas

  return canvas;
};

const flipFrameHorizontally = (
  imageData: ImageData,
  isMirrored: boolean
): HTMLCanvasElement => {
  const sourceCanvas = imageDataToCanvas(imageData); // Convert first
  const flippedCanvas = document.createElement("canvas");
  const flippedCtx = flippedCanvas.getContext("2d");

  flippedCanvas.width = sourceCanvas.width;
  flippedCanvas.height = sourceCanvas.height;

  if (!flippedCtx) {
    console.error("Flipped canvas context is not supported.");
    return flippedCanvas;
  }

  if (isMirrored) {
    // Apply transformation only when mirroring is needed
    flippedCtx.translate(flippedCanvas.width, 0);
    flippedCtx.scale(-1, 1);
  }

  // Always draw the image at (0,0)
  flippedCtx.drawImage(sourceCanvas, isMirrored ? 0 : 0, 0);

  return flippedCanvas;
};

export { imageDataToCanvas, flipFrameHorizontally };
