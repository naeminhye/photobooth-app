// App.tsx
import React, { useState, useEffect } from "react";
import "./App.css";
import PhotoStrip from "./components/PhotoStrip";
import FrameControls from "./components/FrameControls";
import CameraFeed from "./components/CameraFeed";
import { LAYOUTS, Layout } from "./constants";
import { v4 as uuidv4 } from "uuid"; // Import UUID generator

interface Photo {
  id: string;
  url: string;
}

const App: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<Photo[]>([]);
  const [frameColor, setFrameColor] = useState<string>("#000000");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [textOverlay, setTextOverlay] = useState<string>("");
  const [stickers, setStickers] = useState<
    {
      id: number;
      src: string;
      x: number;
      y: number;
      rotate: number;
      width: number;
      height: number;
    }[]
  >([]);
  const [isFullStrip, setIsFullStrip] = useState(false);
  const [layout, setLayout] = useState<number>(1); // Default to layout 1 (2x6" 3 Photo)
  const [step, setStep] = useState<"layout" | "customize" | "download">(
    "layout"
  ); // Track step in UX flow

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  const resetAll = () => {
    setCapturedPhotos([]);
    setFrameColor("#000000");
    setBackgroundImage(null);
    setTextOverlay("");
    setStickers([]);
    setIsFullStrip(false);
    setLayout(1); // Reset to default layout
    setStep("layout"); // Reset to first step
  };

  const handlePhotoCapture = (photo: string) => {
    if (capturedPhotos.length < LAYOUTS[layout].maxPhotos) {
      const newPhoto: Photo = { id: uuidv4(), url: photo };
      setCapturedPhotos([...capturedPhotos, newPhoto]);
      if (capturedPhotos.length + 1 === LAYOUTS[layout].maxPhotos) {
        setStep("customize"); // Move to customize step after capturing all photos
      }
    }
  };

  const handlePhotoUpload = (file: File) => {
    if (capturedPhotos.length < LAYOUTS[layout].maxPhotos) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target?.result as string;
        const newPhoto: Photo = { id: uuidv4(), url: photoUrl };
        setCapturedPhotos([...capturedPhotos, newPhoto]);
        if (capturedPhotos.length + 1 === LAYOUTS[layout].maxPhotos) {
          setStep("customize"); // Move to customize step after uploading all photos
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadImage = () => {
    const photoStrip = document.querySelector(".photo-strip");
    if (photoStrip) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context) {
        const { width, height } = photoStrip.getBoundingClientRect();
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;

        context.scale(window.devicePixelRatio, window.devicePixelRatio);
        context.drawImage(photoStrip as any, 0, 0);

        const link = document.createElement("a");
        link.download = `photobooth_${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    }
  };

  return (
    <div className="app">
      <h1>Photobooth</h1>
      <div className="main-container">
        {hasPermission ? (
          <div className="controls-and-strip">
            <FrameControls
              onColorChange={setFrameColor}
              onBackgroundChange={setBackgroundImage}
              onTextChange={setTextOverlay}
              onStickerAdd={(sticker) =>
                setStickers([
                  ...stickers,
                  {
                    ...sticker,
                    id: Date.now(),
                    rotate: 0,
                    width: 100,
                    height: 100,
                  },
                ])
              }
              isFullStrip={isFullStrip}
              onStripSizeChange={setIsFullStrip}
              layout={layout}
              onLayoutChange={(newLayout) => {
                if (step === "layout" && capturedPhotos.length === 0) {
                  setLayout(newLayout);
                }
              }}
              capturedPhotos={capturedPhotos.map((photo) => photo.url)} // Pass URLs for backward compatibility
              onReset={resetAll}
              step={step}
              onPhotoUpload={handlePhotoUpload}
            />
            <div className="strip-container">
              <div className="photo-camera-container">
                <CameraFeed
                  onCapture={handlePhotoCapture}
                  isFullStrip={isFullStrip}
                  layout={layout}
                  maxPhotos={LAYOUTS[layout].maxPhotos}
                  currentPhotos={capturedPhotos.length}
                  showCamera={step === "layout"} // Only show camera in layout step for interaction, but keep UI visible
                />
                <PhotoStrip
                  photos={capturedPhotos}
                  onPhotoCapture={handlePhotoCapture}
                  onPhotoOrderChange={(newPhotos) =>
                    setCapturedPhotos(newPhotos)
                  }
                  onPhotoRemove={(id) =>
                    setCapturedPhotos((photos) =>
                      photos.filter((photo) => photo.id !== id)
                    )
                  }
                  onPhotoUpload={handlePhotoUpload}
                  frameColor={frameColor}
                  backgroundImage={backgroundImage}
                  textOverlay={textOverlay}
                  stickers={stickers}
                  onStickerUpdate={setStickers}
                  isFullStrip={isFullStrip}
                  layout={layout}
                  step={step}
                />
              </div>
              {step === "layout" &&
                capturedPhotos.length < LAYOUTS[layout].maxPhotos && (
                  <button
                    className="next-button"
                    onClick={() => setStep("customize")}
                  >
                    Next: Customize
                  </button>
                )}
              {step === "customize" && (
                <button
                  className="next-button"
                  onClick={() => setStep("download")}
                >
                  Next: Download
                </button>
              )}
              {step === "download" && (
                <button className="download-button" onClick={downloadImage}>
                  Download Image
                </button>
              )}
            </div>
          </div>
        ) : (
          <p>Please allow camera access to use the photobooth</p>
        )}
      </div>
    </div>
  );
};

export default App;
