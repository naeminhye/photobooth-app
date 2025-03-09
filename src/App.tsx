import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import PhotoStrip from "./components/PhotoStrip";
import FrameControls from "./components/FrameControls";
import CameraFeed from "./components/CameraFeed";
import SequentialGif from "./components/SequentialGif";
import PreviewPhotos from "./components/PreviewPhotos";
import { LAYOUTS, Photo } from "./constants";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useDropzone } from "react-dropzone";
import GradientBackground from "./components/GradientBackground";
import html2canvas from "html2canvas";


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
  const [countdownTime, setCountdownTime] = useState<number>(10);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [isCreatingGif, setIsCreatingGif] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [isMirrored, setIsMirrored] = useState<boolean>(true); // Default mirrored
  const photoStripRef: any = useRef<HTMLDivElement>(null);
  const sequentialGifRef = useRef<HTMLDivElement>(null);
  const [combinedImage, setCombinedImage] = useState<string | null>(null);

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
    setCombinedImage(null);
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handlePhotoUpload,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".svg", ".gif"] },
    multiple: true,
  });

  const goToNextStep = () => {
    if (step === 1 && previewPhotos.length > 0) {
      setStep(2);
    } else if (step === 2 && capturedPhotos.length > 0) {
      combineImageForStep3();
      setStep(3);
    } else {
      alert("Please capture or select at least one photo before proceeding.");
    }
  };

  // const goToPreviousStep = () => {
  //   if (step === 2) {
  //     setStep(1);
  //   } else if (step === 3) {
  //     setStep(2);
  //   }
  // };

  const combineImageForStep3 = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentLayout = LAYOUTS[layout];
    const stripWidth = currentLayout.width * 2;
    const stripHeight = currentLayout.height * 2;
    canvas.width = stripWidth;
    canvas.height = stripHeight;

    const drawPhotosAndForeground = () => {
      const PADDING_TOP = (currentLayout.paddings?.top || 0.15 * 96) * 2;
      const PADDING_LEFT = (currentLayout.paddings?.left || 0.15 * 96) * 2;
      const PADDING_BOTTOM = (currentLayout.paddings?.bottom || 0.15 * 96) * 2;
      const PADDING_RIGHT = (currentLayout.paddings?.right || 0.15 * 96) * 2;
      const GAP = (currentLayout.gap || 0.1 * 96) * 2;

      const photoWidth =
        currentLayout.arrangement === "vertical"
          ? stripWidth - PADDING_LEFT - PADDING_RIGHT
          : (stripWidth - PADDING_LEFT - PADDING_RIGHT - (currentLayout.maxPhotos - 1) * GAP) /
          currentLayout.maxPhotos;
      const photoHeight =
        currentLayout.arrangement === "vertical"
          ? (stripHeight - PADDING_TOP - PADDING_BOTTOM - (currentLayout.maxPhotos - 1) * GAP) /
          currentLayout.maxPhotos
          : stripHeight - PADDING_TOP - PADDING_BOTTOM;

      capturedPhotos.forEach((photo, index) => {
        const img = new Image();
        img.src = photo.url;
        img.onload = () => {
          const x =
            currentLayout.arrangement === "vertical"
              ? PADDING_LEFT
              : PADDING_LEFT + index * (photoWidth + GAP);
          const y =
            currentLayout.arrangement === "vertical"
              ? PADDING_TOP + index * (photoHeight + GAP)
              : PADDING_TOP;
          ctx.drawImage(img, x, y, photoWidth, photoHeight);

          if (index === capturedPhotos.length - 1 && foregroundImage) {
            const fgImg = new Image();
            fgImg.src = foregroundImage;
            fgImg.onload = () => {
              ctx.drawImage(fgImg, 0, 0, stripWidth, stripHeight);
              setCombinedImage(canvas.toDataURL("image/jpeg", 1.0));
            };
          } else if (index === capturedPhotos.length - 1) {
            setCombinedImage(canvas.toDataURL("image/jpeg", 1.0));
          }
        };
      });
    };

    if (backgroundImage) {
      const bgImg = new Image();
      bgImg.src = backgroundImage;
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, stripWidth, stripHeight);
        drawPhotosAndForeground();
      };
    } else {
      ctx.fillStyle = frameColor;
      ctx.fillRect(0, 0, stripWidth, stripHeight);
      drawPhotosAndForeground();
    }
  };

  const handleStickerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newStickers = files.map((file) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      return new Promise<HTMLImageElement>((resolve) => {
        img.onload = () => resolve(img);
      });
    });
    Promise.all(newStickers).then((images) =>
      setUploadedStickers((prev) => [...prev, ...images])
    );
  };

  const addStickerToCanvas = (stickerImg: HTMLImageElement) => {
    const aspectRatio = stickerImg.width / stickerImg.height;
    const defaultWidth = 100;
    const defaultHeight = defaultWidth / aspectRatio;

    const newSticker: Sticker = {
      id: Date.now(),
      image: stickerImg,
      x: LAYOUTS[layout].width / 2,
      y: LAYOUTS[layout].height / 2,
      width: defaultWidth,
      height: defaultHeight,
      rotation: 0,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

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
                    currentPhotos={previewPhotos.length}
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
                <PreviewPhotos
                  previewPhotos={previewPhotos}
                  selectedPreviewPhotos={selectedPreviewPhotos}
                  capturedPhotos={capturedPhotos}
                  getRootProps={getRootProps}
                  getInputProps={getInputProps}
                  isDragActive={isDragActive}
                  layout={layout}
                  setPreviewPhotos={setPreviewPhotos}
                  setCapturedPhotos={setCapturedPhotos}
                  setSelectedPreviewPhotos={setSelectedPreviewPhotos}
                  isViewOnly
                />
                <div className="step-navigation">
                  <button className="reset-button" onClick={resetAll}>
                    Reset All
                  </button>
                  <button className="next-button" onClick={goToNextStep}>
                    Next →
                  </button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="step-2">
                <h2 className="step-title">Edit Your Photo Strip</h2>
                <div className="edit-container">
                  <div className="edit-sidebar-left">
                    <PreviewPhotos
                      previewPhotos={previewPhotos}
                      selectedPreviewPhotos={selectedPreviewPhotos}
                      capturedPhotos={capturedPhotos}
                      getRootProps={getRootProps}
                      getInputProps={getInputProps}
                      isDragActive={isDragActive}
                      layout={layout}
                      setPreviewPhotos={setPreviewPhotos}
                      setCapturedPhotos={setCapturedPhotos}
                      setSelectedPreviewPhotos={setSelectedPreviewPhotos}
                    /></div>
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
                      stickers={[]}
                      setStickers={setStickers}
                      uploadedStickers={[]}
                      setUploadedStickers={() => { }}
                      timerEnabled={timerEnabled}
                      onTimerToggle={setTimerEnabled}
                    />
                  </div>
                </div>
                <div className="step-navigation">
                  {/* <button className="back-button" onClick={goToPreviousStep}>
                    ← Back
                  </button> */}
                  <button className="reset-button" onClick={resetAll}>
                    Reset All
                  </button>
                  <button className="next-button" onClick={goToNextStep}>
                    Next →
                  </button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="step-3">
                <h2 className="step-title">Add Stickers</h2>
                <div className="edit-container">
                  <div className="edit-main">
                    <PhotoStrip
                      ref={photoStripRef}
                      photos={combinedImage ? [{ id: "combined", url: combinedImage }] : []}
                      frameColor="#FFFFFF"
                      backgroundImage={null}
                      layout={layout}
                      foregroundImage={null}
                      stickers={stickers}
                      setStickers={setStickers}
                    />
                  </div>
                  <div className="edit-sidebar-right">
                    <div className="sticker-controls">
                      <label className="upload-button">
                        <FontAwesomeIcon icon={faPlus} /> Upload Stickers
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleStickerUpload}
                          className="sticker-upload-input"
                          hidden
                        />
                      </label>
                      <div className="sticker-preview">
                        {uploadedStickers.map((sticker, index) => (
                          <img
                            key={index}
                            src={sticker.src}
                            alt="Sticker"
                            className="sticker-item"
                            onClick={() => addStickerToCanvas(sticker)}
                          />
                        ))}
                      </div>
                    </div>
                    <SequentialGif
                      ref={sequentialGifRef}
                      gifUrl={gifUrl}
                      isCreatingGif={isCreatingGif}
                      isMirrored={isMirrored}
                    />
                  </div>
                </div>
                <div className="step-navigation">
                  {/* <button className="back-button" onClick={goToPreviousStep}>
                    ← Back
                  </button> */}
                  <button className="reset-button" onClick={resetAll}>
                    Reset All
                  </button>
                  <button className="download-button" onClick={downloadImage}>
                    Download
                  </button>
                </div>
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