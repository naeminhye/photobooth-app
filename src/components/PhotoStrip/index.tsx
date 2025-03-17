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
  Circle,
  Group,
} from "react-konva";
import { LAYOUTS, CanvasData, Rectangle, SCALE_FACTOR } from "../../constants";
import "./styles.css";
import { Gradient } from "../GradientPicker";
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
  textColor: string;
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
  gradient?: Gradient | null;
}

const PhotoStrip = forwardRef<HTMLDivElement, PhotoStripProps>(
  (
    {
      photos,
      frameColor,
      gradient,
      textColor,
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
    // const [scale, setScale] = useState(1);

    const currentLayout: CanvasData = LAYOUTS[layout];
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

    useEffect(
      () => {
        if (isViewOnly && selectedStickerId) {
          setSelectedStickerId(null);
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [selectedStickerId, isViewOnly]
    );

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

    const cropImageToRectangle = (
      image: HTMLImageElement,
      rect: Rectangle
    ): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(image);

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
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
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
        croppedImage.onload = () => resolve(croppedImage);
        croppedImage.src = canvas.toDataURL("image/png", 1.0);
      });
    };

    const applyFilterToImage = (
      image: HTMLImageElement,
      filterType: string
    ): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(image);

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        switch (filterType) {
          case "bw": {
            // Grayscale filter
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              data[i] = gray;
              data[i + 1] = gray;
              data[i + 2] = gray;
            }
            break;
          }
          case "whitening": {
            // Brighten filter
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, data[i] + 20); // Red
              data[i + 1] = Math.min(255, data[i + 1] + 20); // Green
              data[i + 2] = Math.min(255, data[i + 2] + 20); // Blue
            }
            break;
          }
          case "darker": {
            // Darken filter
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.max(0, data[i] - 20); // Red
              data[i + 1] = Math.max(0, data[i + 1] - 20); // Green
              data[i + 2] = Math.max(0, data[i + 2] - 20); // Blue
            }
            break;
          }
          default:
            break;
        }

        ctx.putImageData(imageData, 0, 0);
        const filteredImage = new Image();
        filteredImage.onload = () => resolve(filteredImage);
        filteredImage.src = canvas.toDataURL("image/png", 1.0);
      });
    };

    useEffect(() => {
      const loadPhotos = async () => {
        if (photos.length === 1 && photos[0].id === "combined") {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = photos[0].url;
          img.onload = async () => {
            const filteredImg = await applyFilterToImage(img, filter || "none");
            setPhotoImages([filteredImg]);
          };
        } else {
          const loadedImages = await Promise.all(
            photos.map(async (photo, index) => {
              if (index >= maxPhotos) return null;
              const img = new Image();
              img.crossOrigin = "Anonymous";
              img.src = photo.url;
              return new Promise<HTMLImageElement>((resolve) => {
                img.onload = async () => {
                  const croppedImg = await cropImageToRectangle(
                    img,
                    currentLayout.rectangles[index]
                  );
                  const filteredImg = await applyFilterToImage(
                    croppedImg,
                    filter || "none"
                  );
                  resolve(filteredImg);
                };
              });
            })
          );
          setPhotoImages(loadedImages);
        }
      };
      loadPhotos();
    }, [photos, filter, maxPhotos, currentLayout.rectangles]);

    const handleSelectSticker = (e: any) => {
      if (isViewOnly) return;
      const id = e.target.id().replace("sticker-", "");
      setSelectedStickerId(parseInt(id));
    };

    const handleDeselect = (
      e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
    ) => {
      const clickedOnSticker = e.target.id()?.includes("sticker");
      const clickedOnDeleteButton = e.target.id()?.includes("delete-button");

      // Deselect only if the click is not on a sticker or its delete button
      if (!clickedOnSticker && !clickedOnDeleteButton) {
        setSelectedStickerId(null);
      }
    };

    const handleTransform = useCallback(
      (e: Konva.KonvaEventObject<Event>) => {
        if (isViewOnly) {
          e.currentTarget.stopDrag();
          return;
        }
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
      [setStickers, isViewOnly]
    );

    const handleDeleteSticker = useCallback(
      () => {
        if (isViewOnly || selectedStickerId === null) return;
        setStickers((prev) =>
          prev.filter((sticker) => sticker.id !== selectedStickerId)
        );
        setSelectedStickerId(null);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [selectedStickerId, setStickers, isViewOnly]
    );

    // Inside PhotoStrip, before rendering the Rect
    const adjustedGradient = gradient
      ? {
          ...gradient,
          fillLinearGradientEndPoint: { x: stripWidth, y: stripHeight },
          fillRadialGradientStartPoint:
            gradient.fillRadialGradientStartPoint || {
              x: stripWidth / 2,
              y: stripHeight / 2,
            }, // Center of the canvas
          fillRadialGradientEndPoint: gradient.fillRadialGradientEndPoint || {
            x: stripWidth / 2,
            y: stripHeight / 2,
          }, // Same as start point
          fillRadialGradientEndRadius:
            gradient.fillRadialGradientEndRadius ||
            Math.max(stripWidth, stripHeight) / 2, // Ensure the gradient covers the entire canvas
        }
      : null;

    // Attach Transformer to the selected sticker
    useEffect(
      () => {
        if (
          transformerRef.current &&
          selectedStickerId !== null &&
          !isViewOnly
        ) {
          const stage = stageRef.current;
          const layer = stage.findOne("Layer");
          const stickerNode = layer.findOne(`#sticker-${selectedStickerId}`);
          if (stickerNode) {
            transformerRef.current.nodes([stickerNode]);
            transformerRef.current.getLayer().batchDraw();
          }
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [selectedStickerId, isViewOnly]
    );

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (isViewOnly || selectedStickerId === null) return;
        if (e.key === "Delete") {
          handleDeleteSticker();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedStickerId, isViewOnly, handleDeleteSticker]);

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
                  fill={gradient ? undefined : frameColor} // Use gradient if provided, else frameColor
                  {...(adjustedGradient || {})}
                />
              )}

              {photos.length === 1 && photos[0].id === "combined"
                ? photoImages[0] && (
                    <KonvaImage
                      image={photoImages[0]}
                      width={stripWidth}
                      height={stripHeight}
                      listening={false}
                    />
                  )
                : currentLayout.rectangles.map((rect, index) => {
                    const croppedImage = photoImages[index];
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
                <Group key={sticker.id}>
                  <KonvaImage
                    id={`sticker-${sticker.id}`}
                    image={sticker.image}
                    x={sticker.x * SCALE_FACTOR}
                    y={sticker.y * SCALE_FACTOR}
                    width={sticker.width * SCALE_FACTOR}
                    height={sticker.height * SCALE_FACTOR}
                    rotation={sticker.rotation}
                    draggable={!isViewOnly}
                    onClick={handleSelectSticker}
                    onTap={handleSelectSticker}
                    onDragEnd={handleTransform}
                    onTransformEnd={handleTransform}
                  />
                  {selectedStickerId === sticker.id && !isViewOnly && (
                    <>
                      <Transformer
                        id={`transformer-${sticker.id}`}
                        ref={transformerRef}
                        anchorSize={10}
                        anchorCornerRadius={4}
                        borderStrokeWidth={2}
                        rotateEnabled
                        enabledAnchors={[
                          "top-left",
                          "top-right",
                          "bottom-left",
                          "bottom-right",
                        ]}
                      />
                      <Circle
                        id={`delete-button-${sticker.id}`}
                        x={
                          sticker.x * SCALE_FACTOR +
                          sticker.width * SCALE_FACTOR +
                          15 // Position to the right of the sticker
                        }
                        y={sticker.y * SCALE_FACTOR - 15} // Position above the top-right corner
                        radius={10}
                        fill="red"
                        onClick={handleDeleteSticker}
                        onTap={handleDeleteSticker}
                        draggable={false}
                        listening={true}
                      />
                      <Text
                        id={`delete-text-${sticker.id}`}
                        x={
                          sticker.x * SCALE_FACTOR +
                          sticker.width * SCALE_FACTOR +
                          10
                        }
                        y={sticker.y * SCALE_FACTOR - 20}
                        text="X"
                        fontSize={12}
                        fill="white"
                        align="center"
                        listening={false}
                      />
                    </>
                  )}
                </Group>
              ))}

              <Text
                text={getCurrentDate()}
                x={stripWidth / 2 - 20}
                y={12}
                fontSize={36 * SCALE_FACTOR}
                fontFamily="Arial"
                fill={textColor}
                align="right"
                perfectDrawEnabled={true}
                listening={false}
              />
            </Layer>
          </Stage>
        </div>
      </div>
    );
  }
);

export default PhotoStrip;
