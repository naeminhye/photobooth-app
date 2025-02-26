// components/FrameControls.tsx
import React from "react";
import { LAYOUTS } from "../constants";

interface FrameControlsProps {
  onColorChange: (color: string) => void;
  onBackgroundChange: (image: string | null) => void;
  onTextChange: (text: string) => void;
  onStickerAdd: (sticker: {
    src: string;
    x: number;
    y: number;
    rotate: number;
    width: number;
    height: number;
  }) => void;
  isFullStrip: boolean;
  onStripSizeChange: (isFull: boolean) => void;
  layout: number;
  onLayoutChange: (layout: number) => void;
  capturedPhotos: string[]; // Keep as string[] for backward compatibility with URLs
  onReset: () => void;
  step: "layout" | "customize" | "download";
  onPhotoUpload: (file: File) => void; // New prop for handling uploaded photos
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
  step,
  onPhotoUpload,
}) => {
  const layouts: any = Object.entries(LAYOUTS).map(([id, layout]) => ({
    id: parseInt(id),
    name: `${isFullStrip ? '6x18"' : '3x9"'} ${layout.maxPhotos} Photo${
      layout.maxPhotos > 1 ? "s" : ""
    } (${
      layout.arrangement.charAt(0).toUpperCase() + layout.arrangement.slice(1)
    })`,
    strip: isFullStrip,
    maxPhotos: layout.maxPhotos,
  }));

  return (
    <div className="frame-controls">
      <div className="strip-size-control">
        <label>
          <input
            type="radio"
            name="stripSize"
            checked={!isFullStrip}
            onChange={() => {
              if (step === "layout" && capturedPhotos.length === 0) {
                onStripSizeChange(false);
              }
            }}
            disabled={step !== "layout" || capturedPhotos.length > 0}
          />
          Half Strip (3x9")
        </label>
        <label>
          <input
            type="radio"
            name="stripSize"
            checked={isFullStrip}
            onChange={() => {
              if (step === "layout" && capturedPhotos.length === 0) {
                onStripSizeChange(true);
              }
            }}
            disabled={step !== "layout" || capturedPhotos.length > 0}
          />
          Full Strip (6x18")
        </label>
      </div>

      <div className="layout-control">
        <label>Select Layout:</label>
        <select
          value={layout}
          onChange={(e) => {
            const newLayout = parseInt(e.target.value);
            if (step === "layout" && capturedPhotos.length === 0) {
              onLayoutChange(newLayout);
            }
          }}
          disabled={step !== "layout" || capturedPhotos.length > 0}
        >
          {layouts
            .filter((layout: any) => layout.strip === isFullStrip)
            .map((layout: any) => (
              <option key={layout.id} value={layout.id}>
                {layout.name}
              </option>
            ))}
        </select>
      </div>

      <div
        className="upload-photo"
        style={{
          display:
            step === "layout" &&
            capturedPhotos.length <
              layouts.find((l: any) => l.id === layout)?.maxPhotos
              ? "block"
              : "none",
        }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onPhotoUpload(e.target.files[0]);
            }
          }}
          disabled={
            step !== "layout" ||
            capturedPhotos.length >=
              layouts.find((l: any) => l.id === layout)?.maxPhotos
          }
        />
        <label>Upload Photo</label>
      </div>

      <div
        className="customize-controls"
        style={{ display: step === "customize" ? "block" : "none" }}
      >
        <input
          type="color"
          onChange={(e) => onColorChange(e.target.value)}
          disabled={step !== "customize"}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (step === "customize") {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () =>
                  onBackgroundChange(reader.result as string);
                reader.readAsDataURL(file);
              }
            }
          }}
          disabled={step !== "customize"}
        />

        <input
          type="text"
          placeholder="Add text overlay"
          onChange={(e) => onTextChange(e.target.value)}
          disabled={step !== "customize"}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (step === "customize") {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () =>
                  onStickerAdd({
                    src: reader.result as string,
                    x: 0,
                    y: 0,
                    rotate: 0,
                    width: 100,
                    height: 100,
                  });
                reader.readAsDataURL(file);
              }
            }
          }}
          disabled={step !== "customize"}
        />
      </div>

      <button
        className="reset-button"
        onClick={onReset}
        style={{
          marginTop: "10px",
          display: step !== "layout" ? "block" : "none",
        }}
      >
        Reset All
      </button>
    </div>
  );
};

export default FrameControls;
