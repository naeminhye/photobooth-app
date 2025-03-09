import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUpload } from "@fortawesome/free-solid-svg-icons";
import html2canvas from "html2canvas";
import "./styles.css";

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
  stickers: any[]; // Không dùng
  setStickers: React.Dispatch<React.SetStateAction<any>>; // Không dùng
  uploadedStickers: any[]; // Không dùng
  setUploadedStickers: React.Dispatch<React.SetStateAction<any>>; // Không dùng
  timerEnabled: boolean;
  onTimerToggle: (enabled: boolean) => void;
}

const FrameControls: React.FC<FrameControlsProps> = ({
  onColorChange,
  onBackgroundChange,
  onForegroundChange,
  capturedPhotos,
  onReset,
  onPhotoUpload,
  photoStripRef,
  frameColor,
  backgroundImage,
  foregroundImage,
}) => {
  const [activeTab, setActiveTab] = useState("Background");

  const downloadImage = () => {
    const photoStrip = photoStripRef.current;
    if (photoStrip) {
      html2canvas(photoStrip, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `photobooth_${Date.now()}.jpg`;
          link.href = canvas.toDataURL("image/jpeg", 1.0);
          link.click();
        })
        .catch((error) => {
          console.error("Error generating canvas:", error);
        });
    }
  };

  const handleForegroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onForegroundChange(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onBackgroundChange(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="frame-controls">
      <div className="tabs">
        <div className="tab-list">
          {["Background", "Foreground"].map((tab) => (
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
          {activeTab === "Background" && (
            <div className="frame-controls-section">
              <label className="frame-controls-label">Background Color or Image</label>
              {!backgroundImage && (
                <input
                  type="color"
                  value={frameColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="frame-controls-color-input"
                />
              )}
              {backgroundImage ? (
                <div className="image-preview-container">
                  <img
                    className="image-preview"
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
                <label className="upload-button">
                  <FontAwesomeIcon icon={faUpload} /> Upload Background
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    className="frame-controls-file-input"
                    hidden
                  />
                </label>
              )}
            </div>
          )}
          {activeTab === "Foreground" && (
            <div className="frame-controls-section">
              <label className="frame-controls-label">Foreground Image</label>
              {foregroundImage ? (
                <div className="image-preview-container">
                  <img
                    className="image-preview"
                    src={foregroundImage}
                    alt="Foreground Preview"
                  />
                  <button
                    className="remove-button"
                    onClick={() => onForegroundChange(null)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ) : (
                <label className="upload-button">
                  <FontAwesomeIcon icon={faUpload} /> Upload Foreground
                  <input
                    type="file"
                    accept="image/png"
                    onChange={handleForegroundUpload}
                    className="frame-controls-file-input"
                    hidden
                  />
                </label>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="frame-controls-actions">
        <button
          className="frame-controls-button frame-controls-button-danger"
          onClick={onReset}
          style={{ display: capturedPhotos.length > 0 ? "inline-block" : "none" }}
        >
          Reset All
        </button>
        <button
          className="frame-controls-button frame-controls-button-success"
          onClick={downloadImage}
          style={{ display: capturedPhotos.length > 0 ? "inline-block" : "none" }}
        >
          Download
        </button>
      </div>
    </div>
  );
};

export default FrameControls;