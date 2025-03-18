// src/components/SequentialVideo/index.tsx
import React, { forwardRef } from "react";
import "./styles.css"; // Reuse existing styles or create new ones
import { CAMERA_HEIGHT, CAMERA_WIDTH } from "../../constants";

interface SequentialVideoProps {
  videoUrl: string | null;
  isRecordingVideo: boolean;
}

const SequentialVideo = forwardRef<HTMLDivElement, SequentialVideoProps>(
  ({ videoUrl, isRecordingVideo }, ref) => {
    return (
      <div ref={ref} className="sequential-video">
        {isRecordingVideo ? (
          <div
            style={{
              width: CAMERA_WIDTH / 2,
              height: CAMERA_HEIGHT / 2,
            }}
            className="loader-container"
          >
            <div className="loader"></div>
          </div>
        ) : videoUrl ? (
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            muted
            style={{
              width: CAMERA_WIDTH,
              height: CAMERA_HEIGHT,
              border: "1px solid black",
            }}
          />
        ) : null}
      </div>
    );
  }
);

export default SequentialVideo;
