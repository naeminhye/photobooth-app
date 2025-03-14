// src/components/FrameControls.tsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUpload } from "@fortawesome/free-solid-svg-icons";
import "./styles.css";
import GradientPicker, { Gradient } from "../GradientPicker";
import ColorPicker from "../ColorPicker";

interface FrameControlsProps {
  onColorChange: (color: string) => void;
  onBackgroundChange: (image: string | null) => void;
  onForegroundChange: (image: string | null) => void;
  layout: number;
  onLayoutChange: (layout: number) => void;
  selectedPhotos: string[];
  onReset: () => void;
  onPhotoUpload: (files: File[]) => void;
  photoStripRef: React.RefObject<HTMLDivElement>;
  frameColor: string;
  backgroundImage: string | null;
  foregroundImage: string | null;
  onFilterChange?: (filter: string) => void; // Thêm prop cho filter
  frameGradient?: Gradient;
  onSelectFrameGradient: (gradient?: Gradient) => void;
}

const FrameControls: React.FC<FrameControlsProps> = ({
  onColorChange,
  onBackgroundChange,
  onForegroundChange,
  selectedPhotos,
  onReset,
  onPhotoUpload,
  photoStripRef,
  frameColor,
  backgroundImage,
  foregroundImage,
  onFilterChange,
  frameGradient,
  onSelectFrameGradient,
}) => {
  const [activeTab, setActiveTab] = useState("Background");
  const [selectedFilter, setSelectedFilter] = useState("none");

  const handleBackgroundColorChange = (color: string) => {
    onColorChange(color);
    onSelectFrameGradient(undefined);
  }

  const handleGradientChange = (gradient?: Gradient) => {
    onColorChange('');
    onSelectFrameGradient(gradient);
  }

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

  const handleBackgroundUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onBackgroundChange(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const filterValue = e.target.value;
    setSelectedFilter(filterValue);
    onFilterChange?.(filterValue);
  };

  return (
    <div className="frame-controls">
      <div className="tabs">
        <div className="tab-list">
          {["Background", "Foreground", "Filter"].map((tab) => (
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
              <label className="frame-controls-label">
                Background Color or Image
              </label>
              <ColorPicker
                value={frameColor}
                onColorChange={handleBackgroundColorChange} />
              <GradientPicker
                gradient={frameGradient}
                onSelect={handleGradientChange}
              />
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
          {activeTab === "Filter" && (
            <div className="frame-controls-section">
              <label className="frame-controls-label">Select Filter</label>
              <select
                value={selectedFilter}
                onChange={handleFilterChange}
                className="frame-controls-select"
              >
                <option value="none">None</option>
                <option value="bw">Black & White</option>
                <option value="whitening">Whitening</option>
                <option value="darker">Darker</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FrameControls;
