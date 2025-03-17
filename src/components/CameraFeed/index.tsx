import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import GIF from "gif.js";
import { CAMERA_HEIGHT, CAMERA_WIDTH, MAX_PHOTOS } from "../../constants";

// Icons
import flipIcon from "../../assets/icons/flip.png";
import timerOffFill from "../../assets/icons/timer_off_fill.png";
import timerOffOutline from "../../assets/icons/timer_off_outline.png";
import timer2Fill from "../../assets/icons/timer_2_fill.png";
import timer2Outline from "../../assets/icons/timer_2_outline.png";
import timer5Fill from "../../assets/icons/timer_5_fill.png";
import timer5Outline from "../../assets/icons/timer_5_outline.png";
import timer10Fill from "../../assets/icons/timer_10_fill.png";
import timer10Outline from "../../assets/icons/timer_10_outline.png";

import "./styles.css";
import { getDeviceType } from "../../utils";

interface CameraFeedProps {
  onCapture: (photo: string) => void;
  onGifComplete: (gifUrl: string) => void;
  layout: number;
  maxPhotos: number;
  currentPhotos: number;
  timerEnabled: boolean;
  setIsCreatingGif: (isCreating: boolean) => void;
  countdownTime: number;
  isMirrored: boolean;
  onTimerChange: (time: number) => void;
  onMirrorToggle: (isMirrored: boolean) => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({
  onCapture,
  onGifComplete,
  layout,
  maxPhotos,
  currentPhotos,
  timerEnabled,
  setIsCreatingGif,
  countdownTime,
  isMirrored,
  onTimerChange,
  onMirrorToggle,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureButtonRef = useRef<HTMLButtonElement>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const gifFrames = useRef<ImageData[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const countdownRef = useRef<number>(countdownTime);
  const maxPhotosRef = useRef<number>(maxPhotos);
  const [cameraDimensions, setCameraDimensions] = useState({
    width: CAMERA_WIDTH,
    height: CAMERA_HEIGHT,
  });
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    isMirrored ? "user" : "environment"
  );

  const deviceType = getDeviceType();
  const isMobile =
    deviceType.includes("Mobile") ||
    deviceType.includes("iOS") ||
    deviceType.includes("Android");

  // Update countdownRef when countdownTime changes
  useEffect(() => {
    countdownRef.current = countdownTime;
  }, [countdownTime]);

  // Update maxPhotosRef when maxPhotos changes
  useEffect(() => {
    maxPhotosRef.current = maxPhotos;
  }, [maxPhotos]);

  // Responsive camera dimensions based on breakpoints
  useEffect(() => {
    const updateCameraDimensions = () => {
      const viewportWidth = window.innerWidth;
      const isPortrait = window.innerHeight > window.innerWidth || isMobile;
      const aspectRatio = isPortrait ? 4 / 3 : 3 / 4; // Portrait: 4:3, Landscape: 3:4

      let baseWidth: number;

      // Breakpoints
      if (viewportWidth <= 320) {
        baseWidth = 280; // Fit within small screens
      } else if (viewportWidth <= 425) {
        baseWidth = 380; // Medium mobile
      } else if (viewportWidth <= 768) {
        baseWidth = 480; // Tablet
      } else {
        baseWidth = 640; // Default for larger screens
      }

      // Ensure width doesn’t exceed viewport width
      baseWidth = Math.min(baseWidth, viewportWidth * 0.9); // 90% of viewport width
      const baseHeight = baseWidth * aspectRatio;

      // Ensure height fits within viewport if needed
      const maxHeight = window.innerHeight * 0.7; // Reserve space for controls
      const finalHeight = Math.min(baseHeight, maxHeight);
      const finalWidth = finalHeight / aspectRatio;

      setCameraDimensions({
        width: Math.round(finalWidth),
        height: Math.round(finalHeight),
      });
    };

    updateCameraDimensions(); // Initial call
    window.addEventListener("resize", updateCameraDimensions);
    window.addEventListener("orientationchange", updateCameraDimensions);

    return () => {
      window.removeEventListener("resize", updateCameraDimensions);
      window.removeEventListener("orientationchange", updateCameraDimensions);
    };
  }, [isMobile]);

  const handleCameraError = (error: string | Error) => {
    console.error("Camera error:", error);
    setCameraError(
      "Unable to access the camera. Please ensure your device has a camera, grant permission, and access this site over HTTPS."
    );
  };

  const capturePhoto = useCallback(() => {
    if (
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      console.log("[DEV] Attempting to capture screenshot...");
      const photo = webcamRef.current.getScreenshot({
        width: webcamRef.current.video.videoWidth || cameraDimensions.width,
        height: webcamRef.current.video.videoHeight || cameraDimensions.height,
      });
      if (photo) {
        console.log("[DEV] Screenshot captured successfully.");
        onCapture(photo);
      } else {
        console.error(
          "Failed to capture screenshot. Video stream or resolution issue?"
        );
        setCameraError(
          "Failed to capture photo. The video stream may not be ready or the resolution is unsupported."
        );
      }
    } else {
      console.error(
        "Video stream not ready. Ready state:",
        webcamRef.current?.video?.readyState
      );
      setCameraError(
        "Failed to capture photo. The video stream is not ready. Please wait a moment and try again."
      );
    }
  }, [onCapture, cameraDimensions]);

  const captureFrame = () => {
    if (webcamRef.current && canvasRef.current && webcamRef.current.video) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = cameraDimensions.width;
        canvas.height = cameraDimensions.height;
        context.drawImage(
          webcamRef.current.video,
          0,
          0,
          cameraDimensions.width,
          cameraDimensions.height
        );
        const frame = context.getImageData(
          0,
          0,
          cameraDimensions.width,
          cameraDimensions.height
        );
        console.log("[DEV] Captured frame:", frame);
        return frame;
      }
    }
    console.error(
      "Failed to capture frame. Canvas or video context unavailable."
    );
    return null;
  };

  const createGif = () => {
    if (!gifFrames.current?.length) {
      console.error("No frames to create GIF");
      setIsCapturing(false);
      setIsCreatingGif(false);
      return;
    }

    setIsCreatingGif(true);

    try {
      const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: process.env.PUBLIC_URL + "/gif.worker.js",
        width: cameraDimensions.width,
        height: cameraDimensions.height,
      });

      gifFrames.current.forEach((frame) => gif.addFrame(frame, { delay: 150 }));

      gif.on("finished", (blob) => {
        const gifUrl = URL.createObjectURL(blob);
        onGifComplete(gifUrl);
        gifFrames.current = [];
        setIsCapturing(false);
        setIsCreatingGif(false);
      });

      gif.render();
    } catch (error) {
      console.error("GIF initialization error:", error);
      setCameraError("Failed to initialize GIF creation. Please try again.");
      setIsCapturing(false);
      setIsCreatingGif(false);
    }
  };

  const runCountdown = async () => {
    for (let i = 0; i < maxPhotosRef.current; i++) {
      if (!webcamRef.current || !countdownRef.current) break;

      for (let sec = countdownRef.current; sec > 0; sec--) {
        setCountdown(sec);
        const frame = captureFrame();
        if (frame) {
          gifFrames.current.push(frame);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      capturePhoto();
    }

    setCountdown(null);
    createGif();
  };

  const startCountdown = useCallback(() => {
    if (currentPhotos >= MAX_PHOTOS) {
      setCameraError(`Maximum preview photo limit (${MAX_PHOTOS}) reached.`);
      return;
    }

    if (currentPhotos >= (timerEnabled ? maxPhotos + 4 : 10) || isCapturing)
      return;
    setIsCapturing(true);

    gifFrames.current = [];
    runCountdown();
  }, [currentPhotos, timerEnabled, maxPhotos, isCapturing, capturePhoto]);

  const handleMouseDown = () => {
    if (currentPhotos < (timerEnabled ? maxPhotos + 4 : 10) && !isCapturing) {
      setIsHolding(true);
    }
  };

  const handleMouseUp = () => {
    if (
      isHolding &&
      currentPhotos < (timerEnabled ? maxPhotos + 4 : 10) &&
      !isCapturing
    ) {
      setIsHolding(false);
      if (timerEnabled) {
        startCountdown();
      } else {
        capturePhoto();
      }
    }
  };

  const handleMouseLeave = () => {
    if (isHolding) {
      setIsHolding(false);
    }
  };

  const handleTouchStart = () => {
    if (currentPhotos < (timerEnabled ? maxPhotos + 4 : 10) && !isCapturing) {
      setIsHolding(true);
    }
  };

  const handleTouchEnd = () => {
    if (
      isHolding &&
      currentPhotos < (timerEnabled ? maxPhotos + 4 : 10) &&
      !isCapturing
    ) {
      setIsHolding(false);
      if (timerEnabled) {
        startCountdown();
      } else {
        capturePhoto();
      }
    }
  };

  const handleTouchCancel = () => {
    if (isHolding) {
      setIsHolding(false);
    }
  };

  const handleTimerChange = (time: number) => {
    onTimerChange(time);
  };

  const handleMirrorToggle = () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    onMirrorToggle(newFacingMode === "user");
  };

  useEffect(() => {
    const checkVideoDimensions = () => {
      if (webcamRef.current && webcamRef.current.video) {
        console.log("[DEV] Video dimensions:", {
          width: webcamRef.current.video.videoWidth,
          height: webcamRef.current.video.videoHeight,
        });
      }
    };
    const interval = setInterval(checkVideoDimensions, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="camera-feed"
      style={{
        width: `${cameraDimensions.width}px`,
        height: `${cameraDimensions.height}px`,
        maxWidth: "100%", // Ensure it fits within parent container
        margin: "0 auto", // Center horizontally
      }}
    >
      {cameraError ? (
        <div
          style={{
            color: "red",
            padding: "20px",
            textAlign: "center",
            fontSize: "16px",
          }}
        >
          {cameraError}
        </div>
      ) : (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            imageSmoothing
            disablePictureInPicture
            screenshotFormat="image/jpeg"
            screenshotQuality={1}
            width={cameraDimensions.width}
            height={cameraDimensions.height}
            mirrored={facingMode === "user"}
            videoConstraints={{
              width: { ideal: 1280, max: 1920, min: 280 },
              height: { ideal: 720, max: 1440, min: 373 }, // Adjusted min for 280 * 4/3
              facingMode,
              frameRate: { ideal: 30, max: 60 },
            }}
            onUserMediaError={handleCameraError}
            playsInline
            style={{ objectFit: "cover" }} // Ensure video fills the container
          />
          {countdown !== null && (
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                color: "white",
                fontSize: "40px",
                fontWeight: "bold",
                padding: "5px 10px",
              }}
            >
              {countdown}
            </div>
          )}

          {/* Control Panel */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              display: "flex",
              gap: "10px",
              zIndex: 10,
            }}
          >
            {/* Timer Controls */}
            <div className="camera-control">
              <button
                onClick={() => handleTimerChange(0)}
                className="camera-control-button"
              >
                <img
                  src={countdownTime === 0 ? timerOffFill : timerOffOutline}
                  alt="Off"
                />
              </button>
              <button
                onClick={() => handleTimerChange(2)}
                className="camera-control-button"
              >
                <img
                  src={countdownTime === 2 ? timer2Fill : timer2Outline}
                  alt="2s"
                />
              </button>
              <button
                onClick={() => handleTimerChange(5)}
                className="camera-control-button"
              >
                <img
                  src={countdownTime === 5 ? timer5Fill : timer5Outline}
                  alt="5s"
                />
              </button>
              <button
                onClick={() => handleTimerChange(10)}
                className="camera-control-button"
              >
                <img
                  src={countdownTime === 10 ? timer10Fill : timer10Outline}
                  alt="10s"
                />
              </button>
            </div>

            {/* Mirror Toggle with Icon (only on mobile) */}
            {isMobile && (
              <button
                onClick={handleMirrorToggle}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={flipIcon}
                  alt="Flip Camera"
                  style={{
                    width: "32px",
                    height: "32px",
                    opacity: facingMode === "user" ? 1 : 0.5,
                    transition: "opacity 0.2s ease",
                  }}
                />
              </button>
            )}
          </div>

          <button
            ref={captureButtonRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className="shutter-button"
            style={{
              transform: isHolding ? "scale(0.9)" : "scale(1)",
            }}
            disabled={currentPhotos >= 10 || isCapturing}
          >
            <div
              style={{
                background: isHolding ? "rgba(255, 255, 255, 0.8)" : "#fff",
                transition: "background 0.2s ease",
              }}
            />
          </button>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </>
      )}
    </div>
  );
};

export default CameraFeed;
