import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import html2canvas from "html2canvas";

import { LAYOUTS } from "../../constants";
import "./styles.css";

interface Sticker {
  id: number;
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface FrameControlsProps {
  onColorChange: (color: string) => void;
  onBackgroundChange: (image: string | null) => void;
  onForegroundChange: (image: string | null) => void;
  layout: number;
  onLayoutChange: (layout: number) => void;
  capturedPhotos: string[];
  onReset: () => void;
  onPhotoUpload: (files: File[]) => void;
  photoStripRef: React.RefObject<HTMLDivElement>;
  frameColor: string;
  backgroundImage: string | null;
  foregroundImage: string | null;
  stickers: Sticker[];
  setStickers: React.Dispatch<React.SetStateAction<Sticker[]>>;
  uploadedStickers: HTMLImageElement[];
  setUploadedStickers: React.Dispatch<React.SetStateAction<HTMLImageElement[]>>;
}

const FrameControls: React.FC<FrameControlsProps> = ({
  onColorChange,
  onBackgroundChange,
  onForegroundChange,
  layout,
  onLayoutChange,
  capturedPhotos,
  onReset,
  onPhotoUpload,
  photoStripRef,
  frameColor,
  backgroundImage,
  foregroundImage,
  stickers,
  setStickers,
  uploadedStickers,
  setUploadedStickers,
}) => {
  const [activeTab, setActiveTab] = useState("Layout");

  const layouts = Object.entries(LAYOUTS).map(([id, layout]) => ({
    id: parseInt(id),
    name: `${layout.maxPhotos} Photo${layout.maxPhotos > 1 ? "s" : ""} (${
      layout.arrangement.charAt(0).toUpperCase() + layout.arrangement.slice(1)
    })`,
    maxPhotos: layout.maxPhotos,
  }));

  const downloadImage = () => {
    const photoStrip = photoStripRef.current;
    if (photoStrip) {
      html2canvas(photoStrip, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
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
    }
  };

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

  const handleStickerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newStickers = files.map((file) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      return img;
    });
    setUploadedStickers((prev) => [...prev, ...newStickers]);
  };

  const addStickerToCanvas = (stickerImg: HTMLImageElement) => {
    const newSticker: Sticker = {
      id: Date.now(),
      image: stickerImg,
      x: (3 * 96) / 2,
      y: (capturedPhotos.length * 2 * 96) / 2 || 96,
      width: 100,
      height: 100,
      rotation: 0,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  return (
    <div className="frame-controls">
      <div className="tabs">
        <div className="tab-list">
          {["Layout", "Background", "Foreground", "Stickers"].map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="tab-content">
          {activeTab === "Layout" && (
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
          )}
          {activeTab === "Background" && (
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
          )}
          {activeTab === "Foreground" && (
            <div className="frame-controls-section">
              <label className="frame-controls-label">
                Select Foreground Image
              </label>
              <input
                type="file"
                accept="image/png"
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
          )}
          {activeTab === "Stickers" && (
            <div className="frame-controls-section">
              <label className="frame-controls-label">Add Sticker</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleStickerUpload}
              />
              <div className="sticker-preview">
                {uploadedStickers.map((sticker, index) => (
                  <img
                    key={index}
                    src={sticker.src}
                    alt="Sticker"
                    style={{
                      width: "50px",
                      height: "50px",
                      margin: "5px",
                      cursor: "pointer",
                    }}
                    onClick={() => addStickerToCanvas(sticker)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <button
        className="frame-controls-button frame-controls-button-danger"
        onClick={onReset}
        style={{
          marginTop: "10px",
          display: capturedPhotos.length > 0 ? "inline-block" : "none",
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
