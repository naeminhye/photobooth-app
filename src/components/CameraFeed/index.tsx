// components/CameraFeed/index.tsx
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import GIF from "gif.js";

interface CameraFeedProps {
  onCapture: (photo: string) => void;
  onGifComplete: (gifUrl: string) => void;
  layout: number;
  maxPhotos: number;
  currentPhotos: number;
  showCamera: boolean;
  timerEnabled: boolean;
  setIsCreatingGif: (isCreating: boolean) => void;
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
      const photo = webcamRef.current.getScreenshot();
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
        canvas.width = 600;
        canvas.height = 450;
        context.drawImage(webcamRef.current.video!, 0, 0, 600, 450);
        return context.getImageData(0, 0, 600, 450);
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
      width: 600,
      height: 450,
    });

    gifFrames.current.forEach((frame) => gif.addFrame(frame, { delay: 200 }));

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

      for (let sec = 10; sec > 0; sec--) {
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

  const startCountdown = () => {
    if (photoCount >= maxPhotos || isCapturing) return;
    setIsCapturing(true);
    gifFrames.current = [];
    runCountdown();
  };

  const handleMouseDown = () => {
    if (showCamera && photoCount < maxPhotos && !isCapturing) {
      setIsHolding(true);
    }
  };

  const handleMouseUp = () => {
    if (showCamera && isHolding && photoCount < maxPhotos && !isCapturing) {
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
    if (showCamera && photoCount < maxPhotos && !isCapturing) {
      setIsHolding(true);
    }
  };

  const handleTouchEnd = () => {
    if (showCamera && isHolding && photoCount < maxPhotos && !isCapturing) {
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
        width: "600px",
        height: "450px",
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
          screenshotFormat="image/png"
          width={600}
          height={450}
          mirrored={true}
          videoConstraints={{
            width: 600,
            height: 450,
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
          transform: isHolding ? "scale(0.8)" : "scale(1)",
        }}
        disabled={photoCount >= maxPhotos || isCapturing}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: isHolding ? "rgba(255, 255, 255, 0.7)" : "#fff",
            transition: "background 0.2s ease",
          }}
        />
      </button>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default CameraFeed;
