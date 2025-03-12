// src\App.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import "./App.css";
import PhotoStrip from "./components/PhotoStrip";
import FrameControls from "./components/FrameControls";
import CameraFeed from "./components/CameraFeed";
import SequentialGif from "./components/SequentialGif";
import PreviewPhotos from "./components/PreviewPhotos";
import { NEW_LAYOUT, CanvasData, MAX_PHOTOS } from "./constants";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useDropzone } from "react-dropzone";
import GradientBackground from "./components/GradientBackground";
import html2canvas from "html2canvas";

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
  const [layout, setLayout] = useState<number>(0);
  const [selectedPreviewPhotos, setSelectedPreviewPhotos] = useState<string[]>(
    []
  );
  const [foregroundImage, setForegroundImage] = useState<string | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [uploadedStickers, setUploadedStickers] = useState<HTMLImageElement[]>(
    []
  );
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number>(0);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [isCreatingGif, setIsCreatingGif] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const photoStripRef: any = useRef(null);
  const sequentialGifRef = useRef<HTMLDivElement>(null);
  const [combinedImage, setCombinedImage] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<number | null>(
    null
  );
  const stageRef = useRef<any>(null);

  const currentLayout = useMemo(() => NEW_LAYOUT[layout], [layout]);
  const maxPhotos = currentLayout.rectangles.length;

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
    setLayout(0);
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
    if (previewPhotos.length >= MAX_PHOTOS) {
      alert(`Maximum preview photo limit (${MAX_PHOTOS}) reached.`);
      return;
    }
    const newPhoto: Photo = { id: uuidv4(), url: photo };
    setPreviewPhotos((prev) => [...prev, newPhoto]);
  };

  const handleGifComplete = (gifUrl: string) => {
    setGifUrl(gifUrl);
  };

  const handlePhotoUpload = (files: File[]) => {
    if (previewPhotos.length + files.length > maxPhotos) {
      alert(
        `Adding these photos would exceed the maximum preview photo limit (${maxPhotos}).`
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handlePhotoUpload,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".svg", ".gif"] },
    multiple: true,
  });

  const goToNextStep = () => {
    if (step === 1) {
      setStep(2); // Từ Select Layout sang Capture
    } else if (step === 2 && previewPhotos.length > 0) {
      setStep(3); // Từ Capture sang Edit
    } else if (step === 3 && capturedPhotos.length > 0) {
      handleMergeLayers();
      setStep(4); // Từ Edit sang Add Stickers
    } else if (step === 4) {
      setStep(5); // Từ Add Stickers sang Review and Download
    } else {
      alert("Please capture or select at least one photo before proceeding.");
    }
  };

  const handleMergeLayers = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stripWidth = currentLayout.canvas.width * 2;
    const stripHeight = currentLayout.canvas.height * 2;
    canvas.width = stripWidth;
    canvas.height = stripHeight;

    const drawPhotosAndForeground = () => {
      const rectangles = currentLayout.rectangles.map((rect) => ({
        x: rect.x * 2,
        y: rect.y * 2,
        width: rect.width * 2,
        height: rect.height * 2,
      }));

      capturedPhotos.forEach((photo, index) => {
        if (index >= rectangles.length) return;
        const rect = rectangles[index];
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = photo.url;
        img.onload = () => {
          const cropImageToRectangle = (
            image: HTMLImageElement,
            rect: { width: number; height: number }
          ) => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return image;

            const imgWidth = image.width;
            const imgHeight = image.height;
            const rectWidth = rect.width;
            const rectHeight = rect.height;

            const rectRatio = rectWidth / rectHeight;
            const imgRatio = imgWidth / imgHeight;

            let cropWidth, cropHeight, cropX, cropY;

            if (imgRatio > rectRatio) {
              cropWidth = imgHeight * rectRatio;
              cropHeight = imgHeight;
              cropX = (imgWidth - cropWidth) / 2;
              cropY = 0;
            } else {
              cropHeight = imgWidth / rectRatio;
              cropWidth = imgWidth;
              cropX = 0;
              cropY = (imgHeight - cropHeight) / 2;
            }

            canvas.width = rectWidth;
            canvas.height = rectHeight;
            ctx.drawImage(
              image,
              cropX,
              cropY,
              cropWidth,
              cropHeight,
              0,
              0,
              rectWidth,
              rectHeight
            );

            const croppedImage = new Image();
            croppedImage.src = canvas.toDataURL("image/png");
            return croppedImage;
          };

          const croppedImg = cropImageToRectangle(img, rect);
          croppedImg.onload = () => {
            ctx.drawImage(croppedImg, rect.x, rect.y, rect.width, rect.height);

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
    const defaultWidth = 300;
    const defaultHeight = defaultWidth / aspectRatio;

    const newSticker: Sticker = {
      id: Date.now(),
      image: stickerImg,
      x: currentLayout.canvas.width / 2,
      y: currentLayout.canvas.height / 2,
      width: defaultWidth,
      height: defaultHeight,
      rotation: 0,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const downloadImage = () => {
    const photoStrip = photoStripRef.current;
    if (photoStrip) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = currentLayout.canvas.width;
      canvas.height = currentLayout.canvas.height;

      const stage = stageRef.current;
      if (stage) {
        const dataUrl = stage.toDataURL({
          pixelRatio: 3.5,
        });

        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const link = document.createElement("a");
          link.download = `photobooth_${Date.now()}.jpg`;
          link.href = canvas.toDataURL("image/jpeg", 1.0);
          link.click();
        };
      }
    }
  };

  const layouts = useMemo(() => {
    return NEW_LAYOUT.map((layout, index) => ({
      id: index,
      name: layout.name,
      maxPhotos: layout.rectangles.length,
      templatePath: layout.templatePath,
    }));
  }, [NEW_LAYOUT]);

  const handleOuterClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      photoStripRef.current &&
      !photoStripRef.current.contains(e.target as Node)
    ) {
      setSelectedStickerId(null);
      console.log("Clicked outside PhotoStrip");
    }
  };

  const handleOuterTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (
      photoStripRef.current &&
      !photoStripRef.current.contains(e.target as Node)
    ) {
      setSelectedStickerId(null);
      console.log("Touched outside PhotoStrip");
    }
  };

  const handleTimeChange = (timer: number) => {
    setTimerEnabled(timer > 0);
    setCountdownTime(timer);
  };

  return (
    <div
      className="app"
      onMouseDown={handleOuterClick}
      onTouchStart={handleOuterTouch}
    >
      <GradientBackground />
      <div className="main-container">
        {hasPermission ? (
          <div className="app-content">
            {step === 1 && (
              <div className="step-1">
                <h2 className="step-title">Select Your Layout</h2>
                <div className="layout-toggle">
                  {layouts.map((layoutItem) => (
                    <div
                      key={layoutItem.id}
                      className={`layout-option ${
                        layoutItem.id === layout ? "active" : ""
                      }`}
                      onClick={() => setLayout(layoutItem.id)}
                    >
                      <img
                        src={layoutItem.templatePath}
                        alt={layoutItem.name}
                        style={{
                          width: "100px",
                          height: "auto",
                          cursor: "pointer",
                        }}
                      />
                      <p>{layoutItem.name}</p>
                    </div>
                  ))}
                </div>
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
                <h2 className="step-title">Capture Your Moments</h2>
                <div className="capture-container">
                  <CameraFeed
                    onCapture={handlePhotoCapture}
                    onGifComplete={handleGifComplete}
                    layout={layout}
                    maxPhotos={maxPhotos}
                    currentPhotos={previewPhotos.length}
                    timerEnabled={timerEnabled}
                    setIsCreatingGif={setIsCreatingGif}
                    countdownTime={countdownTime}
                    isMirrored={isMirrored}
                    onTimerChange={handleTimeChange}
                    onMirrorToggle={setIsMirrored}
                  />
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
            {step === 3 && (
              <div className="step-3">
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
                    />
                  </div>
                  <div className="edit-main">
                    <PhotoStrip
                      ref={photoStripRef}
                      isViewOnly={false}
                      photos={capturedPhotos}
                      frameColor={frameColor}
                      backgroundImage={backgroundImage}
                      layout={layout}
                      foregroundImage={foregroundImage}
                      stickers={stickers}
                      setStickers={setStickers}
                      selectedStickerId={selectedStickerId}
                      setSelectedStickerId={setSelectedStickerId}
                      stageRef={stageRef}
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
                    />
                  </div>
                </div>
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
            {step === 4 && (
              <div className="step-4">
                <h2 className="step-title">Add Stickers</h2>
                <div className="edit-container">
                  <div className="edit-main">
                    <PhotoStrip
                      ref={photoStripRef}
                      isViewOnly={false}
                      photos={
                        combinedImage
                          ? [{ id: "combined", url: combinedImage }]
                          : []
                      }
                      frameColor="#FFFFFF"
                      backgroundImage={null}
                      layout={layout}
                      foregroundImage={null}
                      stickers={stickers}
                      setStickers={setStickers}
                      selectedStickerId={selectedStickerId}
                      setSelectedStickerId={setSelectedStickerId}
                      stageRef={stageRef}
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
                  </div>
                </div>
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
            {step === 5 && (
              <div className="step-5">
                <h2 className="step-title">Review and Download</h2>
                <div className="edit-container">
                  <div className="edit-main">
                    <PhotoStrip
                      ref={photoStripRef}
                      isViewOnly={!!combinedImage}
                      photos={
                        combinedImage
                          ? [{ id: "combined", url: combinedImage }]
                          : []
                      }
                      frameColor="#FFFFFF"
                      backgroundImage={null}
                      layout={layout}
                      foregroundImage={null}
                      stickers={stickers}
                      setStickers={setStickers}
                      selectedStickerId={selectedStickerId}
                      setSelectedStickerId={setSelectedStickerId}
                      stageRef={stageRef}
                    />
                  </div>
                  <div className="edit-sidebar-right">
                    <SequentialGif
                      ref={sequentialGifRef}
                      gifUrl={gifUrl}
                      isCreatingGif={isCreatingGif}
                      isMirrored={isMirrored}
                    />
                  </div>
                </div>
                <div className="step-navigation">
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
          <p className="no-permission">
            Please allow camera access to use the photobooth
          </p>
        )}
      </div>
    </div>
  );
};

export default App;
