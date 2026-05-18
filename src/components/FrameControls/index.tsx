// src/components/FrameControls/index.tsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUpload } from "@fortawesome/free-solid-svg-icons";

import GradientPicker, { Gradient } from "@/components/GradientPicker";
import ColorPicker from "@/components/ColorPicker";
import { LAYOUTS } from "@/constants";
import { FRAME_TEMPLATES, frameToDataURL } from "@/utils/frameTemplates";

import "./styles.css";

interface FrameControlsProps {
  onColorChange: (color: string) => void;
  onBackgroundChange: (file: File | null) => void;
  onForegroundChange: (image: string | null) => void;
  layout: number;
  onLayoutChange: (layout: number) => void;
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
  frameColor,
  backgroundImage,
  foregroundImage,
  onFilterChange,
  frameGradient,
  onSelectFrameGradient,
  layout,
}) => {
  const [activeTab, setActiveTab] = useState("Background");
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  const handleBackgroundColorChange = (color: string) => {
    onColorChange(color);
    onSelectFrameGradient(undefined);
  };

  const handleGradientChange = (gradient?: Gradient) => {
    onColorChange("");
    onSelectFrameGradient(gradient);
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

  const handleBackgroundUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      onBackgroundChange(file); // Pass the file to App's handler
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const filterValue = e.target.value;
    setSelectedFilter(filterValue);
    onFilterChange?.(filterValue);
  };

  const handleFrameSelect = (frameId: string) => {
    if (selectedFrameId === frameId) {
      // Deselect: remove the frame overlay
      setSelectedFrameId(null);
      onForegroundChange(null);
      return;
    }
    const canvas = LAYOUTS[layout ?? 0].canvas;
    const template = FRAME_TEMPLATES.find((f) => f.id === frameId);
    if (template) {
      const dataURL = frameToDataURL(template, canvas.width, canvas.height);
      setSelectedFrameId(frameId);
      onForegroundChange(dataURL);
    }
  };

  return (
    <div className="frame-controls">
      <div className="tabs">
        <div className="tab-list">
          {["Background", "Foreground", "Frames", "Filter"].map((tab) => (
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
                value={backgroundImage ? "" : frameColor}
                onColorChange={handleBackgroundColorChange}
              />
              <div style={{ fontSize: 12, textAlign: "center", marginTop: 12 }}>
                Or pick a Gradient
              </div>
              <GradientPicker
                gradient={backgroundImage ? undefined : frameGradient}
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
                <label className="upload-button" style={{ marginTop: 16 }}>
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
          {activeTab === "Frames" && (
            <div className="frame-controls-section">
              <label className="frame-controls-label">Frame Templates</label>
              <div className="frames-grid">
                {FRAME_TEMPLATES.map((tpl) => {
                  const canvas = LAYOUTS[layout ?? 0].canvas;
                  const previewUrl = frameToDataURL(tpl, canvas.width, canvas.height);
                  return (
                    <div
                      key={tpl.id}
                      className={`frame-card ${selectedFrameId === tpl.id ? "active" : ""}`}
                      onClick={() => handleFrameSelect(tpl.id)}
                      title={tpl.name}
                    >
                      <img
                        src={previewUrl}
                        alt={tpl.name}
                        className="frame-card-img"
                      />
                      <span className="frame-card-name">{tpl.icon} {tpl.name}</span>
                    </div>
                  );
                })}
              </div>
              {selectedFrameId && (
                <button
                  className="upload-button"
                  style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
                  onClick={() => { setSelectedFrameId(null); onForegroundChange(null); }}
                >
                  <FontAwesomeIcon icon={faTrash} /> Remove Frame
                </button>
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
