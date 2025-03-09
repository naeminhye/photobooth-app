// constants/index.ts
export interface Paddings {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface GridTemplate {
  columns: number;
  rows: number;
}

export interface Layout {
  maxPhotos: number;
  width: number;
  height: number;
  arrangement: "vertical" | "horizontal" | "grid";
  unit: "px" | "in";
  gap?: number;
  paddings?: Paddings;
  gridTemplate?: GridTemplate;
}

export const LAYOUTS: Record<number, Layout> = {
  1: {
    maxPhotos: 4,
    width: 288,
    height: 864,
    arrangement: "vertical",
    unit: "px",
    gap: 10,
    paddings: {
      top: 15,
      right: 15,
      left: 15,
      bottom: 100,
    },
  },
  2: {
    maxPhotos: 3,
    width: 288,
    height: 864,
    arrangement: "vertical",
    unit: "px",
    gap: 10,
    paddings: {
      top: 10,
      right: 10,
      left: 10,
      bottom: 20,
    },
  },
  3: {
    maxPhotos: 2,
    width: 288,
    height: 864,
    arrangement: "vertical",
    unit: "px",
    gap: 10,
    paddings: {
      top: 10,
      right: 10,
      left: 10,
      bottom: 20,
    },
  },
  4: {
    maxPhotos: 4,
    width: 576,
    height: 864,
    arrangement: "grid",
    unit: "px",
    gap: 10,
    paddings: {
      top: 10,
      right: 10,
      left: 10,
      bottom: 50,
    },
    gridTemplate: {
      columns: 2,
      rows: 2,
    },
  },
  5: {
    maxPhotos: 3,
    width: 864,
    height: 288,
    arrangement: "horizontal",
    unit: "px",
    gap: 10,
    paddings: {
      top: 15,
      right: 15,
      left: 15,
      bottom: 15,
    },
  },
};

export const SUPPORTED_FORMATS = [".png", ".jpg", ".jpeg", ".svg", ".gif"];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const MAX_UPLOAD_COUNT = 10;

// Define element types
export type ElementType = "image" | "text" | "shape" | "icon";
export interface Element {
  id: string;
  type: ElementType;
  src?: string; // For images and icons
  text?: string; // For text
  shape?: "circle" | "square" | "triangle" | "polygon" | "line"; // For shapes
  x: number;
  y: number;
  rotate: number;
  width: number;
  height: number;
  zIndex: number; // For layer management
}

export interface Sticker {
  id: number;
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export const CAMERA_WIDTH = 600;
export const CAMERA_HEIGHT = 450;

export interface Photo {
  id: string;
  url: string;
}
