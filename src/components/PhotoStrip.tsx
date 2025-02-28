// components/PhotoStrip.tsx
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
} from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableProvided,
  DraggableStateSnapshot,
} from "react-beautiful-dnd";
import StickerDraggable from "react-draggable";
import { Resizable, ResizeCallbackData } from "react-resizable";
import { LAYOUTS, Layout, Element, ElementType } from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faSquare, faStar } from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";

interface Photo {
  id: string;
  url: string;
}

interface PhotoStripProps {
  photos: Photo[];
  onPhotoCapture: (photo: string) => void;
  onPhotoOrderChange: (photos: Photo[]) => void;
  onPhotoUpload: (files: File[]) => void;
  frameColor: string;
  backgroundImage: string | null;
  textOverlay: string;
  stickers: Element[];
  onStickerUpdate: (stickers: Element[]) => void;
  isFullStrip: boolean;
  layout: number;
  foregroundImage: string | null;
}

const PhotoStrip = forwardRef<HTMLDivElement, PhotoStripProps>(
  (
    {
      photos,
      onPhotoCapture,
      onPhotoOrderChange,
      onPhotoUpload,
      frameColor,
      backgroundImage,
      textOverlay,
      stickers,
      onStickerUpdate,
      isFullStrip,
      layout,
      foregroundImage,
    },
    ref
  ) => {
    const stripRef = useRef<HTMLDivElement>(null);
    const [stripDimensions, setStripDimensions] = useState({
      width: 0,
      height: 0,
    });
    const [guidelines, setGuidelines] = useState<{ x: number; y: number }[]>(
      []
    );
    const [selectedElementId, setSelectedElementId] = useState<string | null>(
      null
    );
    const [rotationAngle, setRotationAngle] = useState<number | null>(null);

    const HALF_STRIP_WIDTH = 3 * 96;
    const HALF_STRIP_HEIGHT = 9 * 96;
    const FULL_STRIP_WIDTH = 6 * 96;
    const FULL_STRIP_HEIGHT = 18 * 96;
    const PADDING = 0.15 * 96;
    const TEXT_SPACE = 1 * 96;
    const GRID_SIZE = 10;
    const MIN_SIZE = 20;
    const MAX_SIZE = 2000;

    const currentLayout = LAYOUTS[layout];
    const maxPhotos = currentLayout.maxPhotos;
    const frameWidth = `${isFullStrip ? 6 : 3}in`;
    const frameHeight = `${isFullStrip ? 18 : 9}in`;
    const aspectRatio = currentLayout.width / currentLayout.height;

    useEffect(() => {
      if (stripRef.current) {
        const { width, height } = stripRef.current.getBoundingClientRect();
        setStripDimensions({ width, height });
      }
    }, [isFullStrip, layout]);

    const onDragEnd = (result: DropResult) => {
      console.log("Drag End Result:", result);
      if (!result.destination) return;

      const newPhotos = Array.from(photos);
      const [reorderedItem] = newPhotos.splice(result.source.index, 1);
      newPhotos.splice(result.destination.index, 0, reorderedItem);

      if (isFullStrip && currentLayout.arrangement === "grid") {
        const maxCols = 2;
        const newOrder = newPhotos.map((_, index) => {
          const row = Math.floor(index / maxCols);
          const col = index % maxCols;
          return { photo: _, row, col };
        });
        newPhotos.sort((a, b) => {
          const posA = newOrder.find((p) => p.photo === a);
          const posB = newOrder.find((p) => p.photo === b);
          if (posA!.row !== posB!.row) return posA!.row - posB!.row;
          return posA!.col - posB!.col;
        });
      }

      onPhotoOrderChange(newPhotos);
    };

    const handleStickerDrag = (id: string, e: { x: number; y: number }) => {
      const updatedStickers = stickers.map((sticker) =>
        sticker.id === id
          ? {
              ...sticker,
              x: snapToGrid(e.x),
              y: snapToGrid(e.y),
              zIndex: stickers.length + 1,
            }
          : sticker
      );
      updateGuidelines(id, updatedStickers.find((s) => s.id === id)!);
      onStickerUpdate(updatedStickers);
    };

    const handleStickerResize = (
      id: string,
      data: ResizeCallbackData,
      e: React.SyntheticEvent<Element, Event>
    ) => {
      const sticker = stickers.find((s) => s.id === id);
      if (!sticker) return;

      const nativeEvent = e.nativeEvent as MouseEvent;
      const newWidth = Math.max(MIN_SIZE, Math.min(MAX_SIZE, data.size.width));
      const newHeight = nativeEvent.shiftKey
        ? (newWidth / sticker.width) * sticker.height
        : Math.max(MIN_SIZE, Math.min(MAX_SIZE, data.size.height));

      const updatedStickers = stickers.map((s) =>
        s.id === id
          ? {
              ...s,
              width: newWidth,
              height: newHeight,
              zIndex: stickers.length + 1,
            }
          : s
      );
      updateGuidelines(id, updatedStickers.find((s) => s.id === id)!);
      onStickerUpdate(updatedStickers);
    };

    const handleStickerRotate = (
      id: string,
      e: React.MouseEvent,
      rotate: number
    ) => {
      if (selectedElementId === id) {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle =
          Math.atan2(e.clientY - centerY, e.clientX - centerX) *
            (180 / Math.PI) +
          90;
        const newRotate = e.shiftKey ? Math.round(angle / 15) * 15 : angle;
        const updatedStickers = stickers.map((sticker) =>
          sticker.id === id
            ? { ...sticker, rotate: newRotate, zIndex: stickers.length + 1 }
            : sticker
        );
        onStickerUpdate(updatedStickers);
      }
    };

    const snapToGrid = (value: number) =>
      Math.round(value / GRID_SIZE) * GRID_SIZE;

    const updateGuidelines = (id: string, element: Element) => {
      const guides: { x: number; y: number }[] = [];
      stickers.forEach((sticker) => {
        if (sticker.id !== id) {
          if (Math.abs(element.x - sticker.x) < 10)
            guides.push({ x: sticker.x, y: 0 });
          if (Math.abs(element.y - sticker.y) < 10)
            guides.push({ x: 0, y: sticker.y });
        }
      });
      setGuidelines(guides);
    };

    const boundStickerPosition = (
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      const { width: stripWidth, height: stripHeight } = stripDimensions;
      const paddedWidth = stripWidth - 2 * PADDING;
      const paddedHeight = stripHeight - 2 * PADDING - TEXT_SPACE;

      return {
        x: Math.max(PADDING, Math.min(x, PADDING + paddedWidth - width)),
        y: Math.max(PADDING, Math.min(y, PADDING + paddedHeight - height)),
      };
    };

    if (!photos || photos.length === 0) {
      console.log("No photos to render, rendering empty Droppable");
    }

    const bringToFront = (id: string) => {
      const updatedStickers = [...stickers]
        .sort((a, b) => (a.id === id ? 1 : -1))
        .map((s, index) => ({ ...s, zIndex: index + 1 }));
      onStickerUpdate(updatedStickers);
    };

    const sendToBack = (id: string) => {
      const updatedStickers = [...stickers]
        .sort((a, b) => (a.id === id ? -1 : 1))
        .map((s, index) => ({ ...s, zIndex: index + 1 }));
      onStickerUpdate(updatedStickers);
    };

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          ref={ref}
          className={`photo-strip ${isFullStrip ? "full-strip" : "half-strip"}`}
          style={{
            width: frameWidth,
            height: frameHeight,
            background: backgroundImage
              ? `url(${backgroundImage}) no-repeat center center / cover`
              : frameColor,
            backgroundPosition: "center",
            backgroundSize: "cover",
            border: "2px solid #000",
            position: "relative",
            padding: "0.15in",
            paddingBottom: "1.15in",
            boxSizing: "border-box",
            display:
              isFullStrip && currentLayout.arrangement === "grid"
                ? "flex"
                : "block",
            flexWrap:
              isFullStrip && currentLayout.arrangement === "grid"
                ? "wrap"
                : undefined,
          }}
        >
          {/* Foreground Image Overlay */}
          {foregroundImage && (
            <img
              src={foregroundImage}
              alt="Foreground Decoration"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 1000, // TODO: below stickers
                pointerEvents: "none",
              }}
            />
          )}

          <Droppable
            droppableId="photos"
            direction={
              isFullStrip && currentLayout.arrangement === "grid"
                ? "horizontal"
                : "vertical"
            }
          >
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{
                  display:
                    isFullStrip && currentLayout.arrangement === "grid"
                      ? "flex"
                      : "block",
                  flexWrap:
                    isFullStrip && currentLayout.arrangement === "grid"
                      ? "wrap"
                      : undefined,
                  width: "100%",
                  height: "100%",
                  boxSizing: "border-box",
                  position: "relative",
                }}
              >
                {photos.length > 0
                  ? photos.map((photo, index) => (
                      <Draggable
                        key={photo.id}
                        draggableId={photo.id}
                        index={index}
                      >
                        {(
                          provided: DraggableProvided,
                          snapshot: DraggableStateSnapshot
                        ) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="photo-container"
                            style={{
                              ...provided.draggableProps.style,
                              width: isFullStrip
                                ? currentLayout.arrangement === "grid"
                                  ? "50%"
                                  : "100%"
                                : "100%",
                              height: isFullStrip
                                ? currentLayout.arrangement === "grid"
                                  ? "50%"
                                  : `${100 / currentLayout.maxPhotos}%`
                                : `${100 / currentLayout.maxPhotos}%`,
                              boxSizing: "border-box",
                              position: "relative",
                              zIndex: 20,
                              margin: "0 5px 5px 0",
                              cursor: snapshot.isDragging ? "grabbing" : "grab",
                            }}
                          >
                            <img
                              src={photo.url}
                              alt={`Photo ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  : Array.from({ length: maxPhotos }, (_, index) => (
                      <div
                        key={`placeholder-${index}`}
                        className="photo-placeholder"
                        style={{
                          width: isFullStrip
                            ? currentLayout.arrangement === "grid"
                              ? "50%"
                              : "100%"
                            : "100%",
                          height: isFullStrip
                            ? currentLayout.arrangement === "grid"
                              ? "50%"
                              : `${100 / maxPhotos}%`
                            : `${100 / maxPhotos}%`,
                          border: "2px dashed #999",
                          boxSizing: "border-box",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "transparent",
                          opacity: 0.5, // Disable interaction
                          zIndex: 10,
                          margin: "0 5px 5px 0",
                        }}
                      >
                        <span style={{ fontSize: "24px", color: "#999" }}>
                          +
                        </span>
                      </div>
                    ))}
                {provided.placeholder}
                {guidelines.map((guide, index) => (
                  <div
                    key={`guide-${index}`}
                    style={{
                      position: "absolute",
                      background: "rgba(0, 255, 0, 0.5)",
                      width: guide.x ? 2 : stripDimensions.width,
                      height: guide.y ? 2 : stripDimensions.height,
                      left: guide.x || 0,
                      top: guide.y || 0,
                      zIndex: 5,
                    }}
                  />
                ))}
              </div>
            )}
          </Droppable>

          {stickers.map((sticker, index) => {
            const img = new Image();
            img.src = sticker.src || "";
            const naturalWidth = img.width || 100;
            const naturalHeight = img.height || 100;
            const naturalAspect = naturalWidth / naturalHeight;

            const handleSelect = () => {
              setSelectedElementId(sticker.id);
              bringToFront(sticker.id);
            };

            return (
              <StickerDraggable
                key={sticker.id}
                position={{ x: sticker.x, y: sticker.y }}
                bounds="parent"
                onDrag={(e, data) => {
                  handleStickerDrag(sticker.id, data);
                  handleSelect();
                }}
                onStop={(e) => {
                  if (e.altKey) {
                    const duplicatedSticker = {
                      ...sticker,
                      id: uuidv4(),
                      x: sticker.x + 10,
                      y: sticker.y + 10,
                    };
                    onStickerUpdate([...stickers, duplicatedSticker]);
                  }
                }}
              >
                <Resizable
                  width={sticker.width}
                  height={sticker.height / naturalAspect}
                  onResize={(e, data) => {
                    handleStickerResize(sticker.id, data, e as any);
                    handleSelect();
                  }}
                  onResizeStop={() => bringToFront(sticker.id)}
                  handleSize={[8, 8]}
                  minConstraints={[MIN_SIZE, MIN_SIZE / naturalAspect]}
                  maxConstraints={[MAX_SIZE, MAX_SIZE / naturalAspect]}
                  handle={(handleAxis, ref) => (
                    <div
                      ref={ref}
                      className={`resize-handle ${handleAxis}`}
                      style={{
                        position: "absolute",
                        width: "8px",
                        height: "8px",
                        background: "#00f",
                        borderRadius: "50%",
                        zIndex: 20,
                        ...(handleAxis.includes("t")
                          ? {
                              top:
                                handleAxis.includes("l") ||
                                handleAxis.includes("r")
                                  ? "-4px"
                                  : "50%",
                              left: handleAxis.includes("l")
                                ? "-4px"
                                : handleAxis.includes("r")
                                ? "calc(50% - 4px)"
                                : "50%",
                            }
                          : {}),
                        ...(handleAxis.includes("b")
                          ? {
                              bottom:
                                handleAxis.includes("l") ||
                                handleAxis.includes("r")
                                  ? "-4px"
                                  : "50%",
                              left: handleAxis.includes("l")
                                ? "-4px"
                                : handleAxis.includes("r")
                                ? "calc(50% - 4px)"
                                : "50%",
                            }
                          : {}),
                        ...(handleAxis.includes("l") &&
                        !handleAxis.includes("t") &&
                        !handleAxis.includes("b")
                          ? { left: "-4px", top: "calc(50% - 4px)" }
                          : {}),
                        ...(handleAxis.includes("r") &&
                        !handleAxis.includes("t") &&
                        !handleAxis.includes("b")
                          ? { right: "-4px", top: "calc(50% - 4px)" }
                          : {}),
                        display:
                          selectedElementId !== sticker.id ? "none" : "block",
                      }}
                    />
                  )}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      border:
                        selectedElementId === sticker.id
                          ? "2px dashed #00f"
                          : "none",
                      background:
                        sticker.type === "image"
                          ? `url(${sticker.src})`
                          : sticker.type === "shape" &&
                            sticker.shape === "circle"
                          ? "radial-gradient(circle, #000, #fff)"
                          : sticker.type === "shape" &&
                            sticker.shape === "square"
                          ? "#ccc"
                          : sticker.type === "icon"
                          ? "none"
                          : "transparent",
                      backgroundSize: "contain",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      transform: `rotate(${sticker.rotate}deg)`,
                      cursor: "move",
                      zIndex: sticker.zIndex,
                    }}
                    onClick={handleSelect}
                  >
                    {sticker.type === "text" && (
                      <span style={{ color: "#000" }}>{sticker.text}</span>
                    )}
                    {sticker.type === "icon" && (
                      <FontAwesomeIcon
                        icon={faStar}
                        style={{ fontSize: "40px", color: "#000" }}
                      />
                    )}
                    {selectedElementId === sticker.id && (
                      <input
                        type="number"
                        value={rotationAngle || sticker.rotate}
                        onChange={(e) => {
                          const angle = Math.max(
                            0,
                            Math.min(360, parseInt(e.target.value) || 0)
                          );
                          setRotationAngle(angle);
                          handleStickerRotate(sticker.id, e as any, angle);
                        }}
                        style={{
                          position: "absolute",
                          top: "-30px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "60px",
                          padding: "2px",
                          fontSize: "12px",
                        }}
                      />
                    )}
                    {selectedElementId === sticker.id && (
                      <div
                        className="rotate-handle"
                        style={{
                          position: "absolute",
                          width: "12px",
                          height: "12px",
                          background: "#f00",
                          borderRadius: "50%",
                          top: "-16px",
                          right: "-16px",
                          cursor: "nesw-resize",
                          zIndex: 20,
                        }}
                        onMouseDown={(e) =>
                          handleStickerRotate(sticker.id, e, sticker.rotate)
                        }
                      />
                    )}
                  </div>
                </Resizable>
              </StickerDraggable>
            );
          })}
        </div>
      </DragDropContext>
    );
  }
);

export default PhotoStrip;
