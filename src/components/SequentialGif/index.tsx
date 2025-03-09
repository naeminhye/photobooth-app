// components/SequentialGif/index.tsx
import React, { forwardRef } from "react";

import "./styles.css";
import { CAMERA_HEIGHT, CAMERA_WIDTH } from "../../constants";

interface SequentialGifProps {
  gifUrl: string | null;
  isCreatingGif: boolean; // Thêm prop để hiển thị loading
}

const SequentialGif = forwardRef<HTMLDivElement, SequentialGifProps>(
  ({ gifUrl, isCreatingGif }, ref) => {

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
            }}
          />
        ) : null}
      </div>
    );
  }
);

export default SequentialGif;
