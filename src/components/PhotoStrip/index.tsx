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
    const [dragging, setDragging] = useState<"move" | "resize" | "rotate" | null>(null);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [resizeHandle, setResizeHandle] = useState<number | null>(null);

    const HANDLE_SIZE = 10;
    const SCALE_FACTOR = 2; // Tăng gấp đôi kích thước canvas để giữ độ nét

    const currentLayout = LAYOUTS[layout];
    const maxPhotos = currentLayout.maxPhotos;
    const stripWidth = currentLayout.width * SCALE_FACTOR;
    const stripHeight = currentLayout.height * SCALE_FACTOR;
    const PADDING_TOP = (currentLayout.paddings?.top || 0.15 * 96) * SCALE_FACTOR;
    const PADDING_LEFT = (currentLayout.paddings?.left || 0.15 * 96) * SCALE_FACTOR;
    const PADDING_BOTTOM = (currentLayout.paddings?.bottom || 0.15 * 96) * SCALE_FACTOR;
    const PADDING_RIGHT = (currentLayout.paddings?.right || 0.15 * 96) * SCALE_FACTOR;
    const GAP = (currentLayout.gap || 0.1 * 96) * SCALE_FACTOR;

    const isGrid = currentLayout.arrangement === "grid";
    const arrangement = currentLayout.arrangement;
    const gridColumns = currentLayout.gridTemplate?.columns || 1;
    const gridRows = currentLayout.gridTemplate?.rows || 1;

    const photoSize = useMemo<{ width: number; height: number }>(() => {
      let width = 0,
        height = 0;
      if (arrangement === "grid") {
        width =
          (stripWidth - PADDING_LEFT - PADDING_RIGHT - (gridColumns - 1) * GAP) /
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
        croppedImg.src = canvas.toDataURL("image/jpeg", 1.0); // Chất lượng tối đa
      };
      img.src = src;
    };

    useEffect(() => {
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
      ctx.imageSmoothingEnabled = true; // Giữ chất lượng khi vẽ
      ctx.imageSmoothingQuality = "high";

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (backgroundImg.current) {
        ctx.drawImage(backgroundImg.current, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = frameColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

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
              ctx.lineWidth = 2 * SCALE_FACTOR;
              ctx.setLineDash([5 * SCALE_FACTOR, 5 * SCALE_FACTOR]);
              ctx.strokeRect(
                xPosition,
                yPosition,
                photoSize.width,
                photoSize.height
              );
              ctx.setLineDash([]);
              ctx.fillStyle = "#999";
              ctx.font = `${40 * SCALE_FACTOR}px Arial`;
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
            ctx.lineWidth = 2 * SCALE_FACTOR;
            ctx.setLineDash([5 * SCALE_FACTOR, 5 * SCALE_FACTOR]);
            ctx.strokeRect(
              xPosition,
              yPosition,
              photoSize.width,
              photoSize.height
            );
            ctx.setLineDash([]);
            ctx.fillStyle = "#999";
            ctx.font = `${40 * SCALE_FACTOR}px Arial`;
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

      if (foregroundImg.current) {
        ctx.drawImage(foregroundImg.current, 0, 0, canvas.width, canvas.height);
      }

      stickers.forEach((sticker) => {
        ctx.save();
        ctx.translate(sticker.x * SCALE_FACTOR, sticker.y * SCALE_FACTOR);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.drawImage(
          sticker.image,
          (-sticker.width * SCALE_FACTOR) / 2,
          (-sticker.height * SCALE_FACTOR) / 2,
          sticker.width * SCALE_FACTOR,
          sticker.height * SCALE_FACTOR
        );
        ctx.restore();

        if (selectedSticker === sticker.id) {
          ctx.save();
          ctx.translate(sticker.x * SCALE_FACTOR, sticker.y * SCALE_FACTOR);
          ctx.rotate((sticker.rotation * Math.PI) / 180);

          ctx.strokeStyle = "blue";
          ctx.lineWidth = 2 * SCALE_FACTOR;
          ctx.strokeRect(
            (-sticker.width * SCALE_FACTOR) / 2,
            (-sticker.height * SCALE_FACTOR) / 2,
            sticker.width * SCALE_FACTOR,
            sticker.height * SCALE_FACTOR
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
              x * SCALE_FACTOR - (HANDLE_SIZE * SCALE_FACTOR) / 2,
              y * SCALE_FACTOR - (HANDLE_SIZE * SCALE_FACTOR) / 2,
              HANDLE_SIZE * SCALE_FACTOR,
              HANDLE_SIZE * SCALE_FACTOR
            );
            ctx.strokeRect(
              x * SCALE_FACTOR - (HANDLE_SIZE * SCALE_FACTOR) / 2,
              y * SCALE_FACTOR - (HANDLE_SIZE * SCALE_FACTOR) / 2,
              HANDLE_SIZE * SCALE_FACTOR,
              HANDLE_SIZE * SCALE_FACTOR
            );
          });

          ctx.fillRect(
            (sticker.width * SCALE_FACTOR) / 2 - (HANDLE_SIZE * SCALE_FACTOR) / 2,
            (-sticker.height * SCALE_FACTOR) / 2 - 20 * SCALE_FACTOR,
            HANDLE_SIZE * SCALE_FACTOR,
            HANDLE_SIZE * SCALE_FACTOR
          );
          ctx.strokeRect(
            (sticker.width * SCALE_FACTOR) / 2 - (HANDLE_SIZE * SCALE_FACTOR) / 2,
            (-sticker.height * SCALE_FACTOR) / 2 - 20 * SCALE_FACTOR,
            HANDLE_SIZE * SCALE_FACTOR,
            HANDLE_SIZE * SCALE_FACTOR
          );

          ctx.fillStyle = "red";
          ctx.beginPath();
          ctx.arc(
            (-sticker.width * SCALE_FACTOR) / 2 + 20 * SCALE_FACTOR,
            (-sticker.height * SCALE_FACTOR) / 2 - 20 * SCALE_FACTOR,
            10 * SCALE_FACTOR,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.fillStyle = "white";
          ctx.font = `${12 * SCALE_FACTOR}px Arial`;
          ctx.fillText(
            "X",
            (-sticker.width * SCALE_FACTOR) / 2 + 15 * SCALE_FACTOR,
            (-sticker.height * SCALE_FACTOR) / 2 - 15 * SCALE_FACTOR
          );

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

    // ... (phần còn lại của logic sticker dragging không thay đổi)

    return (
      <div ref={ref} className="photo-strip">
        <canvas
          ref={canvasRef}
          style={{
            width: `${stripWidth / SCALE_FACTOR}px`, // Hiển thị kích thước gốc
            height: `${stripHeight / SCALE_FACTOR}px`,
          }}
        />
      </div>
    );
  }
);

export default PhotoStrip;