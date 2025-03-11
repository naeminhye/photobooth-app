import React, { forwardRef } from "react";
import "./styles.css";
import { CAMERA_HEIGHT, CAMERA_WIDTH } from "../../constants";

interface SequentialGifProps {
  gifUrl: string | null;
  isCreatingGif: boolean;
  isMirrored: boolean; // Thêm prop isMirrored
}

const SequentialGif = forwardRef<HTMLDivElement, SequentialGifProps>(
  ({ gifUrl, isCreatingGif, isMirrored }, ref) => {
    return (
      <div ref={ref} className="sequential-gif">
        {isCreatingGif ? (
          <div
            style={{
              width: CAMERA_WIDTH / 2,
              height: CAMERA_HEIGHT / 2,
              border: "1px solid black",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#000",
            }}
          >
            <div className="loader"></div>
          </div>
        ) : gifUrl ? (
          <img
            src={gifUrl}
            alt="photo-gif"
            style={{
              width: CAMERA_WIDTH,
              height: CAMERA_HEIGHT,
              border: "1px solid black",
              transform: isMirrored ? "scaleX(-1)" : "scaleX(1)", // Áp dụng mirrored
            }}
          />
        ) : null}
      </div>
    );
  }
);

export default SequentialGif;