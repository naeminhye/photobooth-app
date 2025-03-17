// CropModal.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Transformer,
  Shape,
} from "react-konva";
import Konva from "konva";

interface CropModalProps {
  imageUrl: string;
  layoutWidth: number;
  layoutHeight: number;
  onConfirm: (croppedImage: HTMLImageElement) => void;
  onCancel: () => void;
}

const CropModal: React.FC<CropModalProps> = ({
  imageUrl,
  layoutWidth,
  layoutHeight,
  onConfirm,
  onCancel,
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cropRect, setCropRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [scale, setScale] = useState(1);
  const stageRef = useRef<any>(null);
  const rectRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);

      // Calculate scale to fit image within screen (e.g., 80% of viewport height or width)
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.8;
      const imgAspectRatio = img.width / img.height;
      let newScale = 1;
      if (img.width > maxWidth || img.height > maxHeight) {
        if (maxWidth / img.width < maxHeight / img.height) {
          newScale = maxWidth / img.width;
        } else {
          newScale = maxHeight / img.height;
        }
      }
      setScale(newScale);

      // Set cropRect to full image size (scaled), adjusted to layout aspect ratio
      const scaledWidth = img.width * newScale;
      const scaledHeight = img.height * newScale;
      const layoutAspectRatio = layoutWidth / layoutHeight;
      let adjustedWidth = scaledWidth;
      let adjustedHeight = adjustedWidth / layoutAspectRatio;
      if (adjustedHeight > scaledHeight) {
        adjustedHeight = scaledHeight;
        adjustedWidth = adjustedHeight * layoutAspectRatio;
      }
      setCropRect({
        x: (scaledWidth - adjustedWidth) / 2,
        y: (scaledHeight - adjustedHeight) / 2,
        width: adjustedWidth,
        height: adjustedHeight,
      });
    };
  }, [imageUrl, layoutWidth, layoutHeight]);

  useEffect(() => {
    if (rectRef.current && transformerRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [cropRect]);

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const stageWidth = (image?.width || 0) * scale;
    const stageHeight = (image?.height || 0) * scale;
    const newX = node.x();
    const newY = node.y();
    // Ensure cropRect stays fully within image bounds
    const boundedX = Math.max(0, Math.min(newX, stageWidth - cropRect.width));
    const boundedY = Math.max(0, Math.min(newY, stageHeight - cropRect.height));
    setCropRect((prev) => ({
      ...prev,
      x: boundedX,
      y: boundedY,
    }));
    node.x(boundedX);
    node.y(boundedY);
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const stageWidth = (image?.width || 0) * scale;
    const stageHeight = (image?.height || 0) * scale;
    const layoutAspectRatio = layoutWidth / layoutHeight;
    const newWidth = node.width() * node.scaleX();
    const newHeight = newWidth / layoutAspectRatio;
    // Ensure cropRect stays within image bounds and adjusts position if necessary
    const boundedWidth = Math.min(newWidth, stageWidth);
    const boundedHeight = boundedWidth / layoutAspectRatio;
    let boundedX = cropRect.x;
    let boundedY = cropRect.y;
    if (boundedX + boundedWidth > stageWidth) {
      boundedX = stageWidth - boundedWidth;
    }
    if (boundedY + boundedHeight > stageHeight) {
      boundedY = stageHeight - boundedHeight;
    }
    boundedX = Math.max(0, boundedX);
    boundedY = Math.max(0, boundedY);
    setCropRect({
      x: boundedX,
      y: boundedY,
      width: boundedWidth,
      height: boundedHeight,
    });
    node.scaleX(1);
    node.scaleY(1);
    node.x(boundedX);
    node.y(boundedY);
  };

  const cropImage = () => {
    if (!image || !stageRef.current) return;

    const stage = stageRef.current;
    const stageScale = scale;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate the original image coordinates and dimensions
    const originalWidth = cropRect.width / stageScale;
    const originalHeight = cropRect.height / stageScale;
    const originalX = cropRect.x / stageScale;
    const originalY = cropRect.y / stageScale;

    canvas.width = originalWidth;
    canvas.height = originalHeight;
    ctx.drawImage(
      image,
      originalX,
      originalY,
      originalWidth,
      originalHeight,
      0,
      0,
      originalWidth,
      originalHeight
    );

    const croppedImage = new Image();
    croppedImage.src = canvas.toDataURL("image/png", 1.0);
    croppedImage.onload = () => onConfirm(croppedImage);
  };

  if (!image) return null;

  const stageWidth = image.width * scale;
  const stageHeight = image.height * scale;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <Stage
          width={stageWidth}
          height={stageHeight}
          ref={stageRef}
          scaleX={1}
          scaleY={1}
        >
          <Layer>
            <KonvaImage image={image} width={stageWidth} height={stageHeight} />
            {/* Dark overlay with cutout for cropRect */}
            <Shape
              sceneFunc={(context, shape) => {
                context.beginPath();
                // Draw the outer rectangle (entire stage)
                context.rect(0, 0, stageWidth, stageHeight);
                // Cut out the cropRect area
                context.rect(
                  cropRect.x,
                  cropRect.y,
                  cropRect.width,
                  cropRect.height
                );
                context.closePath();
                // Fill with semi-transparent black to darken the outside area
                context.fillStyle = "rgba(0, 0, 0, 0.5)";
                context.fill("evenodd");
              }}
            />
            <Rect
              ref={rectRef}
              x={cropRect.x}
              y={cropRect.y}
              width={cropRect.width}
              height={cropRect.height}
              strokeWidth={0}
              draggable
              onDragMove={handleDragMove}
              onTransformEnd={handleTransformEnd}
            />
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                const layoutAspectRatio = layoutWidth / layoutHeight;
                newBox.width = Math.max(newBox.width, 10);
                newBox.height = newBox.width / layoutAspectRatio;
                const stageWidth = (image?.width || 0) * scale;
                const stageHeight = (image?.height || 0) * scale;
                if (newBox.width > stageWidth) newBox.width = stageWidth;
                if (newBox.height > stageHeight) newBox.height = stageHeight;
                return newBox;
              }}
              keepRatio={true}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
              rotateEnabled={false}
            />
          </Layer>
        </Stage>
        <div className="modal-actions">
          <button onClick={cropImage}>Confirm</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default CropModal;
