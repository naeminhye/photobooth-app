import { DropzoneInputProps, DropzoneRootProps } from "react-dropzone";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faTrash,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { LAYOUTS } from "../../constants";
import { useMemo } from "react";

interface Photo {
  id: string;
  url: string;
}

interface PreviewPhotosProps {
  isViewOnly?: boolean;
  selectedPhotos: Photo[];
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
  isDragActive: boolean;
  previewPhotos: Photo[];
  layout: number;
  setPreviewPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  setSelectedPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
}

const PreviewPhotos: React.FC<PreviewPhotosProps> = ({
  isViewOnly = false,
  selectedPhotos,
  getRootProps,
  getInputProps,
  isDragActive,
  previewPhotos,
  layout,
  setSelectedPhotos,
  setPreviewPhotos,
}) => {
  const maxPhotos = LAYOUTS[layout].rectangles.length;

  const selectedPreviewPhotos = useMemo(
    () => selectedPhotos.map((photo) => photo.id),
    [selectedPhotos]
  );

  const toggleFromStrip = (id: string) => {
    if (isViewOnly) return;
    const isSelected = selectedPreviewPhotos.includes(id);
    if (isSelected) {
      setSelectedPhotos((prev) => prev.filter((photo) => photo.id !== id));
    } else if (selectedPhotos.length < maxPhotos) {
      const photoToAdd = previewPhotos.find((photo) => photo.id === id);
      if (photoToAdd) {
        setSelectedPhotos((prev) => [...prev, photoToAdd]);
      }
    } else {
      alert("Maximum photo limit for the strip reached.");
    }
  };

  const deletePreviewPhoto = (id: string) => {
    setPreviewPhotos((prev) => prev.filter((photo) => photo.id !== id));
    if (selectedPreviewPhotos.includes(id)) {
      setSelectedPhotos((prev) => prev.filter((photo) => photo.id !== id));
    }
  };

  return previewPhotos?.length || !isViewOnly ? (
    <div className="preview-photos">
      <h3>Preview Photos</h3>
      <div className="preview-photos-list">
        {previewPhotos.map((photo) => (
          <div
            key={photo.id}
            className={`preview-photo ${
              selectedPreviewPhotos.includes(photo.id) ? "selected" : ""
            } ${selectedPhotos.length >= maxPhotos ? "cannot-select" : ""}`}
            onClick={() => toggleFromStrip(photo.id)}
          >
            <img src={photo.url} alt="Preview" />
            {selectedPreviewPhotos.includes(photo.id) && (
              <div className="selected-count">
                <FontAwesomeIcon icon={faCircleCheck} className="check-icon" />
              </div>
            )}
            {!isViewOnly && (
              <button
                className="delete-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePreviewPhoto(photo.id);
                }}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
          </div>
        ))}
        {previewPhotos.length < 10 && !isViewOnly && (
          <div
            {...getRootProps()}
            className="upload-placeholder"
            style={{ background: isDragActive ? "#e1e1e1" : "transparent" }}
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
  ) : (
    <></>
  );
};

export default PreviewPhotos;
