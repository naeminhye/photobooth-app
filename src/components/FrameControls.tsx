// components/FrameControls.tsx
import React, { useState, useRef } from "react";
import {
  LAYOUTS,
  ElementType,
  SUPPORTED_FORMATS,
  MAX_FILE_SIZE,
  MAX_UPLOAD_COUNT,
} from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faSquare,
  faStar,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import html2canvas from "html2canvas";

interface FrameControlsProps {
  onColorChange: (color: string) => void;
  onBackgroundChange: (image: string | null) => void;
  onTextChange: (text: string) => void;
  onStickerAdd: (type: ElementType) => void;
  isFullStrip: boolean;
  onStripSizeChange: (isFull: boolean) => void;
  layout: number;
  onLayoutChange: (layout: number) => void;
  capturedPhotos: string[];
  onReset: () => void;
  onPhotoUpload: (files: File[]) => void; // Updated to accept multiple files
  stickers: Element[];
  selectedElementId: string | null;
  onStickerUpdate: (stickers: Element[]) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  photoStripRef: React.RefObject<HTMLDivElement>;
  frameColor: string;
  textOverlay: string;
  backgroundImage: string | null;
}

interface Element {
  id: string;
  type: ElementType;
  src?: string;
  text?: string;
  shape?: "circle" | "square" | "triangle" | "polygon" | "line";
  x: number;
  y: number;
  rotate: number;
  width: number;
  height: number;
  zIndex: number;
}

const FrameControls: React.FC<FrameControlsProps> = ({
  onColorChange,
  onBackgroundChange,
  onTextChange,
  onStickerAdd,
  isFullStrip,
  onStripSizeChange,
  layout,
  onLayoutChange,
  capturedPhotos,
  onReset,
  onPhotoUpload,
  stickers,
  selectedElementId,
  onStickerUpdate,
  bringToFront,
  sendToBack,
  photoStripRef,
  frameColor,
  textOverlay,
  backgroundImage,
}) => {
  const [textInput, setTextInput] = useState("");

  const layouts = Object.entries(LAYOUTS).map(([id, layout]) => ({
    id: parseInt(id),
    name: `${isFullStrip ? '6x18"' : '3x9"'} ${layout.maxPhotos} Photo${
      layout.maxPhotos > 1 ? "s" : ""
    } (${
      layout.arrangement.charAt(0).toUpperCase() + layout.arrangement.slice(1)
    })`,
    strip: isFullStrip,
    maxPhotos: layout.maxPhotos,
  }));

  const currentLayout = layouts.find((l) => l.id === layout);
  const maxPhotos = currentLayout?.maxPhotos ?? 0;

  const downloadImage = () => {
    const photoStrip = photoStripRef.current;
    if (photoStrip) {
      html2canvas(photoStrip, {
        scale: window.devicePixelRatio,
        useCORS: true,
      })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `photobooth_${Date.now()}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        })
        .catch((error) => {
          console.error("Error generating canvas:", error);
        });
    } else {
      console.error("Photo strip element not found");
    }
  };

  return (
    <div className="frame-controls">
      <h2 className="frame-controls-title">Photobooth Controls</h2>
      <hr className="frame-controls-divider" />

      <div className="frame-controls-section">
        <span className="frame-controls-label">Strip Size</span>
        <div className="frame-controls-radio-group">
          <label className="frame-controls-radio">
            <input
              type="radio"
              name="stripSize"
              checked={!isFullStrip}
              onChange={() => {
                if (capturedPhotos.length === 0) {
                  onStripSizeChange(false);
                }
              }}
              disabled={capturedPhotos.length > 0}
            />
            <span>Half Strip (3x9")</span>
          </label>
          <label className="frame-controls-radio">
            <input
              type="radio"
              name="stripSize"
              checked={isFullStrip}
              onChange={() => {
                if (capturedPhotos.length === 0) {
                  onStripSizeChange(true);
                }
              }}
              disabled={capturedPhotos.length > 0}
            />
            <span>Full Strip (6x18")</span>
          </label>
        </div>
      </div>

      <div className="frame-controls-section">
        <label className="frame-controls-label">Select Layout</label>
        <select
          value={layout}
          onChange={(e) => {
            const newLayout = parseInt(e.target.value);
            if (capturedPhotos.length === 0) {
              onLayoutChange(newLayout);
            }
          }}
          disabled={capturedPhotos.length > 0}
          className="frame-controls-select"
        >
          {layouts
            .filter((layout) => layout.strip === isFullStrip)
            .map((layout) => (
              <option key={layout.id} value={layout.id}>
                {layout.name}
              </option>
            ))}
        </select>
      </div>

      {/* <div className="frame-controls-section">
        <input
          type="file"
          accept="image/*"
          multiple // Allow multiple file selection
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              onPhotoUpload(files);
            }
          }}
          className="frame-controls-file-input"
        />
        <button
          onClick={() =>
            (document.querySelector('input[type="file"]') as any)?.click()
          }
          className="frame-controls-button"
        >
          Upload Photos
        </button>
      </div> */}

      {/* <div className="frame-controls-section">
        <button
          onClick={() => onStickerAdd("image")}
          disabled={stickers.length >= MAX_UPLOAD_COUNT}
          className="frame-controls-button"
        >
          Upload Image
        </button>
        <button
          onClick={() => onStickerAdd("text")}
          className="frame-controls-button"
        >
          Add Text
        </button>
        <button
          onClick={() => onStickerAdd("shape")}
          className="frame-controls-button"
        >
          Add Shape
        </button>
        <button
          onClick={() => onStickerAdd("icon")}
          className="frame-controls-button"
        >
          Add Icon
        </button>
        {stickers.some(
          (s) => s.type === "text" && s.id === selectedElementId
        ) && (
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onBlur={() => {
              if (selectedElementId) {
                const updatedStickers = stickers.map((s) =>
                  s.id === selectedElementId ? { ...s, text: textInput } : s
                );
                onStickerUpdate(updatedStickers);
              }
            }}
            placeholder="Enter text"
            className="frame-controls-input"
          />
        )}
        {stickers.some(
          (s) => s.type === "shape" && s.id === selectedElementId
        ) && (
          <select
            onChange={(e) => {
              if (selectedElementId) {
                const shape = e.target.value as
                  | "circle"
                  | "square"
                  | "triangle"
                  | "polygon"
                  | "line";
                const updatedStickers = stickers.map((s) =>
                  s.id === selectedElementId ? { ...s, shape } : s
                );
                onStickerUpdate(updatedStickers);
              }
            }}
            className="frame-controls-select"
          >
            <option value="circle">Circle</option>
            <option value="square">Square</option>
            <option value="triangle">Triangle</option>
            <option value="polygon">Polygon</option>
            <option value="line">Line</option>
          </select>
        )}
      </div> */}

      <div className="frame-controls-section">
        <label className="frame-controls-label">
          Select Background Color or Image
        </label>
        {!backgroundImage && (
          <input
            type="color"
            value={frameColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="frame-controls-color-input"
          />
        )}

        {backgroundImage ? (
          <div style={{ position: "relative", padding: "1px" }}>
            <img
              style={{ width: "100%", border: "1px solid black" }}
              src={backgroundImage}
              alt="Background Preview"
            />
            <button
              className="remove-button"
              onClick={() => onBackgroundChange(null)}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () =>
                  onBackgroundChange(reader.result as string);
                reader.readAsDataURL(file);
              }
            }}
          />
        )}

        {/* <input
          type="text"
          value={textOverlay}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Add text overlay"
          className="frame-controls-input"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (stickers.length < MAX_UPLOAD_COUNT) {
              const file = e.target.files?.[0];
              if (
                file &&
                SUPPORTED_FORMATS.some((format) =>
                  file.name.toLowerCase().endsWith(format)
                ) &&
                file.size <= MAX_FILE_SIZE
              ) {
                const reader = new FileReader();
                reader.onload = () => onStickerAdd("image");
                reader.readAsDataURL(file);
              } else if (file?.size && file?.size > MAX_FILE_SIZE) {
                alert("File size exceeds 10MB limit.");
              } else {
                alert(
                  "Unsupported file format. Please use .png, .jpg, .jpeg, .svg, or .gif."
                );
              }
            } else {
              alert("Maximum upload limit of 10 files reached.");
            }
          }}
          className="frame-controls-file-input"
        /> */}
      </div>

      {/* <div className="frame-controls-section">
        <button
          onClick={() => bringToFront(selectedElementId!)}
          disabled={!selectedElementId}
          className="frame-controls-button"
        >
          Bring to Front
        </button>
        <button
          onClick={() => sendToBack(selectedElementId!)}
          disabled={!selectedElementId}
          className="frame-controls-button"
        >
          Send to Back
        </button>
      </div> */}

      <button
        className="frame-controls-button frame-controls-button-danger"
        onClick={onReset}
        style={{
          marginTop: "10px",
          display:
            capturedPhotos.length > 0 || stickers.length > 0
              ? "inline-block"
              : "none",
        }}
      >
        Reset All
      </button>
      <button
        className="frame-controls-button frame-controls-button-success"
        onClick={downloadImage}
        style={{
          marginTop: "10px",
          display: capturedPhotos.length > 0 ? "inline-block" : "none",
        }}
      >
        Download
      </button>
    </div>
  );
};

export default FrameControls;
