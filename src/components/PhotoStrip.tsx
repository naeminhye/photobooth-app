// components/PhotoStrip.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableProvided,
} from "react-beautiful-dnd";
import StickerDraggable from "react-draggable";
import { Resizable, ResizeCallbackData } from "react-resizable";
import { LAYOUTS, Layout } from "../constants";
import { useDropzone } from "react-dropzone"; // Import react-dropzone

interface Photo {
  id: string;
  url: string;
}

interface PhotoStripProps {
  photos: Photo[];
  onPhotoCapture: (photo: string) => void;
  onPhotoOrderChange: (photos: Photo[]) => void;
  onPhotoRemove: (id: string) => void;
  onPhotoUpload: (file: File) => void; // New prop for handling uploaded photos
  frameColor: string;
  backgroundImage: string | null;
  textOverlay: string;
  stickers: {
    id: number;
    src: string;
    x: number;
    y: number;
    rotate: number;
    width: number;
    height: number;
  }[];
  onStickerUpdate: (
    stickers: {
      id: number;
      src: string;
      x: number;
      y: number;
      rotate: number;
      width: number;
      height: number;
    }[]
  ) => void;
  isFullStrip: boolean;
  layout: number;
  step: "layout" | "customize" | "download";
}

const PhotoStrip: React.FC<PhotoStripProps> = ({
  photos,
  onPhotoCapture,
  onPhotoOrderChange,
  onPhotoRemove,
  onPhotoUpload,
  frameColor,
  backgroundImage,
  textOverlay,
  stickers,
  onStickerUpdate,
  isFullStrip,
  layout,
  step,
}) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const [stripDimensions, setStripDimensions] = useState({
    width: 0,
    height: 0,
  });

  const HALF_STRIP_WIDTH = 3 * 96; // 3 inches at 96 DPI
  const HALF_STRIP_HEIGHT = 9 * 96; // 9 inches at 96 DPI
  const FULL_STRIP_WIDTH = 6 * 96; // 6 inches at 96 DPI
  const FULL_STRIP_HEIGHT = 18 * 96; // 18 inches at 96 DPI
  const PADDING = 0.15 * 96; // Reduced padding to 0.15in
  const TEXT_SPACE = 1 * 96; // 1in text space at bottom

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
  }, [isFullStrip, layout, step]); // Re-run when step changes to adjust for camera visibility

  const onDragEnd = (result: DropResult) => {
    console.log("Drag End Result:", result); // Debug log to inspect drag result
    if (!result.destination) return;

    const newPhotos = Array.from(photos);
    const [reorderedItem] = newPhotos.splice(result.source.index, 1);
    newPhotos.splice(result.destination.index, 0, reorderedItem);

    if (isFullStrip && currentLayout.arrangement === "grid") {
      const maxCols = 2; // For grid layout
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

  const handleStickerDrag = (id: number, e: { x: number; y: number }) => {
    if (step !== "layout") {
      // Only allow dragging in customize/download steps
      const updatedStickers = stickers.map((sticker) =>
        sticker.id === id ? { ...sticker, x: e.x, y: e.y } : sticker
      );
      onStickerUpdate(updatedStickers);
    }
  };

  const handleStickerResize = (id: number, data: ResizeCallbackData) => {
    if (step !== "layout") {
      // Only allow resizing in customize/download steps
      const sticker = stickers.find((s) => s.id === id);
      if (!sticker) return;

      // Calculate new dimensions maintaining aspect ratio
      const newWidth = data.size.width;
      const newHeight = (newWidth / sticker.width) * sticker.height; // Maintain aspect ratio based on original dimensions

      const updatedStickers = stickers.map((s) =>
        s.id === id ? { ...s, width: newWidth, height: newHeight } : s
      );
      onStickerUpdate(updatedStickers);
    }
  };

  const handleStickerRotate = (id: number, rotate: number) => {
    if (step !== "layout") {
      // Only allow rotating in customize/download steps
      const updatedStickers = stickers.map((sticker) =>
        sticker.id === id ? { ...sticker, rotate } : sticker
      );
      onStickerUpdate(updatedStickers);
    }
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

  // Use react-dropzone for drag-and-drop upload
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (step === "layout" && photos.length < maxPhotos) {
        acceptedFiles.forEach((file) => onPhotoUpload(file));
      }
    },
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif"],
    },
    multiple: false, // Allow only one photo at a time
  });

  // Prevent upload trigger on remove button click
  const handlePhotoContainerClick = (e: React.MouseEvent) => {
    if (
      e.target instanceof HTMLButtonElement &&
      e.target.className === "remove-button"
    ) {
      e.stopPropagation(); // Stop event propagation to prevent triggering dropzone
    }
  };

  // Ensure Droppable is always rendered, even when photos are empty or step changes
  if (!photos || photos.length === 0) {
    console.log("No photos to render, rendering empty Droppable"); // Debug log
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className={`photo-strip ${isFullStrip ? "full-strip" : "half-strip"}`}
        ref={stripRef}
        style={{
          width:
            step === "layout"
              ? `${isFullStrip ? "calc(100% - 620px)" : "calc(100% - 620px)"}`
              : "100%", // Full width when camera is visible but inactive
          height: frameHeight,
          background: backgroundImage ? `url(${backgroundImage})` : frameColor,
          backgroundSize: "cover",
          backgroundPosition: "center",
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
              {...getRootProps()} // Add dropzone props for drag-and-drop
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
                height: "100%", // Use 100% to fill the frame height
                boxSizing: "border-box",
                position: "relative", // Ensure positioning for placeholders
              }}
            >
              <input {...getInputProps()} />{" "}
              {/* Hidden input for click-to-upload */}
              {photos.length > 0
                ? photos.map((photo, index) => (
                    <Draggable
                      key={photo.id}
                      draggableId={photo.id}
                      index={index}
                    >
                      {(provided: DraggableProvided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="photo-container"
                          onClick={handlePhotoContainerClick} // Prevent upload on remove button click
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
                            position: "relative", // Ensure remove button is positioned correctly
                            zIndex: 20, // Ensure photo container is above dropzone for remove button interaction
                          }}
                        >
                          <img
                            src={photo.url}
                            alt={`Photo ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              filter:
                                step === "layout" ? "grayscale(100%)" : "none", // Apply grayscale filter in layout step, none in customize/download
                            }}
                          />
                          <button
                            className="remove-button"
                            onClick={() => onPhotoRemove(photo.id)}
                            style={{
                              display: step === "layout" ? "none" : "block",
                            }} // Hide remove button in layout step
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))
                : // Show placeholders when no photos are present
                  Array.from({ length: maxPhotos }, (_, index) => (
                    <div
                      key={`placeholder-${index}`}
                      className={`photo-placeholder ${
                        isDragActive ? "drag-active" : ""
                      }`}
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
                        border: "2px dashed #999", // Dashed border for placeholders
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isDragActive ? "#e1e1e1" : "transparent", // Light gray background when dragging
                        cursor:
                          step === "layout" && photos.length < maxPhotos
                            ? "pointer"
                            : "not-allowed",
                        opacity:
                          step === "layout" && photos.length < maxPhotos
                            ? 1
                            : 0.5, // Dim if not in layout step or limit reached
                        zIndex: 10, // Lower z-index to ensure remove button is clickable
                      }}
                      onClick={() => {
                        if (step === "layout" && photos.length < maxPhotos) {
                          (
                            document.querySelector(`input[type="file"]`) as any
                          )?.click(); // Trigger file input click
                        }
                      }}
                    >
                      <span style={{ fontSize: "24px", color: "#999" }}>+</span>
                    </div>
                  ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {textOverlay && (
          <div
            className="text-overlay"
            style={{
              position: "absolute",
              bottom: "0.15in",
              left: "50%",
              transform: "translateX(-50%)", // Ensure correct centering
              width: "100%",
              textAlign: "center",
              display:
                step === "customize" || step === "download" ? "block" : "none", // Show text overlay only in customize and download steps
            }}
          >
            {textOverlay}
          </div>
        )}

        {stickers.map((sticker) => {
          const img = new Image();
          img.src = sticker.src;
          const naturalWidth = img.width;
          const naturalHeight = img.height;
          const naturalAspect = naturalWidth / naturalHeight;

          const handleRotate = (e: React.MouseEvent) => {
            if (step !== "layout") {
              // Only allow rotating in customize/download steps
              const rect = e.currentTarget.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const angle =
                Math.atan2(e.clientY - centerY, e.clientX - centerX) *
                  (180 / Math.PI) +
                90;
              handleStickerRotate(sticker.id, angle);
            }
          };

          return (
            <StickerDraggable
              key={sticker.id}
              position={{ x: sticker.x, y: sticker.y }}
              bounds="parent"
              onDrag={(e, data) =>
                handleStickerDrag(sticker.id, { x: data.x, y: data.y })
              }
              disabled={step === "layout"} // Disable dragging in layout step
            >
              <Resizable
                width={sticker.width}
                height={sticker.height / naturalAspect} // Ensure height respects aspect ratio
                onResize={(e, data) => handleStickerResize(sticker.id, data)}
                handleSize={[8, 8]}
                minConstraints={[50, 50 / naturalAspect]} // Minimum size, respecting aspect ratio
                maxConstraints={[
                  stripDimensions.width - 2 * PADDING,
                  (stripDimensions.height - 2 * PADDING - TEXT_SPACE) /
                    naturalAspect,
                ]}
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
                      display: step === "layout" ? "none" : "block", // Hide handles in layout step
                    }}
                  />
                )}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    border: "2px dashed #00f", // Highlight border
                    background: `url(${sticker.src})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    transform: `rotate(${sticker.rotate}deg)`,
                    cursor: "move",
                    display: step === "layout" ? "none" : "block", // Hide sticker in layout step
                  }}
                >
                  {/* Rotation handle (top-right corner) */}
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
                      display: step === "layout" ? "none" : "block", // Hide rotation handle in layout step
                    }}
                    onMouseDown={handleRotate}
                  />
                </div>
              </Resizable>
            </StickerDraggable>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default PhotoStrip;
