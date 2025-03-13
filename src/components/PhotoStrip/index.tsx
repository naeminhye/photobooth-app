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
import { LAYOUTS, CanvasData, Rectangle, SCALE_FACTOR } from "../../constants";
import "./styles.css";
import { Gradient } from "../GradientPicker";

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

    // useEffect(() => {
    //   const updateScale = () => {
    //     if (!containerRef.current) return;
    //     const viewportHeight = window.innerHeight;
    //     const maxDisplayHeight = viewportHeight * 0.8;
    //     const scaleY = maxDisplayHeight / stripHeight;
    //     const newScale = Math.min(Math.max(scaleY, 0.5), 1);
    //     setScale(newScale);
    //   };

    //   updateScale();
    //   window.addEventListener("resize", updateScale);
    //   return () => window.removeEventListener("resize", updateScale);
    // }, [stripHeight]);

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

    // Hàm crop ảnh tương tự handleMergeLayers
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

    // Hàm áp dụng filter trên canvas thay vì KonvaImage
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
            // Brighten filter (tăng độ sáng)
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, data[i] + 20); // Red
              data[i + 1] = Math.min(255, data[i + 1] + 20); // Green
              data[i + 2] = Math.min(255, data[i + 2] + 20); // Blue
            }
            break;
          }
          case "darker": {
            // Darken filter (giảm độ sáng)
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

    // Load và xử lý ảnh với filter
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
      [setStickers, isViewOnly]
    );

    const handleDeleteSticker = useCallback(
      () => {
        if (isViewOnly) return;
        if (selectedStickerId !== null) {
          setStickers((prev) =>
            prev.filter((sticker) => sticker.id !== selectedStickerId)
          );
          setSelectedStickerId(null);
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [selectedStickerId, setStickers, isViewOnly]
    );

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
                  fill={gradient ? undefined : frameColor}
                  {...gradient}
                  // fillLinearGradientStartPoint={{ x: 0, y: 0 }} // Điểm bắt đầu gradient
                  // fillLinearGradientEndPoint={{ x: 200, y: 100 }} // Điểm kết thúc gradient
                  // fillLinearGradientColorStops={[
                  //   0,
                  //   "red",
                  //   0.5,
                  //   "yellow",
                  //   1,
                  //   "blue",
                  // ]} // Các điểm màu
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
                fill={textColor}
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
