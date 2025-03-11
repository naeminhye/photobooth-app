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
} from "react-konva";
import { LAYOUTS } from "../../constants";
import "./styles.css";

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
    },
    ref
  ) => {
    const transformerRef = useRef<any>(null);
    const stageRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1); // Tỷ lệ co giãn hiển thị

    const SCALE_FACTOR = 1;
    const currentLayout = LAYOUTS[layout];
    const maxPhotos = currentLayout.maxPhotos;
    const stripWidth = currentLayout.width * SCALE_FACTOR;
    const stripHeight = currentLayout.height * SCALE_FACTOR;
    const stripBorderRadius = currentLayout?.borderRadius || 0;
    const PADDING_TOP = (currentLayout.paddings?.top || 0) * SCALE_FACTOR;
    const PADDING_LEFT = (currentLayout.paddings?.left || 0) * SCALE_FACTOR;
    const PADDING_BOTTOM = (currentLayout.paddings?.bottom || 0) * SCALE_FACTOR;
    const PADDING_RIGHT = (currentLayout.paddings?.right || 0) * SCALE_FACTOR;
    const GAP = (currentLayout.gap || 0) * SCALE_FACTOR;

    const arrangement = currentLayout.arrangement;
    const isGrid = arrangement === "grid";
    const gridColumns = currentLayout.gridTemplate?.columns || 1;
    const gridRows = currentLayout.gridTemplate?.rows || 1;

    const photoSize = {
      width:
        arrangement === "vertical" || isGrid
          ? stripWidth - PADDING_LEFT - PADDING_RIGHT
          : (stripWidth -
              PADDING_LEFT -
              PADDING_RIGHT -
              (maxPhotos - 1) * GAP) /
            maxPhotos,
      height:
        arrangement === "vertical"
          ? (stripHeight -
              PADDING_TOP -
              PADDING_BOTTOM -
              (maxPhotos - 1) * GAP) /
            maxPhotos
          : stripHeight - PADDING_TOP - PADDING_BOTTOM,
    };
    if (isGrid) {
      photoSize.width =
        (stripWidth - PADDING_LEFT - PADDING_RIGHT - (gridColumns - 1) * GAP) /
        gridColumns;
      photoSize.height =
        (stripHeight - PADDING_TOP - PADDING_BOTTOM - (gridRows - 1) * GAP) /
        gridRows;
    }

    // Tính toán tỷ lệ scale để vừa màn hình
    useEffect(() => {
      const updateScale = () => {
        if (!containerRef.current) return;
        const viewportHeight = window.innerHeight;
        const maxDisplayHeight = viewportHeight * 0.8; // 80% chiều cao màn hình
        const scaleY = maxDisplayHeight / stripHeight;
        const newScale = Math.min(Math.max(scaleY, 0.5), 1); // Giới hạn scale từ 0.5 đến 1
        setScale(newScale);
      };

      updateScale();
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }, [stripHeight]);

    // Tải ảnh
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

    // Cập nhật Transformer khi chọn sticker
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
      if (selectedStickerId !== null) {
        setStickers((prev) =>
          prev.filter((sticker) => sticker.id !== selectedStickerId)
        );
        setSelectedStickerId(null);
      }
    }, [selectedStickerId, setStickers]);

    return (
      <div ref={ref} className="photo-strip" style={{ position: "relative" }}>
        <div ref={containerRef}>
          <Stage
            width={stripWidth}
            height={stripHeight}
            ref={stageRef}
            style={{
              borderRadius: `${stripBorderRadius / SCALE_FACTOR}px`,
              overflow: "hidden",
            }}
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
                    />
                  )
                : photoImages.map((photo, index) => {
                    if (!photo) return null;
                    const x =
                      arrangement === "vertical"
                        ? PADDING_LEFT
                        : PADDING_LEFT + index * (photoSize.width + GAP);
                    const y =
                      arrangement === "vertical"
                        ? PADDING_TOP + index * (photoSize.height + GAP)
                        : PADDING_TOP;
                    return (
                      <KonvaImage
                        key={index}
                        image={photo}
                        x={x}
                        y={y}
                        width={photoSize.width}
                        height={photoSize.height}
                      />
                    );
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

              {selectedStickerId !== null && (
                <Transformer
                  id="transformer"
                  ref={transformerRef}
                  anchorSize={8 * SCALE_FACTOR}
                  borderStrokeWidth={1 * SCALE_FACTOR}
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
