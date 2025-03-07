// components/PhotoStrip/index.tsx
import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useCallback,
  useMemo,
} from "react";
import { LAYOUTS } from "../../constants";

interface Photo {
  id: string;
  url: string;
}

interface Sticker {
  id: number;
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface PhotoStripProps {
  photos: Photo[];
  frameColor: string;
  backgroundImage: string | null;
  layout: number;
  foregroundImage: string | null;
  stickers: Sticker[];
  setStickers: React.Dispatch<React.SetStateAction<Sticker[]>>;
}

const PhotoStrip = forwardRef<HTMLDivElement, PhotoStripProps>(
  (
    {
      photos,
      frameColor,
      backgroundImage,
      layout,
      foregroundImage,
      stickers,
      setStickers,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedSticker, setSelectedSticker] = useState<number | null>(null);
    const [dragging, setDragging] = useState<
      "move" | "resize" | "rotate" | null
    >(null);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [resizeHandle, setResizeHandle] = useState<number | null>(null);

    const HANDLE_SIZE = 10;

    const currentLayout = LAYOUTS[layout];
    const maxPhotos = currentLayout.maxPhotos;
    const stripWidth = currentLayout.width;
    const stripHeight = currentLayout.height;
    const PADDING_TOP = currentLayout.paddings?.top || 0.15 * 96;
    const PADDING_LEFT = currentLayout.paddings?.left || 0.15 * 96;
    const PADDING_BOTTOM = currentLayout.paddings?.bottom || 0.15 * 96;
    const PADDING_RIGHT = currentLayout.paddings?.right || 0.15 * 96;
    const GAP = currentLayout.gap || 0.1 * 96;

    const isGrid = currentLayout.arrangement === "grid";
    const arrangement = currentLayout.arrangement;
    const gridColumns = currentLayout.gridTemplate?.columns || 1;
    const gridRows = currentLayout.gridTemplate?.rows || 1;

    const photoSize = useMemo<{ width: number; height: number }>(() => {
      let width = 0,
        height = 0;
      if (arrangement === "grid") {
        width =
          (stripWidth -
            PADDING_LEFT -
            PADDING_RIGHT -
            (gridColumns - 1) * GAP) /
          gridColumns;
        height =
          (stripHeight - PADDING_TOP - PADDING_BOTTOM - (gridRows - 1) * GAP) /
          gridRows;
      } else if (arrangement === "vertical") {
        width = stripWidth - PADDING_LEFT - PADDING_RIGHT;
        height =
          (stripHeight - PADDING_TOP - PADDING_BOTTOM - (maxPhotos - 1) * GAP) /
          maxPhotos;
      } else {
        width =
          (stripWidth - PADDING_LEFT - PADDING_RIGHT - (maxPhotos - 1) * GAP) /
          maxPhotos;
        height = stripHeight - PADDING_TOP - PADDING_BOTTOM;
      }
      return { width, height };
    }, [
      stripWidth,
      stripHeight,
      arrangement,
      maxPhotos,
      GAP,
      PADDING_TOP,
      PADDING_BOTTOM,
      PADDING_LEFT,
      PADDING_RIGHT,
      gridColumns,
      gridRows,
    ]);

    const backgroundImg = useRef<HTMLImageElement | null>(null);
    const foregroundImg = useRef<HTMLImageElement | null>(null);
    const photoImages = useRef<(HTMLImageElement | null)[]>([]);

    const autoCropImage = (
      src: string,
      callback: (croppedImg: HTMLImageElement) => void
    ) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = photoSize.width;
        canvas.height = photoSize.height;

        const aspectRatio = photoSize.width / photoSize.height;
        const imgAspectRatio = img.width / img.height;

        let sx, sy, sWidth, sHeight;
        if (imgAspectRatio > aspectRatio) {
          sHeight = img.height;
          sWidth = sHeight * aspectRatio;
          sx = (img.width - sWidth) / 2;
          sy = 0;
        } else {
          sWidth = img.width;
          sHeight = sWidth / aspectRatio;
          sx = 0;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(
          img,
          sx,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          photoSize.width,
          photoSize.height
        );

        const croppedImg = new Image();
        croppedImg.onload = () => callback(croppedImg);
        croppedImg.src = canvas.toDataURL("image/jpeg");
      };
      img.src = src;
    };

    useEffect(() => {
      // Preload background image
      if (backgroundImage) {
        const img = new Image();
        img.src = backgroundImage;
        img.onload = () => {
          backgroundImg.current = img;
          redrawCanvas();
        };
      } else {
        backgroundImg.current = null;
        redrawCanvas();
      }

      // Preload foreground image
      if (foregroundImage) {
        const img = new Image();
        img.src = foregroundImage;
        img.onload = () => {
          foregroundImg.current = img;
          redrawCanvas();
        };
      } else {
        foregroundImg.current = null;
        redrawCanvas();
      }

      // Crop & preload photos
      photoImages.current = [];
      photos.forEach((photo, index) => {
        autoCropImage(photo.url, (croppedImg) => {
          photoImages.current[index] = croppedImg;
          if (photoImages.current.length === photos.length) {
            while (photoImages.current.length < maxPhotos) {
              photoImages.current.push(null);
            }
            redrawCanvas();
          }
        });
      });

      if (photos.length === 0) {
        photoImages.current = Array(maxPhotos).fill(null);
        redrawCanvas();
      }
    }, [
      photos,
      stickers,
      selectedSticker,
      backgroundImage,
      frameColor,
      foregroundImage,
      layout,
      maxPhotos,
      photoSize,
    ]);

    const redrawCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = stripWidth;
      canvas.height = stripHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Background
      if (backgroundImg.current) {
        ctx.drawImage(backgroundImg.current, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = frameColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 2. Draw Photos or Placeholder
      if (isGrid) {
        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridColumns; col++) {
            const index = row * gridColumns + col;
            if (index >= maxPhotos) break;

            const xPosition = PADDING_LEFT + col * (photoSize.width + GAP);
            const yPosition = PADDING_TOP + row * (photoSize.height + GAP);
            const photoImg = photoImages.current[index];

            if (photoImg) {
              ctx.drawImage(
                photoImg,
                xPosition,
                yPosition,
                photoSize.width,
                photoSize.height
              );
            } else {
              ctx.strokeStyle = "#999";
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]);
              ctx.strokeRect(
                xPosition,
                yPosition,
                photoSize.width,
                photoSize.height
              );
              ctx.setLineDash([]);
              ctx.fillStyle = "#999";
              ctx.font = "40px Arial";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(
                "+",
                xPosition + photoSize.width / 2,
                yPosition + photoSize.height / 2
              );
            }
          }
        }
      } else {
        for (let index = 0; index < maxPhotos; index++) {
          const xPosition =
            arrangement === "vertical"
              ? PADDING_LEFT
              : PADDING_LEFT + index * (photoSize.width + GAP);
          const yPosition =
            arrangement === "vertical"
              ? PADDING_TOP + index * (photoSize.height + GAP)
              : PADDING_TOP;
          const photoImg = photoImages.current[index];

          if (photoImg) {
            ctx.drawImage(
              photoImg,
              xPosition,
              yPosition,
              photoSize.width,
              photoSize.height
            );
          } else {
            ctx.strokeStyle = "#999";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(
              xPosition,
              yPosition,
              photoSize.width,
              photoSize.height
            );
            ctx.setLineDash([]);
            ctx.fillStyle = "#999";
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              "+",
              xPosition + photoSize.width / 2,
              yPosition + photoSize.height / 2
            );
          }
        }
      }

      // 3. Draw Foreground
      if (foregroundImg.current) {
        ctx.drawImage(foregroundImg.current, 0, 0, canvas.width, canvas.height);
      }

      // 4. Draw Stickers
      stickers.forEach((sticker) => {
        ctx.save();
        ctx.translate(sticker.x, sticker.y);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.drawImage(
          sticker.image,
          -sticker.width / 2,
          -sticker.height / 2,
          sticker.width,
          sticker.height
        );
        ctx.restore();

        if (selectedSticker === sticker.id) {
          ctx.save();
          ctx.translate(sticker.x, sticker.y);
          ctx.rotate((sticker.rotation * Math.PI) / 180);

          ctx.strokeStyle = "blue";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            -sticker.width / 2,
            -sticker.height / 2,
            sticker.width,
            sticker.height
          );

          ctx.fillStyle = "white";
          ctx.strokeStyle = "blue";
          const handles = [
            [-sticker.width / 2, -sticker.height / 2],
            [sticker.width / 2, -sticker.height / 2],
            [sticker.width / 2, sticker.height / 2],
            [-sticker.width / 2, sticker.height / 2],
          ];
          handles.forEach(([x, y]) => {
            ctx.fillRect(
              x - HANDLE_SIZE / 2,
              y - HANDLE_SIZE / 2,
              HANDLE_SIZE,
              HANDLE_SIZE
            );
            ctx.strokeRect(
              x - HANDLE_SIZE / 2,
              y - HANDLE_SIZE / 2,
              HANDLE_SIZE,
              HANDLE_SIZE
            );
          });

          ctx.fillRect(
            sticker.width / 2 - HANDLE_SIZE / 2,
            -sticker.height / 2 - 20,
            HANDLE_SIZE,
            HANDLE_SIZE
          );
          ctx.strokeRect(
            sticker.width / 2 - HANDLE_SIZE / 2,
            -sticker.height / 2 - 20,
            HANDLE_SIZE,
            HANDLE_SIZE
          );

          ctx.fillStyle = "red";
          ctx.beginPath();
          ctx.arc(
            -sticker.width / 2 + 20,
            -sticker.height / 2 - 20,
            10,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.fillStyle = "white";
          ctx.font = "12px Arial";
          ctx.fillText("X", -sticker.width / 2 + 15, -sticker.height / 2 - 15);

          ctx.restore();
        }
      });
    }, [
      stripWidth,
      stripHeight,
      frameColor,
      isGrid,
      maxPhotos,
      gridColumns,
      gridRows,
      photoSize,
      PADDING_LEFT,
      PADDING_TOP,
      GAP,
      stickers,
      selectedSticker,
    ]);

    const getStickerAtPoint = (x: number, y: number, sticker: Sticker) => {
      const cos = Math.cos((-sticker.rotation * Math.PI) / 180);
      const sin = Math.sin((-sticker.rotation * Math.PI) / 180);
      const dx = x - sticker.x;
      const dy = y - sticker.y;
      const transformedX = dx * cos - dy * sin;
      const transformedY = dx * sin + dy * cos;

      const left = -sticker.width / 2;
      const right = sticker.width / 2;
      const top = -sticker.height / 2;
      const bottom = sticker.height / 2;

      const inBounds =
        transformedX >= left &&
        transformedX <= right &&
        transformedY >= top &&
        transformedY <= bottom;

      const atResizeHandle = [
        [left, top],
        [right, top],
        [right, bottom],
        [left, bottom],
      ]
        .map(([hx, hy], i) => ({
          index: i,
          hit:
            Math.abs(transformedX - hx) < HANDLE_SIZE &&
            Math.abs(transformedY - hy) < HANDLE_SIZE,
        }))
        .find((h) => h.hit);

      const atRotateHandle =
        Math.abs(transformedX - right) < HANDLE_SIZE &&
        Math.abs(transformedY - (top - 20)) < HANDLE_SIZE;

      const atDeleteHandle =
        Math.sqrt(
          (transformedX - (left + 20)) ** 2 + (transformedY - (top - 20)) ** 2
        ) < 10;

      return { inBounds, atResizeHandle, atRotateHandle, atDeleteHandle };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const clickedSticker = stickers.find((sticker) => {
        const hit = getStickerAtPoint(x, y, sticker);
        return (
          hit.inBounds ||
          hit.atResizeHandle ||
          hit.atRotateHandle ||
          hit.atDeleteHandle
        );
      });

      if (clickedSticker) {
        setSelectedSticker(clickedSticker.id);
        const hit = getStickerAtPoint(x, y, clickedSticker);

        if (hit.atDeleteHandle) {
          setStickers((prev) => prev.filter((s) => s.id !== clickedSticker.id));
          setSelectedSticker(null);
        } else if (hit.atResizeHandle) {
          setDragging("resize");
          setResizeHandle(hit.atResizeHandle.index);
        } else if (hit.atRotateHandle) {
          setDragging("rotate");
        } else if (hit.inBounds) {
          setDragging("move");
        }

        setStartX(x);
        setStartY(y);
      } else {
        setSelectedSticker(null);
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (dragging && selectedSticker !== null) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const sticker = stickers.find((s) => s.id === selectedSticker);
        if (!sticker) return;

        const dx = x - startX;
        const dy = y - startY;

        const cos = Math.cos((sticker.rotation * Math.PI) / 180);
        const sin = Math.sin((sticker.rotation * Math.PI) / 180);

        if (dragging === "move") {
          const moveX = dx * cos + dy * sin;
          const moveY = -dx * sin + dy * cos;
          setStickers((prev) =>
            prev.map((s) =>
              s.id === selectedSticker
                ? { ...s, x: s.x + moveX, y: s.y + moveY }
                : s
            )
          );
        } else if (dragging === "resize" && resizeHandle !== null) {
          const handlePoints = [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ];
          const [hx] = handlePoints[resizeHandle];

          const localDx = dx * cos + dy * sin;
          const ratio = sticker.width / sticker.height;

          const newWidth = Math.max(20, sticker.width + hx * localDx);
          const newHeight = newWidth / ratio;

          setStickers((prev) =>
            prev.map((s) =>
              s.id === selectedSticker
                ? { ...s, width: newWidth, height: newHeight }
                : s
            )
          );
        } else if (dragging === "rotate") {
          const centerX = sticker.x;
          const centerY = sticker.y;
          const startAngle = Math.atan2(startY - centerY, startX - centerX);
          const currentAngle = Math.atan2(y - centerY, x - centerX);
          const angleDiff = ((currentAngle - startAngle) * 180) / Math.PI;
          setStickers((prev) =>
            prev.map((s) =>
              s.id === selectedSticker
                ? { ...s, rotation: (s.rotation + angleDiff) % 360 }
                : s
            )
          );
        }

        setStartX(x);
        setStartY(y);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      setResizeHandle(null);
    };

    return (
      <div ref={ref} className="photo-strip">
        <canvas
          ref={canvasRef}
          width={stripWidth}
          height={stripHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            border: "1px solid black",
            cursor: dragging ? "grabbing" : "default",
          }}
        />
      </div>
    );
  }
);

export default PhotoStrip;
