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
  onForegroundChange: (image: string | null) => void;
  onTextChange: (text: string) => void;
  onStickerAdd: (type: ElementType) => void;
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
  foregroundImage: string | null;
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
  onForegroundChange,
  onTextChange,
  onStickerAdd,
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
  foregroundImage,
}) => {
  const [textInput, setTextInput] = useState("");

  const layouts = Object.entries(LAYOUTS).map(([id, layout]) => ({
    id: parseInt(id),
    name: `${layout.maxPhotos} Photo${layout.maxPhotos > 1 ? "s" : ""} (${
      layout.arrangement.charAt(0).toUpperCase() + layout.arrangement.slice(1)
    })`,
    maxPhotos: layout.maxPhotos,
  }));

  const currentLayout = layouts.find((l) => l.id === layout);
  const maxPhotos = currentLayout?.maxPhotos ?? 0;

  const downloadImage = () => {
    const photoStrip = photoStripRef.current;
    if (photoStrip) {
      html2canvas(photoStrip, {
        scale: 1, // Use 1:1 scale to avoid distortion
        useCORS: true,
        allowTaint: true, // Allow cross-origin images
        backgroundColor: null, // Preserve transparency
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

  // Handle foreground image upload
  const handleForegroundUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onForegroundChange(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="frame-controls">
      <h2 className="frame-controls-title">Photobooth Controls</h2>
      <hr className="frame-controls-divider" />

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
          {layouts.map((layout) => (
            <option key={layout.id} value={layout.id}>
              {layout.name}
            </option>
          ))}
        </select>
      </div>

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
      </div>

      <div className="frame-controls-section">
        <label className="frame-controls-label">Select Foreground Image</label>
        <div style={{ marginTop: "20px" }}>
          <input
            type="file"
            accept="image/png" // Recommend PNG for transparency
            onChange={handleForegroundUpload}
          />
          {foregroundImage && (
            <button
              onClick={() => onForegroundChange(null)}
              className="frame-controls-button"
            >
              Remove Foreground Image
            </button>
          )}
        </div>
      </div>

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
