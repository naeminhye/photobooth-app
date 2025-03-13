import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useCallback,
} from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Transformer,
  Text,
} from "react-konva";
import { NEW_LAYOUT, CanvasData, Rectangle } from "../../constants";
import "./styles.css";
import Konva from "konva";

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
  selectedStickerId: number | null;
  setSelectedStickerId: React.Dispatch<React.SetStateAction<number | null>>;
  stageRef: React.RefObject<any>;
  isViewOnly: boolean;
  filter?: string;
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
      selectedStickerId,
      setSelectedStickerId,
      stageRef,
      isViewOnly,
      filter,
    },
    ref
  ) => {
    const transformerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    const SCALE_FACTOR = 1 / 3.5;
    const currentLayout: CanvasData = NEW_LAYOUT[layout];
    const maxPhotos = currentLayout.rectangles.length;
    const stripWidth = currentLayout.canvas.width * SCALE_FACTOR;
    const stripHeight = currentLayout.canvas.height * SCALE_FACTOR;

    const getCurrentDate = () => {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = String(today.getFullYear()).slice(2);
      return `${day}.${month}.${year}`;
    };

    // contrasting color
    const getContrastColor = (hexColor: string) => {
      // Convert hex to RGB
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      // Calculate luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      // Returns white if background is dark, black if background is light
      return luminance > 0.5 ? "#000000" : "#FFFFFF";
    };

    useEffect(() => {
      if (isViewOnly && selectedStickerId) {
        setSelectedStickerId(null);
      }
    }, [selectedStickerId, isViewOnly]);

    useEffect(() => {
      const updateScale = () => {
        if (!containerRef.current) return;
        const viewportHeight = window.innerHeight;
        const maxDisplayHeight = viewportHeight * 0.8;
        const scaleY = maxDisplayHeight / stripHeight;
        const newScale = Math.min(Math.max(scaleY, 0.5), 1);
        setScale(newScale);
      };

      updateScale();
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }, [stripHeight]);

    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
    const [fgImage, setFgImage] = useState<HTMLImageElement | null>(null);
    const [photoImages, setPhotoImages] = useState<(HTMLImageElement | null)[]>(
      []
    );

    useEffect(() => {
      if (backgroundImage) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = backgroundImage;
        img.onload = () => setBgImage(img);
      } else {
        setBgImage(null);
      }
    }, [backgroundImage]);

    useEffect(() => {
      if (foregroundImage) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = foregroundImage;
        img.onload = () => setFgImage(img);
      } else {
        setFgImage(null);
      }
    }, [foregroundImage]);

    useEffect(() => {
      if (photos.length === 1 && photos[0].id === "combined") {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = photos[0].url;
        img.onload = () => setPhotoImages([img]);
      } else {
        const loadPhotos = async () => {
          const loadedImages: any[] = await Promise.all(
            photos.map(
              (photo) =>
                new Promise<HTMLImageElement>((resolve) => {
                  const img = new Image();
                  img.crossOrigin = "Anonymous";
                  img.src = photo.url;
                  img.onload = () => resolve(img);
                })
            )
          );
          while (loadedImages.length < maxPhotos) {
            loadedImages.push(null);
          }
          setPhotoImages(loadedImages);
        };
        loadPhotos();
      }
    }, [photos, maxPhotos]);

    useEffect(() => {
      if (
        selectedStickerId !== null &&
        transformerRef.current &&
        stageRef.current
      ) {
        const selectedNode = stageRef.current.findOne(
          `#sticker-${selectedStickerId}`
        );
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
          transformerRef.current.getLayer().batchDraw();
        }
      } else if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }
    }, [selectedStickerId]);

    const handleSelectSticker = (e: any) => {
      if (isViewOnly) return;
      const id = e.target.id().replace("sticker-", "");
      setSelectedStickerId(parseInt(id));
    };

    const handleDeselect = (e: any) => {
      if (
        e.target?.id()?.indexOf("sticker") === -1 &&
        e.target.className !== "Rect"
      ) {
        setSelectedStickerId(null);
      }
    };

    const handleTransform = useCallback(
      (e: any) => {
        if (isViewOnly) return;
        const node = e.target;
        const id = parseInt(node.id().replace("sticker-", ""));
        setStickers((prev) =>
          prev.map((sticker) =>
            sticker.id === id
              ? {
                  ...sticker,
                  x: node.x() / SCALE_FACTOR,
                  y: node.y() / SCALE_FACTOR,
                  width: (node.width() * node.scaleX()) / SCALE_FACTOR,
                  height: (node.height() * node.scaleY()) / SCALE_FACTOR,
                  rotation: node.rotation(),
                }
              : sticker
          )
        );
        node.scaleX(1);
        node.scaleY(1);
      },
      [setStickers, SCALE_FACTOR]
    );

    const handleDeleteSticker = useCallback(() => {
      if (isViewOnly) return;
      if (selectedStickerId !== null) {
        setStickers((prev) =>
          prev.filter((sticker) => sticker.id !== selectedStickerId)
        );
        setSelectedStickerId(null);
      }
    }, [selectedStickerId, setStickers]);

    const cropImageToRectangle = (
      image: HTMLImageElement,
      rect: Rectangle
    ): HTMLImageElement => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return image;

      const imgWidth = image.width;
      const imgHeight = image.height;
      const rectWidth = rect.width;
      const rectHeight = rect.height;

      const rectRatio = rectWidth / rectHeight;
      const imgRatio = imgWidth / imgHeight;

      let cropWidth, cropHeight, cropX, cropY;

      if (imgRatio > rectRatio) {
        cropWidth = imgHeight * rectRatio;
        cropHeight = imgHeight;
        cropX = (imgWidth - cropWidth) / 2;
        cropY = 0;
      } else {
        cropHeight = imgWidth / rectRatio;
        cropWidth = imgWidth;
        cropX = 0;
        cropY = (imgHeight - cropHeight) / 2;
      }

      canvas.width = rectWidth;
      canvas.height = rectHeight;
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        rectWidth,
        rectHeight
      );

      const croppedImage = new Image();
      croppedImage.src = canvas.toDataURL("image/png");
      return croppedImage;
    };

    const croppedImages = photoImages.map((photo, index) => {
      if (!photo || index >= currentLayout.rectangles.length) return null;
      return cropImageToRectangle(photo, currentLayout.rectangles[index]);
    });

    const applyFilters = (image: any) => {
      if (!image) return;
      image.cache();

      switch (filter) {
        case "bw": {
          image.filters([Konva.Filters.Grayscale]);
          break;
        }
        case "whitening": {
          image.filters([
            Konva.Filters.Brighten,
            // Konva.Filters.HSL,
            // Konva.Filters.RGBA,
            // Konva.Filters.Blur,
          ]);
          image.brightness(0.05);

          // image.hue(0);
          // image.saturation(-0.1);
          // image.luminance(0.05);
          // image.red(5);
          // image.blue(40);
          // image.green(10);
          // image.alpha(0.3);
          break;
        }
        case "darker": {
          image.filters([Konva.Filters.Brighten]);
          image.brightness(-0.05);
          break;
        }
        default:
          image.filters([]);
          break;
      }

      image.getLayer()?.batchDraw(); // Update layer
    };

    return (
      <div ref={ref} className="photo-strip" style={{ position: "relative" }}>
        <div ref={containerRef}>
          <Stage
            width={stripWidth}
            height={stripHeight}
            ref={stageRef}
            style={{ overflow: "hidden" }}
            onMouseDown={handleDeselect}
            onTouchStart={handleDeselect}
          >
            <Layer>
              {bgImage ? (
                <KonvaImage
                  image={bgImage}
                  width={stripWidth}
                  height={stripHeight}
                />
              ) : (
                <Rect
                  width={stripWidth}
                  height={stripHeight}
                  fill={frameColor}
                />
              )}

              {photos.length === 1 && photos[0].id === "combined"
                ? photoImages[0] && (
                    <KonvaImage
                      image={photoImages[0]}
                      width={stripWidth}
                      height={stripHeight}
                      listening={false}
                      ref={(node) => {
                        if (node) applyFilters(node);
                      }}
                    />
                  )
                : currentLayout.rectangles.map((rect, index) => {
                    const croppedImage = croppedImages[index];
                    if (croppedImage) {
                      return (
                        <KonvaImage
                          key={index}
                          image={croppedImage}
                          x={rect.x * SCALE_FACTOR}
                          y={rect.y * SCALE_FACTOR}
                          width={rect.width * SCALE_FACTOR}
                          height={rect.height * SCALE_FACTOR}
                          listening={false}
                          ref={(node) => {
                            if (node) applyFilters(node);
                          }}
                        />
                      );
                    } else {
                      return (
                        <Rect
                          key={index}
                          x={rect.x * SCALE_FACTOR}
                          y={rect.y * SCALE_FACTOR}
                          width={rect.width * SCALE_FACTOR}
                          height={rect.height * SCALE_FACTOR}
                          fill="rgba(200, 200, 200, 0.5)"
                          stroke="gray"
                          strokeWidth={1 * SCALE_FACTOR}
                        />
                      );
                    }
                  })}

              {fgImage && (
                <KonvaImage
                  image={fgImage}
                  width={stripWidth}
                  height={stripHeight}
                />
              )}

              {stickers.map((sticker) => (
                <KonvaImage
                  key={sticker.id}
                  id={`sticker-${sticker.id}`}
                  image={sticker.image}
                  x={sticker.x * SCALE_FACTOR}
                  y={sticker.y * SCALE_FACTOR}
                  width={sticker.width * SCALE_FACTOR}
                  height={sticker.height * SCALE_FACTOR}
                  rotation={sticker.rotation}
                  draggable
                  onClick={handleSelectSticker}
                  onTap={handleSelectSticker}
                  onDragEnd={handleTransform}
                  onTransformEnd={handleTransform}
                />
              ))}

              <Text
                text={getCurrentDate()}
                x={stripWidth / 2 - 20}
                y={12}
                fontSize={36 * SCALE_FACTOR}
                fontFamily="Arial"
                fill={bgImage ? "#FFFFFF" : getContrastColor(frameColor)}
                align="right"
                perfectDrawEnabled={true}
                listening={false}
              />

              {selectedStickerId !== null && !isViewOnly && (
                <Transformer
                  id="transformer"
                  ref={transformerRef}
                  anchorSize={8}
                  anchorCornerRadius={4}
                  borderStrokeWidth={1}
                  rotateEnabled
                  enabledAnchors={[
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                  ]}
                />
              )}
            </Layer>
          </Stage>
        </div>

        {selectedStickerId !== null && (
          <button
            onClick={handleDeleteSticker}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "red",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            X
          </button>
        )}
      </div>
    );
  }
);

export default PhotoStrip;
