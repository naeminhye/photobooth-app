// components/CameraFeed/index.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import GIF from "gif.js";
import { CAMERA_HEIGHT, CAMERA_WIDTH } from "../../constants";

interface CameraFeedProps {
  onCapture: (photo: string) => void;
  onGifComplete: (gifUrl: string) => void;
  layout: number;
  maxPhotos: number;
  currentPhotos: number;
  showCamera: boolean;
  timerEnabled: boolean;
  setIsCreatingGif: (isCreating: boolean) => void;
  countdownTime: number;
  isMirrored: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({
  onCapture,
  onGifComplete,
  layout,
  maxPhotos,
  currentPhotos,
  showCamera,
  timerEnabled,
  setIsCreatingGif,
  countdownTime,
  isMirrored,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureButtonRef = useRef<HTMLButtonElement>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const gifFrames = useRef<ImageData[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (showCamera) {
      setIsVideoReady(true);
    }
    return () => {
      setIsVideoReady(false);
    };
  }, [showCamera, layout]);

  const capturePhoto = () => {
    if (webcamRef.current && isVideoReady) {
      const photo = webcamRef.current.getScreenshot({
        width: 1920, // Tăng độ phân giải ảnh chụp
        height: 1440,
      });
      if (photo) {
        onCapture(photo);
        setPhotoCount((prev) => prev + 1);
      }
    }
  };

  const captureFrame = () => {
    if (webcamRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = CAMERA_WIDTH;
        canvas.height = CAMERA_HEIGHT;
        context.drawImage(webcamRef.current.video!, 0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
        return context.getImageData(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
      }
    }
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

    const gif = new GIF({
      workers: 2,
      quality: 1,
      workerScript: process.env.PUBLIC_URL + "/gif.worker.js",
      width: CAMERA_WIDTH,
      height: CAMERA_HEIGHT,
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
  };

  const runCountdown = async () => {
    for (let i = 0; i < maxPhotos; i++) {
      if (!webcamRef.current) break;

      for (let sec = countdownTime; sec > 0; sec--) {
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
    if (currentPhotos >= 10) {
      alert("Maximum preview photo limit (10) reached.");
      return;
    }

    if (currentPhotos >= (timerEnabled ? maxPhotos + 4 : 10) || isCapturing) return;
    setIsCapturing(true);


    gifFrames.current = [];
    runCountdown();
  }, []);

  const handleMouseDown = () => {
    if (showCamera && currentPhotos < (timerEnabled ? maxPhotos + 4 : 10) && !isCapturing) {
      setIsHolding(true);
    }
  };

  const handleMouseUp = () => {
    if (showCamera && isHolding && currentPhotos < (timerEnabled ? maxPhotos + 4 : 10) && !isCapturing) {
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
    if (showCamera && currentPhotos < (timerEnabled ? maxPhotos + 4 : 10) && !isCapturing) {
      setIsHolding(true);
    }
  };

  const handleTouchEnd = () => {
    if (showCamera && isHolding && currentPhotos < (timerEnabled ? maxPhotos + 4 : 10) && !isCapturing) {
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

  return (
    <div
      className="camera-feed"
      style={{
        width: `${CAMERA_WIDTH}px`,
        height: `${CAMERA_HEIGHT}px`,
        position: "relative",
        background: "#000",
        border: "2px solid #fff",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      {showCamera && (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg" // Chuyển sang JPEG để tối ưu chất lượng
          screenshotQuality={1} // Chất lượng tối đa (0-1)
          width={CAMERA_WIDTH}
          height={CAMERA_HEIGHT}
          mirrored={isMirrored}
          videoConstraints={{
            width: 1920, // Tăng độ phân giải webcam
            height: 1440,
            facingMode: "user",
          }}
        />
      )}
      {countdown !== null && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            color: "white",
            fontSize: "40px",
            fontWeight: "bold",
            background: "rgba(0, 0, 0, 0.5)",
            padding: "5px 10px",
            borderRadius: "5px",
          }}
        >
          {countdown}
        </div>
      )}
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
    </div>
  );
};

export default CameraFeed;