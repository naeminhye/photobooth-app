import React, { useState, useEffect, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useDropzone } from "react-dropzone";

import GradientBackground from "@/components/GradientBackground";
import { Gradient } from "@/components/GradientPicker";
import CropModal from "@/components/CropModal";
import PhotoStrip from "@/components/PhotoStrip";
import FrameControls from "@/components/FrameControls";
import CameraFeed from "@/components/CameraFeed";
import SequentialVideo from "@/components/SequentialVideo";
import SequentialGif from "@/components/SequentialGif";
import PreviewPhotos from "@/components/PreviewPhotos";
import { LAYOUTS, MAX_PHOTOS, Sticker } from "@/constants";
import { getDeviceType } from "@/utils";
import { getContrastColor } from "@/utils/colors";

import "./App.css";

interface Photo {
  id: string;
  url: string;
}

type CaptureMode = "photostrip" | "gif" | "video"; // New type for modes

const layouts = LAYOUTS.map((layout, index) => ({
  id: index,
  ...layout,
}));

const App: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);
  const [previewPhotos, setPreviewPhotos] = useState<Photo[]>([]);
  const [frameColor, setFrameColor] = useState<string>("#FFFFFF");
  const [gradient, setGradientColor] = useState<Gradient | undefined>(
    undefined
  );
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [layout, setLayout] = useState<number>(0);
  const [foregroundImage, setForegroundImage] = useState<string | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [uploadedStickers, setUploadedStickers] = useState<HTMLImageElement[]>(
    []
  );
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [countdownTime, setCountdownTime] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string>("");
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("photostrip");
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [combinedImage, setCombinedImage] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<number | null>(
    null
  );
  const [filter, setFilter] = useState<string>("none");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempBackgroundImage, setTempBackgroundImage] = useState<string | null>(
    null
  );
  const stageRef = useRef<any>(null);
  const photoStripRef: any = useRef<HTMLDivElement>(null);
  const sequentialVideoRef = useRef<HTMLDivElement>(null);
  const sequentialGifRef = useRef<HTMLDivElement>(null);

  const currentLayout = useMemo(() => LAYOUTS[layout], [layout]);
  const maxPhotos = useMemo(
    () => currentLayout.rectangles.length,
    [currentLayout]
  );

  const textColor = useMemo(
    () =>
      backgroundImage || gradient ? "#FFFFFF" : getContrastColor(frameColor),
    [backgroundImage, frameColor, gradient]
  );

  const deviceType = getDeviceType();

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (!stream) throw new Error("No stream received.");
      setHasPermission(true);
    } catch (error) {
      console.error("Camera permission error:", error);
      setHasPermission(false);
    }
  };

  const resetAll = () => {
    setSelectedPhotos([]);
    setPreviewPhotos([]);
    setFrameColor("#FFFFFF");
    setGradientColor(undefined);
    setBackgroundImage(null);
    setForegroundImage(null);
    setLayout(0);
    setStickers([]);
    setUploadedStickers([]);
    setTimerEnabled(false);
    setCountdownTime(0);
    setVideoUrl(null);
    setVideoMimeType("");
    setIsRecordingVideo(false);
    setStep(1);
    setCaptureMode("photostrip");
    setIsMirrored(true);
    setCombinedImage(null);
    setLoading(false);
  };

  const handlePhotoCapture = (photo: string) => {
    if (previewPhotos.length >= MAX_PHOTOS) {
      alert(`Maximum preview photo limit (${MAX_PHOTOS}) reached.`);
      return;
    }
    const newPhoto: Photo = { id: uuidv4(), url: photo };
    setPreviewPhotos((prev) => [...prev, newPhoto]);
  };

  const handleVideoComplete = (videoUrl: string, mimeType: string) => {
    setVideoUrl(videoUrl);
    setVideoMimeType(mimeType);
  };

  const downloadVideo = () => {
    if (videoUrl) {
      const extension = videoMimeType.includes("gif")
        ? "gif"
        : videoMimeType.includes("mp4")
          ? "mp4"
          : "webm";
      const prefix = videoMimeType.includes("gif")
        ? "photobooth_gif"
        : "photobooth_video";
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `${prefix}_${Date.now()}.${extension}`;
      link.click();
    }
  };

  const handlePhotoUpload = (files: File[]) => {
    if (previewPhotos.length + files.length > MAX_PHOTOS) {
      alert(
        `Adding these photos would exceed the maximum preview photo limit (${MAX_PHOTOS}).`
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
      setStep(2); // Move to mode selection
    } else if (step === 2) {
      setStep(3); // Move to CameraFeed with mode set
    } else if (step === 3 && previewPhotos.length > 0) {
      setStep(4); // Edit photostrip
    } else if (step === 4 && selectedPhotos.length > 0) {
      handleMergeLayers();
      setStep(5); // Add stickers
    } else if (step === 5) {
      setStep(6); // Review and download
    } else {
      alert("Please capture or select at least one photo before proceeding.");
    }
  };

  const handleMergeLayers = async () => {
    setLoading(true); // Start loading
    console.log("handleMergeLayers called, loading set to true");

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      const stripWidth = currentLayout.canvas.width * 2;
      const stripHeight = currentLayout.canvas.height * 2;
      canvas.width = stripWidth;
      canvas.height = stripHeight;

      // Hàm vẽ background (nếu có)
      const drawBackground = () => {
        return new Promise<void>((resolve) => {
          if (!backgroundImage) {
            resolve();
            return;
          }
          const bgImg = new Image();
          bgImg.src = backgroundImage;
          bgImg.onload = () => {
            ctx.drawImage(bgImg, 0, 0, stripWidth, stripHeight);
            resolve();
          };
          bgImg.onerror = () => {
            console.error("Failed to load background image");
            resolve(); // Vẫn tiếp tục dù lỗi
          };
        });
      };

      // Hàm áp dụng gradient (nếu không có background)
      const applyGradient = () => {
        if (!gradient) {
          ctx.fillStyle = frameColor;
          ctx.fillRect(0, 0, stripWidth, stripHeight);
          return;
        }

        if (gradient.fillLinearGradientColorStops) {
          const linearGradient = ctx.createLinearGradient(
            gradient.fillLinearGradientStartPoint?.x || 0,
            gradient.fillLinearGradientStartPoint?.y || 0,
            gradient.fillLinearGradientEndPoint?.x || stripWidth,
            gradient.fillLinearGradientEndPoint?.y || stripHeight
          );

          for (
            let i = 0;
            i < gradient.fillLinearGradientColorStops.length;
            i += 2
          ) {
            const position = gradient.fillLinearGradientColorStops[i] as number;
            const color = gradient.fillLinearGradientColorStops[
              i + 1
            ] as string;
            linearGradient.addColorStop(position, color);
          }

          ctx.fillStyle = linearGradient;
          ctx.fillRect(0, 0, stripWidth, stripHeight);
        } else if (gradient.fillRadialGradientColorStops) {
          const radialGradient = ctx.createRadialGradient(
            gradient.fillRadialGradientStartPoint?.x || stripWidth / 2,
            gradient.fillRadialGradientStartPoint?.y || stripHeight / 2,
            gradient.fillRadialGradientStartRadius || 0,
            gradient.fillRadialGradientEndPoint?.x || stripWidth / 2,
            gradient.fillRadialGradientEndPoint?.y || stripHeight / 2,
            gradient.fillRadialGradientEndRadius ||
            Math.max(stripWidth, stripHeight) / 2
          );

          for (
            let i = 0;
            i < gradient.fillRadialGradientColorStops.length;
            i += 2
          ) {
            const position = gradient.fillRadialGradientColorStops[i] as number;
            const color = gradient.fillRadialGradientColorStops[
              i + 1
            ] as string;
            radialGradient.addColorStop(position, color);
          }

          ctx.fillStyle = radialGradient;
          ctx.fillRect(0, 0, stripWidth, stripHeight);
        }
      };

      // Hàm vẽ photos
      const drawPhotos = () => {
        const rectangles = currentLayout.rectangles.map((rect) => ({
          x: rect.x * 2,
          y: rect.y * 2,
          width: rect.width * 2,
          height: rect.height * 2,
        }));

        const promises = selectedPhotos.map((photo, index) => {
          if (index >= rectangles.length) return Promise.resolve();
          const rect = rectangles[index];
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = photo.url;
          return new Promise<void>((resolve, reject) => {
            img.onload = () => {
              const cropImageToRectangle = (
                image: HTMLImageElement,
                rect: { width: number; height: number }
              ) => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                  reject(
                    new Error("Failed to get canvas context for cropping")
                  );
                  return image;
                }

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
                ctx.drawImage(
                  croppedImg,
                  rect.x,
                  rect.y,
                  rect.width,
                  rect.height
                );
                resolve();
              };
              croppedImg.onerror = () => {
                console.error("Failed to load cropped image");
                reject(new Error("Failed to load cropped image"));
              };
            };
            img.onerror = () => {
              console.error("Failed to load photo image");
              reject(new Error("Failed to load photo image"));
            };
          });
        });

        return Promise.all(promises);
      };

      // Hàm vẽ foreground (nếu có)
      const drawForeground = () => {
        return new Promise<void>((resolve) => {
          if (!foregroundImage) {
            resolve();
            return;
          }
          const fgImg = new Image();
          fgImg.src = foregroundImage;
          fgImg.onload = () => {
            ctx.drawImage(fgImg, 0, 0, stripWidth, stripHeight);
            resolve();
          };
          fgImg.onerror = () => {
            console.error("Failed to load foreground image");
            resolve(); // Vẫn tiếp tục dù lỗi
          };
        });
      };

      // Quy trình vẽ chính
      // 1. Vẽ background hoặc gradient
      if (backgroundImage) {
        await drawBackground();
      } else {
        applyGradient();
      }

      // 2. Vẽ photos
      await drawPhotos();

      // 3. Vẽ foreground
      await drawForeground();

      // 4. Lưu kết quả và tắt loading
      setCombinedImage(canvas.toDataURL("image/jpeg", 1.0));
      setLoading(false); // Chỉ tắt loading khi tất cả đã hoàn tất
      console.log("handleMergeLayers completed, loading set to false");
    } catch (error) {
      console.error("Error in handleMergeLayers:", error);
      setLoading(false);
    }
  };

  const addWhiteBorder = (img: HTMLImageElement, borderSize = 12): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const w = img.width + borderSize * 2;
      const h = img.height + borderSize * 2;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Draw the image at 24 circular offsets to build an opaque outline
      const steps = 24;
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        ctx.drawImage(
          img,
          Math.round(borderSize + Math.cos(angle) * borderSize),
          Math.round(borderSize + Math.sin(angle) * borderSize)
        );
      }

      // Fill all touched pixels with white
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, w, h);

      // Draw original image centered on top
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(img, borderSize, borderSize);

      const result = new Image();
      result.onload = () => resolve(result);
      result.src = canvas.toDataURL("image/png");
    });
  };

  const handleStickerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newStickers = files.map((file) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      return new Promise<HTMLImageElement>((resolve) => {
        img.onload = () => addWhiteBorder(img).then(resolve);
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
    const stage = stageRef.current;
    if (stage) {
      const highQualityPixelRatio = 4;
      const dataUrl = stage.toDataURL({
        pixelRatio: highQualityPixelRatio,
        mimeType: "image/png",
        quality: 1.0,
      });

      const link = document.createElement("a");
      link.download = `photobooth_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleOuterClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      photoStripRef.current &&
      !photoStripRef.current.contains(e.target as Node)
    ) {
      setSelectedStickerId(null);
    }
  };

  const handleOuterTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (
      photoStripRef.current &&
      !photoStripRef.current.contains(e.target as Node)
    ) {
      setSelectedStickerId(null);
    }
  };

  const handleTimeChange = (timer: number) => {
    setTimerEnabled(timer > 0);
    setCountdownTime(timer);
  };

  const handleFilterChange = (filterValue: string) => {
    setFilter(filterValue);
  };

  const handleBackgroundChange = (file: File | null) => {
    if (!file) {
      setBackgroundImage(null);
      return;
    }
    setFrameColor("#FFFFFF");
    setGradientColor(undefined);
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempBackgroundImage(e.target?.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (croppedImage: HTMLImageElement) => {
    setBackgroundImage(croppedImage.src);
    setIsCropModalOpen(false);
    setTempBackgroundImage(null);
  };

  const handleCropCancel = () => {
    setIsCropModalOpen(false);
    setTempBackgroundImage(null);
  };

  const STEP_LABELS = ["Layout", "Mode", "Capture", "Edit", "Stickers", "Download"];

  return (
    <div
      className="app"
      onMouseDown={handleOuterClick}
      onTouchStart={handleOuterTouch}
    >
      <GradientBackground />
      <div className="app-header">
        <div className="app-header-inner">
          <span className="app-logo">&#9632;</span>
          <span className="app-title">Photobooth</span>
        </div>
      </div>
      <div className="main-container">
        {hasPermission ? (
          <div className="app-content">
            <nav className="step-progress" aria-label="Steps">
              {STEP_LABELS.map((label, i) => {
                const s = i + 1;
                const state = s < step ? "done" : s === step ? "active" : "pending";
                return (
                  <React.Fragment key={s}>
                    <div className={`step-node step-node--${state}`}>
                      <div className="step-node-dot">{s < step ? "✓" : s}</div>
                      <span className="step-node-label">{label}</span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <div className={`step-connector ${s < step ? "step-connector--done" : ""}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
            {step === 1 && (
              <div className="step-1">
                <h2 className="step-title">Select Your Layout</h2>
                <div className="layout-toggle">
                  {layouts.map((layoutItem) => (
                    <div
                      key={layoutItem.id}
                      className={`layout-option ${layoutItem.id === layout ? "active" : ""
                        }`}
                      onClick={() => setLayout(layoutItem.id)}
                    >
                      <img
                        src={layoutItem.templatePath}
                        alt={layoutItem.name}
                      />
                      <p>{layoutItem.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="step-2">
                <h2 className="step-title">Choose Capture Mode</h2>
                <div className="mode-toggle">
                  <div
                    className={`mode-option ${captureMode === "photostrip" ? "active" : ""
                      }`}
                    onClick={() => setCaptureMode("photostrip")}
                  >
                    <p>Photostrip Only</p>
                  </div>
                  <div
                    className={`mode-option ${captureMode === "gif" ? "active" : ""
                      }`}
                    onClick={() => setCaptureMode("gif")}
                  >
                    <p>Photostrip with GIF</p>
                  </div>
                  <div
                    className={`mode-option ${captureMode === "video" ? "active" : ""
                      }`}
                    onClick={() => setCaptureMode("video")}
                  >
                    <p>Photostrip with Video</p>
                  </div>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="step-3">
                <h2 className="step-title">Capture Your Moments</h2>
                <div className="edit-container">
                  <div className="edit-main">
                    <div className="capture-container">
                      <CameraFeed
                        onCapture={handlePhotoCapture}
                        onVideoComplete={
                          captureMode === "video" || captureMode === "gif"
                            ? handleVideoComplete
                            : undefined
                        }
                        layout={layout}
                        maxPhotos={maxPhotos}
                        currentPhotos={previewPhotos.length}
                        timerEnabled={timerEnabled}
                        setIsRecordingVideo={setIsRecordingVideo}
                        countdownTime={countdownTime}
                        isMirrored={isMirrored}
                        onTimerChange={handleTimeChange}
                        onMirrorToggle={setIsMirrored}
                        captureMode={captureMode}
                      />
                    </div>
                  </div>
                  <div className="edit-sidebar-right">
                    <PreviewPhotos
                      previewPhotos={previewPhotos}
                      selectedPhotos={selectedPhotos}
                      getRootProps={getRootProps}
                      getInputProps={getInputProps}
                      isDragActive={isDragActive}
                      layout={layout}
                      setPreviewPhotos={setPreviewPhotos}
                      setSelectedPhotos={setSelectedPhotos}
                      isViewOnly
                    />
                  </div>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="step-4">
                <h2 className="step-title">Edit Your Photo Strip</h2>
                <div className="edit-container">
                  <div className="edit-main">
                    <PhotoStrip
                      ref={photoStripRef}
                      loading={loading}
                      setLoading={setLoading}
                      isViewOnly={false}
                      photos={selectedPhotos}
                      frameColor={frameColor}
                      gradient={gradient}
                      textColor={textColor}
                      backgroundImage={backgroundImage}
                      layout={layout}
                      foregroundImage={foregroundImage}
                      stickers={stickers}
                      setStickers={setStickers}
                      selectedStickerId={selectedStickerId}
                      setSelectedStickerId={setSelectedStickerId}
                      stageRef={stageRef}
                      filter={filter}
                    />
                  </div>
                  <div className="edit-sidebar-right">
                    <PreviewPhotos
                      previewPhotos={previewPhotos}
                      selectedPhotos={selectedPhotos}
                      getRootProps={getRootProps}
                      getInputProps={getInputProps}
                      isDragActive={isDragActive}
                      layout={layout}
                      setPreviewPhotos={setPreviewPhotos}
                      setSelectedPhotos={setSelectedPhotos}
                    />
                    <FrameControls
                      onColorChange={setFrameColor}
                      onBackgroundChange={handleBackgroundChange}
                      onForegroundChange={setForegroundImage}
                      backgroundImage={backgroundImage}
                      foregroundImage={foregroundImage}
                      layout={layout}
                      onLayoutChange={setLayout}
                      frameColor={frameColor}
                      onFilterChange={handleFilterChange}
                      frameGradient={gradient}
                      onSelectFrameGradient={setGradientColor}
                    />
                  </div>
                </div>
              </div>
            )}
            {step === 5 && (
              <div className="step-5">
                <h2 className="step-title">Add Stickers</h2>
                <div className="edit-container">
                  <div className="edit-main">
                    <PhotoStrip
                      ref={photoStripRef}
                      loading={loading}
                      setLoading={setLoading}
                      isViewOnly={false}
                      photos={
                        combinedImage
                          ? [{ id: "combined", url: combinedImage }]
                          : []
                      }
                      frameColor={frameColor}
                      gradient={gradient}
                      textColor={textColor}
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
                      {!!uploadedStickers?.length && (
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
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {step === 6 && (
              <div className="step-6">
                <h2 className="step-title">Review and Download</h2>
                <div className="edit-container">
                  <div className="edit-main">
                    <PhotoStrip
                      ref={photoStripRef}
                      loading={loading}
                      setLoading={setLoading}
                      isViewOnly={!!combinedImage}
                      photos={
                        combinedImage
                          ? [{ id: "combined", url: combinedImage }]
                          : []
                      }
                      frameColor={frameColor}
                      gradient={gradient}
                      textColor={textColor}
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
                  {videoUrl && (
                    <div className="edit-sidebar-right">
                      {captureMode === "gif" ? (
                        <SequentialGif
                          ref={sequentialGifRef}
                          gifUrl={videoUrl}
                          isRecordingGif={isRecordingVideo}
                        />
                      ) : captureMode === "video" ? (
                        <SequentialVideo
                          ref={sequentialVideoRef}
                          videoUrl={videoUrl}
                          isRecordingVideo={isRecordingVideo}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="step-navigation">
              {step > 1 && <button className="cta-button danger" onClick={resetAll}>
                Reset All
              </button>}
              {step < 6 && <button className="cta-button" onClick={goToNextStep}>
                Next →
              </button>}
              {step === 6 && <>
                <button className="cta-button" onClick={downloadImage}>
                  Download Image
                </button>
                {captureMode === "video" && videoUrl && (
                  <button className="cta-button" onClick={downloadVideo}>
                    Download Video
                  </button>
                )}
                {captureMode === "gif" && videoUrl && (
                  <button className="cta-button" onClick={downloadVideo}>
                    Download GIF
                  </button>
                )}
              </>}
            </div>
          </div>
        ) : (
          <p className="no-permission">
            Please allow camera access to use the photobooth. Ensure you’re
            accessing this site over HTTPS and have granted camera permissions
            in your browser settings.
          </p>
        )}
        {isCropModalOpen && tempBackgroundImage && (
          <CropModal
            imageUrl={tempBackgroundImage}
            layoutWidth={currentLayout.canvas.width}
            layoutHeight={currentLayout.canvas.height}
            onConfirm={handleCropConfirm}
            onCancel={handleCropCancel}
          />
        )}
      </div>
      <div className="device-info-text">{deviceType}</div>
    </div>
  );
};

export default App;
