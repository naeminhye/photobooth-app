// App.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import PhotoStrip from "./components/PhotoStrip";
import FrameControls from "./components/FrameControls";
import CameraFeed from "./components/CameraFeed";
import {
  LAYOUTS,
  Layout,
  SUPPORTED_FORMATS,
  MAX_FILE_SIZE,
  MAX_UPLOAD_COUNT,
  Element,
  ElementType,
} from "./constants";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useDropzone } from "react-dropzone";

interface Photo {
  id: string;
  url: string;
}

const App: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<Photo[]>([]);
  const [previewPhotos, setPreviewPhotos] = useState<Photo[]>([]);
  const [frameColor, setFrameColor] = useState<string>("#FFFFFF");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [textOverlay, setTextOverlay] = useState<string>("");
  const [stickers, setStickers] = useState<Element[]>([]);
  const [layout, setLayout] = useState<number>(1); // Default to layout 1 (2x6" 3 Photo)
  const [undoStack, setUndoStack] = useState<Element[][]>([]);
  const [redoStack, setRedoStack] = useState<Element[][]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [selectedPreviewPhotos, setSelectedPreviewPhotos] = useState<string[]>(
    []
  );
  const [foregroundImage, setForegroundImage] = useState<string | null>(null); // New state for foreground image
  const photoStripRef: any = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  const resetAll = () => {
    setCapturedPhotos([]);
    setPreviewPhotos([]);
    setFrameColor("#FFF");
    setBackgroundImage(null);
    setForegroundImage(null);
    setTextOverlay("");
    setStickers([]);
    setLayout(1);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedElementId(null);
    setSelectedPreviewPhotos([]);
  };

  const handlePhotoCapture = (photo: string) => {
    if (previewPhotos.length >= 10) {
      alert("Maximum preview photo limit (10) reached.");
      return;
    }
    const newPhoto: Photo = { id: uuidv4(), url: photo };
    setPreviewPhotos([...previewPhotos, newPhoto]);
  };

  const handlePhotoUpload = (files: File[]) => {
    if (previewPhotos.length + files.length > 10) {
      alert(
        "Adding these photos would exceed the maximum preview photo limit (10)."
      );
      return;
    }
    const validFiles = files.filter(
      (file) =>
        SUPPORTED_FORMATS.some((format) =>
          file.name.toLowerCase().endsWith(format)
        ) && file.size <= MAX_FILE_SIZE
    );
    if (validFiles.length !== files.length) {
      alert(
        "Some files were skipped due to unsupported format or size exceeding 10MB."
      );
    }
    const newPhotos = validFiles.map((file) => {
      const reader = new FileReader();
      return new Promise<Photo>((resolve) => {
        reader.onload = (e) => {
          const photoUrl = e.target?.result as string;
          resolve({ id: uuidv4(), url: photoUrl });
        };
        reader.readAsDataURL(file);
      });
    });
    Promise.all(newPhotos).then((photos) => {
      setPreviewPhotos([...previewPhotos, ...photos]);
    });
  };

  const toggleFromStrip = (id: string) => {
    const isSelected = selectedPreviewPhotos.indexOf(id) !== -1;
    if (isSelected) {
      // Remove from strip and deselect
      setCapturedPhotos((prev) => prev.filter((photo) => photo.id !== id));
      setSelectedPreviewPhotos((prev) =>
        prev.filter((photoId) => photoId !== id)
      );
    } else {
      if (capturedPhotos.length >= LAYOUTS[layout].maxPhotos) {
        return;
      }
      const photoToAdd = previewPhotos.find((photo) => photo.id === id);
      if (photoToAdd && capturedPhotos.length < LAYOUTS[layout].maxPhotos) {
        setCapturedPhotos([...capturedPhotos, photoToAdd]);
        setSelectedPreviewPhotos((prev) => [...prev, id]);
      } else {
        alert("Maximum photo limit for the strip reached.");
      }
    }
  };

  const deletePreviewPhoto = (id: string) => {
    setPreviewPhotos(previewPhotos.filter((photo) => photo.id !== id));
    if (selectedPreviewPhotos.indexOf(id) !== -1) {
      setCapturedPhotos((prev) => prev.filter((photo) => photo.id !== id));
      setSelectedPreviewPhotos((prev) =>
        prev.filter((photoId) => photoId !== id)
      );
    }
  };

  const addElement = (type: ElementType, options: Partial<Element> = {}) => {
    const newElement: Element = {
      id: uuidv4(),
      type,
      x: 50,
      y: 50,
      rotate: 0,
      width: 100,
      height: 100,
      zIndex: stickers.length + 1,
      ...options,
    };
    setStickers([...stickers, newElement]);
    setUndoStack([...undoStack, [...stickers]]);
    setRedoStack([]);
    setSelectedElementId(newElement.id);
  };

  const handleStickerUpdate = (updatedStickers: Element[]) => {
    setStickers(updatedStickers);
    setUndoStack([...undoStack, [...stickers]]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const prevState = undoStack[undoStack.length - 1];
      setStickers([...prevState]);
      setUndoStack(undoStack.slice(0, -1));
      setRedoStack([...redoStack, [...stickers]]);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setStickers([...nextState]);
      setRedoStack(redoStack.slice(0, -1));
      setUndoStack([...undoStack, [...stickers]]);
    }
  };

  const bringToFront = (id: string) => {
    const updatedStickers = [...stickers]
      .sort((a, b) => (a.id === id ? 1 : -1))
      .map((s, index) => ({ ...s, zIndex: index + 1 }));
    handleStickerUpdate(updatedStickers);
    setSelectedElementId(id);
  };

  const sendToBack = (id: string) => {
    const updatedStickers = [...stickers]
      .sort((a, b) => (a.id === id ? -1 : 1))
      .map((s, index) => ({ ...s, zIndex: index + 1 }));
    handleStickerUpdate(updatedStickers);
    setSelectedElementId(id);
  };

  const handleKeyDown: any = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") handleUndo();
        if (e.key === "y") handleRedo();
      }
      if (e.altKey && e.key === "ArrowUp") {
        const selectedSticker = stickers.find(
          (s) => s.id === selectedElementId
        );
        if (selectedSticker) {
          const duplicatedSticker = {
            ...selectedSticker,
            id: uuidv4(),
            x: selectedSticker.x + 10,
            y: selectedSticker.y + 10,
          };
          handleStickerUpdate([...stickers, duplicatedSticker]);
        }
      }
    },
    [stickers, selectedElementId, undoStack, redoStack]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handlePhotoUpload,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".svg", ".gif"],
    },
    multiple: true,
  });

  return (
    <div className="app" tabIndex={0} onKeyDown={handleKeyDown}>
      <h1>Photobooth</h1>
      <div className="main-container">
        {hasPermission ? (
          <div className="controls-and-strip">
            <div className="strip-container">
              <div className="photo-camera-container">
                <div>
                  <CameraFeed
                    onCapture={handlePhotoCapture}
                    layout={layout}
                    maxPhotos={LAYOUTS[layout].maxPhotos}
                    currentPhotos={capturedPhotos.length}
                    showCamera={true}
                  />
                  <div className="preview-photos">
                    <h3>Preview Photos</h3>
                    <div className="preview-photos-list">
                      {previewPhotos?.map((photo) => (
                        <div
                          key={photo.id}
                          className={`preview-photo ${
                            selectedPreviewPhotos.indexOf(photo.id) !== -1
                              ? "selected"
                              : ""
                          } ${
                            capturedPhotos.length >= LAYOUTS[layout].maxPhotos
                              ? "cannot-select"
                              : ""
                          }
                          `}
                          onClick={() => toggleFromStrip(photo.id)}
                        >
                          <img src={photo.url} alt="Preview" />
                          {selectedPreviewPhotos.indexOf(photo.id) !== -1 && (
                            <div className="selected-count">
                              <FontAwesomeIcon
                                icon={faCheck}
                                className="check-icon"
                              />
                            </div>
                          )}
                          <button
                            className="delete-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePreviewPhoto(photo.id);
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                      {previewPhotos.length < 10 && (
                        <div
                          {...getRootProps()}
                          className="upload-placeholder"
                          style={{
                            background: isDragActive
                              ? "#e1e1e1"
                              : "transparent",
                          }}
                        >
                          <input {...getInputProps()} />
                          <FontAwesomeIcon
                            icon={faPlus}
                            style={{ fontSize: "24px", color: "#999" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <FrameControls
                  onColorChange={setFrameColor}
                  onBackgroundChange={setBackgroundImage}
                  onForegroundChange={setForegroundImage}
                  backgroundImage={backgroundImage}
                  foregroundImage={foregroundImage}
                  onTextChange={setTextOverlay}
                  onStickerAdd={addElement}
                  layout={layout}
                  onLayoutChange={(newLayout) => {
                    if (capturedPhotos.length === 0) {
                      setLayout(newLayout);
                    }
                  }}
                  capturedPhotos={capturedPhotos.map((photo) => photo.url)}
                  onReset={resetAll}
                  onPhotoUpload={(files: any) => handlePhotoUpload(files)}
                  stickers={stickers}
                  selectedElementId={selectedElementId}
                  onStickerUpdate={handleStickerUpdate}
                  bringToFront={bringToFront}
                  sendToBack={sendToBack}
                  photoStripRef={photoStripRef}
                  frameColor={frameColor}
                  textOverlay={textOverlay}
                />
                <PhotoStrip
                  ref={photoStripRef}
                  photos={capturedPhotos}
                  onPhotoCapture={handlePhotoCapture}
                  onPhotoOrderChange={(newPhotos) =>
                    setCapturedPhotos(newPhotos)
                  }
                  onPhotoUpload={() => {}} // Disabled upload on strip
                  frameColor={frameColor}
                  backgroundImage={backgroundImage}
                  textOverlay={textOverlay}
                  stickers={stickers}
                  onStickerUpdate={handleStickerUpdate}
                  layout={layout}
                  foregroundImage={foregroundImage} // Pass foreground image
                />
              </div>
            </div>
          </div>
        ) : (
          <p>Please allow camera access to use the photobooth</p>
        )}
      </div>
    </div>
  );
};

export default App;
