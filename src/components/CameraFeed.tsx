// components/CameraFeed.tsx
import React, { useRef, useEffect, useState } from "react";

interface CameraFeedProps {
  onCapture: (photo: string) => void;
  layout: number;
  maxPhotos: number;
  currentPhotos: number;
  showCamera: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({
  onCapture,
  layout,
  maxPhotos,
  currentPhotos,
  showCamera,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureButtonRef = useRef<HTMLButtonElement>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false); // Track video readiness

  useEffect(() => {
    if (showCamera) {
      startCamera();
    } else {
      stopCamera(); // Stop camera stream when limit is reached or camera interaction disabled
    }
    return () => {
      stopCamera(); // Clean up on unmount
    };
  }, [showCamera, layout]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsVideoReady(true); // Set video as ready when metadata is loaded
        };
      }
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsVideoReady(false); // Reset video readiness
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && showCamera && isVideoReady) {
      console.log("Capturing photo, video ready:", isVideoReady); // Debug log
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = 600; // Fixed width for 600x450
        canvasRef.current.height = 450; // Fixed height for 600x450
        try {
          context.drawImage(videoRef.current, 0, 0, 600, 450);
          const photo = canvasRef.current.toDataURL("image/png");
          onCapture(photo);
        } catch (error) {
          console.error("Error in drawImage:", error);
        }
      }
    } else {
      console.warn(
        "Cannot capture photo: Video not ready or conditions not met",
        {
          isVideoReady,
          // isLimitReached,
          showCamera,
        }
      );
    }
  };

  const handleMouseDown = () => {
    if (showCamera) {
      setIsHolding(true);
    }
  };

  const handleMouseUp = () => {
    if (showCamera && isHolding) {
      setIsHolding(false);
      capturePhoto();
    }
  };

  const handleMouseLeave = () => {
    if (isHolding) {
      setIsHolding(false);
    }
  };

  const handleTouchStart = () => {
    if (showCamera) {
      setIsHolding(true);
    }
  };

  const handleTouchEnd = () => {
    if (showCamera && isHolding) {
      setIsHolding(false);
      capturePhoto();
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
        width: "600px", // Fixed width
        height: "450px", // Fixed height
        position: "relative",
        background: "#000", // Black background for camera view
        border: "2px solid #fff", // White border for a clean look
        borderRadius: "10px", // Rounded corners for modern look
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
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
          transform: isHolding ? "scale(0.8)" : "scale(1)", // Squeeze effect only when interactive
        }}
      >
        {/* Optional inner circle for visual feedback */}
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
