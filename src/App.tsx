// App.tsx
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import PhotoStrip from "./components/PhotoStrip";
import FrameControls from "./components/FrameControls";
import CameraFeed from "./components/CameraFeed";
import SequentialGif from "./components/SequentialGif";
import { LAYOUTS } from "./constants";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useDropzone } from "react-dropzone";
import GradientBackground from "./components/GradientBackground";

interface Photo {
  id: string;
  url: string;
}

interface Sticker {
  id: number;
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

const App: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<Photo[]>([]);
  const [previewPhotos, setPreviewPhotos] = useState<Photo[]>([]);
  const [frameColor, setFrameColor] = useState<string>("#FFFFFF");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [layout, setLayout] = useState<number>(1);
  const [selectedPreviewPhotos, setSelectedPreviewPhotos] = useState<string[]>(
    []
  );
  const [foregroundImage, setForegroundImage] = useState<string | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [uploadedStickers, setUploadedStickers] = useState<HTMLImageElement[]>(
    []
  );
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [isCreatingGif, setIsCreatingGif] = useState(false);
  const photoStripRef: any = useRef<HTMLDivElement>(null);
  const sequentialGifRef = useRef<HTMLDivElement>(null);

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
    setPreviewPhotos([]);
    setFrameColor("#FFF");
    setBackgroundImage(null);
    setForegroundImage(null);
    setLayout(1);
    setSelectedPreviewPhotos([]);
    setStickers([]);
    setUploadedStickers([]);
    setTimerEnabled(false);
    setGifUrl(null);
    setIsCreatingGif(false);
  };

  const handlePhotoCapture = (photo: string) => {
    if (previewPhotos.length >= 10) {
      alert("Maximum preview photo limit (10) reached.");
      return;
    }
    const newPhoto: Photo = { id: uuidv4(), url: photo };
    setPreviewPhotos((prev) => [...prev, newPhoto]);
  };

  const handleGifComplete = (gifUrl: string) => {
    setGifUrl(gifUrl);
  };

  const handlePhotoUpload = (files: File[]) => {
    if (previewPhotos.length + files.length > 10) {
      alert(
        "Adding these photos would exceed the maximum preview photo limit (10)."
      );
      return;
    }
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);
    const newPhotos = validFiles.map((file) => {
      const reader = new FileReader();
      return new Promise<Photo>((resolve) => {
        reader.onload = (e) =>
          resolve({ id: uuidv4(), url: e.target?.result as string });
        reader.readAsDataURL(file);
      });
    });
    Promise.all(newPhotos).then((photos) =>
      setPreviewPhotos((prev) => [...prev, ...photos])
    );
  };

  const toggleFromStrip = (id: string) => {
    const isSelected = selectedPreviewPhotos.includes(id);
    if (isSelected) {
      setCapturedPhotos((prev) => prev.filter((photo) => photo.id !== id));
      setSelectedPreviewPhotos((prev) =>
        prev.filter((photoId) => photoId !== id)
      );
    } else if (capturedPhotos.length < LAYOUTS[layout].maxPhotos) {
      const photoToAdd = previewPhotos.find((photo) => photo.id === id);
      if (photoToAdd) {
        setCapturedPhotos((prev) => [...prev, photoToAdd]);
        setSelectedPreviewPhotos((prev) => [...prev, id]);
      }
    } else {
      alert("Maximum photo limit for the strip reached.");
    }
  };

  const deletePreviewPhoto = (id: string) => {
    setPreviewPhotos((prev) => prev.filter((photo) => photo.id !== id));
    if (selectedPreviewPhotos.includes(id)) {
      setCapturedPhotos((prev) => prev.filter((photo) => photo.id !== id));
      setSelectedPreviewPhotos((prev) =>
        prev.filter((photoId) => photoId !== id)
      );
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handlePhotoUpload,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".svg", ".gif"] },
    multiple: true,
  });

  return (
    <div className="app" tabIndex={0}>
      <GradientBackground />
      <div className="main-container">
        {hasPermission ? (
          <div className="controls-and-strip">
            <div className="strip-container">
              <div className="photo-camera-container">
                <div>
                  <CameraFeed
                    onCapture={handlePhotoCapture}
                    onGifComplete={handleGifComplete}
                    layout={layout}
                    maxPhotos={LAYOUTS[layout].maxPhotos}
                    currentPhotos={capturedPhotos.length}
                    showCamera={true}
                    timerEnabled={timerEnabled}
                    setIsCreatingGif={setIsCreatingGif}
                  />
                  <div style={{ marginTop: "20px" }}>
                    <SequentialGif
                      ref={sequentialGifRef}
                      gifUrl={gifUrl}
                      isCreatingGif={isCreatingGif}
                    />
                  </div>
                  <div className="preview-photos">
                    <h3>Preview Photos</h3>
                    <div className="preview-photos-list">
                      {previewPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className={`preview-photo ${
                            selectedPreviewPhotos.includes(photo.id)
                              ? "selected"
                              : ""
                          } ${
                            capturedPhotos.length >= LAYOUTS[layout].maxPhotos
                              ? "cannot-select"
                              : ""
                          }`}
                          onClick={() => toggleFromStrip(photo.id)}
                        >
                          <img src={photo.url} alt="Preview" />
                          {selectedPreviewPhotos.includes(photo.id) && (
                            <div className="selected-count">
                              <FontAwesomeIcon
                                icon={faCheck}
                                className="check-icon"
                              />
                            </div>
                          )}
                          <button
                            className="delete-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePreviewPhoto(photo.id);
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                      {previewPhotos.length < 10 && (
                        <div
                          {...getRootProps()}
                          className="upload-placeholder"
                          style={{
                            background: isDragActive
                              ? "#e1e1e1"
                              : "transparent",
                          }}
                        >
                          <input {...getInputProps()} />
                          <FontAwesomeIcon
                            icon={faPlus}
                            style={{ fontSize: "24px", color: "#999" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <FrameControls
                  onColorChange={setFrameColor}
                  onBackgroundChange={setBackgroundImage}
                  onForegroundChange={setForegroundImage}
                  backgroundImage={backgroundImage}
                  foregroundImage={foregroundImage}
                  layout={layout}
                  onLayoutChange={setLayout}
                  capturedPhotos={capturedPhotos.map((photo) => photo.url)}
                  onReset={resetAll}
                  onPhotoUpload={handlePhotoUpload}
                  photoStripRef={photoStripRef}
                  frameColor={frameColor}
                  stickers={stickers}
                  setStickers={setStickers}
                  uploadedStickers={uploadedStickers}
                  setUploadedStickers={setUploadedStickers}
                  timerEnabled={timerEnabled}
                  onTimerToggle={setTimerEnabled}
                />
                <PhotoStrip
                  ref={photoStripRef}
                  photos={capturedPhotos}
                  frameColor={frameColor}
                  backgroundImage={backgroundImage}
                  layout={layout}
                  foregroundImage={foregroundImage}
                  stickers={stickers}
                  setStickers={setStickers}
                />
              </div>
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
