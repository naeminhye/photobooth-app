// src/components/CameraFeed/index.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import GIF from "gif.js";

import { CAMERA_HEIGHT, CAMERA_WIDTH, MAX_PHOTOS } from "@/constants";
import { getDeviceType } from "@/utils";
import { flipFrameHorizontally } from "@/utils/canvas";

// Icons
import flipIcon from "@/assets/icons/flip.png";
import timerOffFill from "@/assets/icons/timer_off_fill.png";
import timerOffOutline from "@/assets/icons/timer_off_outline.png";
import timer2Fill from "@/assets/icons/timer_2_fill.png";
import timer2Outline from "@/assets/icons/timer_2_outline.png";
import timer5Fill from "@/assets/icons/timer_5_fill.png";
import timer5Outline from "@/assets/icons/timer_5_outline.png";
import timer10Fill from "@/assets/icons/timer_10_fill.png";
import timer10Outline from "@/assets/icons/timer_10_outline.png";

import "./styles.css";

interface CameraFeedProps {
  onCapture: (photo: string) => void;
  onVideoComplete?: (videoUrl: string, mimeType: string) => void;
  layout: number;
  maxPhotos: number;
  currentPhotos: number;
  timerEnabled: boolean;
  setIsRecordingVideo: (isRecording: boolean) => void;
  countdownTime: number;
  isMirrored: boolean;
  onTimerChange: (time: number) => void;
  onMirrorToggle: (isMirrored: boolean) => void;
  captureMode: "photostrip" | "gif" | "video";
}

const CameraFeed: React.FC<CameraFeedProps> = ({
  onCapture,
  onVideoComplete,
  layout,
  maxPhotos,
  currentPhotos,
  timerEnabled,
  setIsRecordingVideo,
  countdownTime,
  isMirrored,
  onTimerChange,
  onMirrorToggle,
  captureMode,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureButtonRef = useRef<HTMLButtonElement>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
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
  const gifFrames = useRef<ImageData[]>([]);

  const deviceType = getDeviceType();
  const isMobile =
    deviceType.includes("Mobile") ||
    deviceType.includes("iOS") ||
    deviceType.includes("Android");

  useEffect(() => {
    if (captureMode !== "photostrip" && countdownTime === 0) {
      onTimerChange(2);
    }
  }, [countdownTime, captureMode, onTimerChange]);

  useEffect(() => {
    countdownRef.current = countdownTime;
  }, [countdownTime]);

  useEffect(() => {
    maxPhotosRef.current = maxPhotos;
  }, [maxPhotos]);

  useEffect(() => {
    const updateCameraDimensions = () => {
      const viewportWidth = window.innerWidth;
      const isPortrait = window.innerHeight > window.innerWidth || isMobile;
      const aspectRatio = isPortrait ? 4 / 3 : 3 / 4;

      let baseWidth: number;
      if (viewportWidth <= 320) {
        baseWidth = 280;
      } else if (viewportWidth <= 425) {
        baseWidth = 380;
      } else if (viewportWidth <= 768) {
        baseWidth = 480;
      } else {
        baseWidth = 640;
      }

      baseWidth = Math.min(baseWidth, viewportWidth * 0.9);
      const baseHeight = baseWidth * aspectRatio;
      const maxHeight = window.innerHeight * 0.7;
      const finalHeight = Math.min(baseHeight, maxHeight);
      const finalWidth = finalHeight / aspectRatio;

      setCameraDimensions({
        width: Math.round(finalWidth),
        height: Math.round(finalHeight),
      });
    };

    updateCameraDimensions();
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
      const photo = webcamRef.current.getScreenshot({
        width: webcamRef.current.video.videoWidth || cameraDimensions.width,
        height: webcamRef.current.video.videoHeight || cameraDimensions.height,
      });
      if (photo) {
        onCapture(photo);
      } else {
        setCameraError(
          "Failed to capture photo. The video stream may not be ready or the resolution is unsupported."
        );
      }
    } else {
      setCameraError(
        "Failed to capture photo. The video stream is not ready. Please wait a moment and try again."
      );
    }
  }, [onCapture, cameraDimensions]);

  const captureFrame = useCallback(() => {
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
        return context.getImageData(
          0,
          0,
          cameraDimensions.width,
          cameraDimensions.height
        );
      }
    }
    return null;
  }, [cameraDimensions.width, cameraDimensions.height]);

  const createGif = useCallback(() => {
    if (!gifFrames.current?.length || !onVideoComplete) {
      setIsRecording(false);
      setIsRecordingVideo(false);
      return;
    }

    setIsRecordingVideo(true);

    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: process.env.PUBLIC_URL + "/gif.worker.js",
      width: cameraDimensions.width,
      height: cameraDimensions.height,
    });

    // Flip each frame before adding it to the GIF
    gifFrames.current.forEach((frame) => {
      const flippedFrame = flipFrameHorizontally(frame, isMirrored);
      gif.addFrame(flippedFrame, { delay: 150 });
    });

    gif.on("finished", (blob) => {
      const gifUrl = URL.createObjectURL(blob);
      onVideoComplete(gifUrl, "image/gif");
      gifFrames.current = [];
      setIsRecording(false);
      setIsRecordingVideo(false);
    });

    gif.render();
  }, [cameraDimensions.width, cameraDimensions.height, isMirrored, onVideoComplete, setIsRecordingVideo]);

  const getSupportedVideoMimeType = () => {
    const webmType = "video/webm;codecs=vp9";
    const webmAlternative = "video/webm;codecs=vp8";
    const mp4Type = "video/mp4"; // Avoid specifying a codec

    if (MediaRecorder.isTypeSupported(webmType)) {
      return webmType;
    } else if (MediaRecorder.isTypeSupported(webmAlternative)) {
      return webmAlternative;
    } else if (MediaRecorder.isTypeSupported(mp4Type)) {
      return mp4Type;
    } else {
      console.error("No supported video formats found.");
      return "";
    }
  };

  const startVideoRecording = useCallback(() => {
    if (!webcamRef.current || !webcamRef.current.video) {
      console.warn("Webcam video not available.");
      return;
    }

    const originalStream = webcamRef.current.video.srcObject as MediaStream;
    if (!originalStream) {
      console.warn("Original camera stream not found.");
      return;
    }

    const mimeType = getSupportedVideoMimeType();
    if (!mimeType) {
      console.warn("No supported video format found.");
      return;
    }

    // Create a hidden canvas for flipping
    const videoTrack = originalStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const canvas = document.createElement("canvas");
    canvas.width = settings.width || 1280;
    canvas.height = settings.height || 720;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.warn("Failed to get 2D context for canvas.");
      return;
    }

    // Capture flipped video frames
    const outputStream = canvas.captureStream(30);

    mediaRecorderRef.current = new MediaRecorder(outputStream, { mimeType });

    let chunks: Blob[] = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      if (chunks.length > 0) {
        const videoBlob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(videoBlob);

        if (onVideoComplete) {
          onVideoComplete(videoUrl, mimeType);
        } else {
          console.warn("onVideoComplete is undefined, skipping callback.");
        }
      } else {
        console.warn("No recorded video data.");
      }
      setIsRecording(false);
      setIsRecordingVideo(false);
    };

    mediaRecorderRef.current.onerror = (error) => {
      console.error("MediaRecorder error:", error);
      setIsRecording(false);
      setIsRecordingVideo(false);
    };

    // Function to flip and draw frames onto canvas
    const drawFlippedFrame = () => {
      if (!ctx || !webcamRef.current || !webcamRef.current.video) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // Flip horizontally
      }

      ctx.drawImage(webcamRef.current.video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      requestAnimationFrame(drawFlippedFrame);
    };

    drawFlippedFrame(); // Start rendering flipped frames

    mediaRecorderRef.current.start();
    setIsRecording(true);
    setIsRecordingVideo(true);
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onVideoComplete, isMirrored]);

  const stopVideoRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      console.log(
        "Video recording stopped automatically after all countdowns."
      );
    } else {
      console.warn("Tried to stop recording, but it's already inactive.");
    }
  };

  const runCountdown = useCallback(async () => {
    if (captureMode === "video" && !isRecording) {
      startVideoRecording(); // Start recording at the beginning
    }

    for (let i = 0; i < maxPhotosRef.current; i++) {
      if (!webcamRef.current || !countdownRef.current) break;

      console.log(
        `Starting countdown for photo ${i + 1}/${maxPhotosRef.current}`
      );

      for (let sec = countdownRef.current; sec >= 0; sec--) {
        setCountdown(sec);
        if (captureMode === "gif") {
          const frame = captureFrame();
          if (frame) gifFrames.current.push(frame);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      capturePhoto(); // Capture photo after countdown for this step
    }

    setCountdown(null);

    if (captureMode === "gif") {
      createGif();
    }
    // Stop video recording **only after all countdowns are done**
    else if (captureMode === "video") {
      console.log("All countdowns finished, stopping video recording...");
      stopVideoRecording();
    } else {
      setIsRecording(false);
    }
  }, [captureFrame, captureMode, capturePhoto, createGif, isRecording, startVideoRecording]);

  const startCountdown = useCallback(() => {
    if (currentPhotos >= MAX_PHOTOS) {
      setCameraError(`Maximum preview photo limit (${MAX_PHOTOS}) reached.`);
      return;
    }

    if (currentPhotos >= (timerEnabled ? maxPhotos + 4 : 10) || isRecording)
      return;
    setIsRecording(true);
    gifFrames.current = [];
    runCountdown();
  }, [
    currentPhotos,
    timerEnabled,
    maxPhotos,
    isRecording,
    runCountdown
  ]);

  const handleMouseDown = () => {
    if (currentPhotos < (timerEnabled ? maxPhotos + 4 : 10) && !isRecording) {
      setIsHolding(true);
    }
  };

  const handleMouseUp = () => {
    if (
      isHolding &&
      currentPhotos < (timerEnabled ? maxPhotos + 4 : 10) &&
      !isRecording
    ) {
      setIsHolding(false);
      if (timerEnabled) {
        startCountdown();
      } else {
        capturePhoto();
        if (captureMode === "video") {
          startVideoRecording();
          setTimeout(() => {
            stopVideoRecording();
          }, 5000);
        } else if (captureMode === "gif" && onVideoComplete) {
          setIsRecording(true);
          setIsRecordingVideo(true);
          const frame = captureFrame();
          if (frame) {
            gifFrames.current = [frame];
            createGif();
          } else {
            setIsRecording(false);
            setIsRecordingVideo(false);
          }
        }
      }
    }
  };

  const handleMouseLeave = () => {
    if (isHolding) {
      setIsHolding(false);
    }
  };

  const handleTouchStart = () => {
    if (currentPhotos < (timerEnabled ? maxPhotos + 4 : 10) && !isRecording) {
      setIsHolding(true);
    }
  };

  const handleTouchEnd = () => {
    if (
      isHolding &&
      currentPhotos < (timerEnabled ? maxPhotos + 4 : 10) &&
      !isRecording
    ) {
      setIsHolding(false);
      if (timerEnabled) {
        startCountdown();
      } else {
        capturePhoto();
        if (captureMode === "video") {
          startVideoRecording();
          setTimeout(() => {
            stopVideoRecording();
          }, 5000);
        } else if (captureMode === "gif" && onVideoComplete) {
          setIsRecording(true);
          setIsRecordingVideo(true);
          const frame = captureFrame();
          if (frame) {
            gifFrames.current = [frame];
            createGif();
          } else {
            setIsRecording(false);
            setIsRecordingVideo(false);
          }
        }
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

  return (
    <>
      <div className="camera-control">
        {captureMode === "photostrip" && (
          <button
            onClick={() => handleTimerChange(0)}
            className="camera-control-button"
          >
            <img
              src={countdownTime === 0 ? timerOffFill : timerOffOutline}
              alt="Off"
            />
          </button>
        )}
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
        <button onClick={handleMirrorToggle} className="camera-control-button">
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
      </div>
      <div
        className="camera-feed"
        style={{
          width: `${cameraDimensions.width}px`,
          height: `${cameraDimensions.height}px`,
          maxWidth: "100%",
          margin: "0 auto",
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
                height: { ideal: 720, max: 1440, min: 373 },
                facingMode,
                frameRate: { ideal: 30, max: 60 },
              }}
              onUserMediaError={handleCameraError}
              playsInline
              style={{ objectFit: "cover" }}
            />
            {countdown !== null && <div className="countdown">{countdown}</div>}
            <button
              ref={captureButtonRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              className="shutter-button"
              style={{ transform: isHolding ? "scale(0.9)" : "scale(1)" }}
              disabled={currentPhotos >= 10 || isRecording}
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
    </>
  );
};

export default CameraFeed;
