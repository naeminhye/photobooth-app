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
  const [selectedPreviewPhotos, setSelectedPreviewPhotos] = useState<string[]>([]);
  const [foregroundImage, setForegroundImage] = useState<string | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [uploadedStickers, setUploadedStickers] = useState<HTMLImageElement[]>([]);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number>(10); // Default 10s
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [isCreatingGif, setIsCreatingGif] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [isMirrored, setIsMirrored] = useState<boolean>(true); // Default mirrored
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
    setCountdownTime(10);
    setGifUrl(null);
    setIsCreatingGif(false);
    setStep(1);
    setIsMirrored(true);
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
      alert("Adding these photos would exceed the maximum preview photo limit (10).");
      return;
    }
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);
    const newPhotos = validFiles.map((file) => {
      const reader = new FileReader();
      return new Promise<Photo>((resolve) => {
        reader.onload = (e) => resolve({ id: uuidv4(), url: e.target?.result as string });
        reader.readAsDataURL(file);
      });
    });
    Promise.all(newPhotos).then((photos) => setPreviewPhotos((prev) => [...prev, ...photos]));
  };

  const toggleFromStrip = (id: string) => {
    const isSelected = selectedPreviewPhotos.includes(id);
    if (isSelected) {
      setCapturedPhotos((prev) => prev.filter((photo) => photo.id !== id));
      setSelectedPreviewPhotos((prev) => prev.filter((photoId) => photoId !== id));
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
      setSelectedPreviewPhotos((prev) => prev.filter((photoId) => photoId !== id));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handlePhotoUpload,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".svg", ".gif"] },
    multiple: true,
  });

  const goToNextStep = () => {
    if (previewPhotos.length > 0) {
      setStep(2);
    } else {
      alert("Please capture at least one photo before proceeding.");
    }
  };

  const goToPreviousStep = () => {
    setStep(1);
  };

  const layouts = Object.entries(LAYOUTS).map(([id, layout]) => ({
    id: parseInt(id),
    name: `${layout.maxPhotos} Photo${layout.maxPhotos > 1 ? "s" : ""} (${layout.arrangement.charAt(0).toUpperCase() + layout.arrangement.slice(1)
      })`,
    maxPhotos: layout.maxPhotos,
  }));

  const countdownOptions = [
    { value: 3, label: "3s" },
    { value: 5, label: "5s" },
    { value: 10, label: "10s" },
  ];

  const renderPreviewPhotos = () => (
    <div className="preview-photos">
      <h3>Preview Photos</h3>
      <div className="preview-photos-list">
        {previewPhotos.map((photo) => (
          <div
            key={photo.id}
            className={`preview-photo ${selectedPreviewPhotos.includes(photo.id) ? "selected" : ""
              } ${capturedPhotos.length >= LAYOUTS[layout].maxPhotos ? "cannot-select" : ""
              }`}
            onClick={() => toggleFromStrip(photo.id)}
          >
            <img src={photo.url} alt="Preview" />
            {selectedPreviewPhotos.includes(photo.id) && (
              <div className="selected-count">
                <FontAwesomeIcon icon={faCheck} className="check-icon" />
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
            style={{ background: isDragActive ? "#e1e1e1" : "transparent" }}
          >
            <input {...getInputProps()} />
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: "24px", color: "#999" }} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="app">
      <GradientBackground />
      <div className="main-container">
        {hasPermission ? (
          <div className="app-content">
            {step === 1 && (
              <div className="step-1">
                <h2 className="step-title">Capture Your Moments</h2>
                <div className="capture-container">
                  <CameraFeed
                    onCapture={handlePhotoCapture}
                    onGifComplete={handleGifComplete}
                    layout={layout}
                    maxPhotos={LAYOUTS[layout].maxPhotos}
                    currentPhotos={capturedPhotos.length}
                    showCamera={true}
                    timerEnabled={timerEnabled}
                    setIsCreatingGif={setIsCreatingGif}
                    countdownTime={countdownTime}
                    isMirrored={isMirrored}
                  />
                  <div className="capture-options">
                    <label className="mirror-toggle">
                      <input
                        type="checkbox"
                        checked={isMirrored}
                        onChange={(e) => setIsMirrored(e.target.checked)}
                      />
                      <span>Mirror Camera</span>
                    </label>
                    <label className="layout-label">Select Layout</label>
                    <select
                      value={layout}
                      onChange={(e) => {
                        const newLayout = parseInt(e.target.value);
                        if (capturedPhotos.length === 0) {
                          setLayout(newLayout);
                        }
                      }}
                      disabled={capturedPhotos.length > 0}
                      className="layout-select"
                    >
                      {layouts.map((layout) => (
                        <option key={layout.id} value={layout.id}>
                          {layout.name}
                        </option>
                      ))}
                    </select>
                    <label className="timer-toggle">
                      <input
                        type="checkbox"
                        checked={timerEnabled}
                        onChange={(e) => setTimerEnabled(e.target.checked)}
                      />
                      <span>Enable Timer Countdown</span>
                    </label>
                    {timerEnabled && (
                      <div className="countdown-setting">
                        <label className="layout-label">Countdown Time</label>
                        <select
                          value={countdownTime}
                          onChange={(e) => setCountdownTime(parseInt(e.target.value))}
                          className="layout-select"
                        >
                          {countdownOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="gif-preview">
                  <SequentialGif
                    ref={sequentialGifRef}
                    gifUrl={gifUrl}
                    isCreatingGif={isCreatingGif}
                    isMirrored={isMirrored}
                  />
                </div>
                {renderPreviewPhotos()}
                <button className="next-button" onClick={goToNextStep}>
                  Next →
                </button>
              </div>
            )}
            {step === 2 && (
              <div className="step-2">
                <h2 className="step-title">Edit Your Photo Strip</h2>
                <div className="edit-container">
                  <div className="edit-sidebar-left">
                    {renderPreviewPhotos()}
                    <div className="gif-preview">
                      <SequentialGif
                        ref={sequentialGifRef}
                        gifUrl={gifUrl}
                        isCreatingGif={isCreatingGif}
                        isMirrored={isMirrored}
                      />
                    </div>
                  </div>
                  <div className="edit-main">
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
                  <div className="edit-sidebar-right">
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
                  </div>
                </div>
                <button className="back-button" onClick={goToPreviousStep}>
                  ← Back
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="no-permission">Please allow camera access to use the photobooth</p>
        )}
      </div>
    </div>
  );
};

export default App;