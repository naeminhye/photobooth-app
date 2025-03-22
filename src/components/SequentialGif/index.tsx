// src/components/SequentialGif/index.tsx
import { forwardRef } from "react";
import { CAMERA_HEIGHT, CAMERA_WIDTH } from "@/constants";
import "./styles.css";

interface SequentialGifProps {
  gifUrl: string | null;
  isRecordingGif: boolean;
}

const SequentialGif = forwardRef<HTMLDivElement, SequentialGifProps>(
  ({ gifUrl, isRecordingGif }, ref) => {
    return (
      <div ref={ref} className="sequential-gif">
        {isRecordingGif ? (
          <div
            style={{
              width: CAMERA_WIDTH / 2,
              height: CAMERA_HEIGHT / 2,
            }}
            className="loader-container"
          >
            <div className="loader"></div>
          </div>
        ) : gifUrl ? (
          <img
            src={gifUrl}
            alt="Sequential GIF"
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

export default SequentialGif;
