// constants.ts
export interface Layout {
  maxPhotos: number;
  width: number;
  height: number;
  arrangement: "vertical" | "horizontal" | "grid";
  unit: "px" | "in";
  gap?: number | string;
}

export const LAYOUTS: Record<number, Layout> = {
  1: {
    maxPhotos: 4,
    width: 3,
    height: 9,
    arrangement: "vertical",
    unit: "in",
    gap: 0.1,
  },
  2: { maxPhotos: 3, width: 3, height: 9, arrangement: "vertical", unit: "in" },
  3: {
    maxPhotos: 2,
    width: 3,
    height: 9,
    arrangement: "vertical",
    unit: "in",
    gap: 0.1,
  },
  // 4: {
  //   maxPhotos: 3,
  //   width: 9,
  //   height: 3,
  //   arrangement: "horizontal",
  //   unit: "in",
  // },
  // 5: { maxPhotos: 4, width: 6, height: 9, arrangement: "grid", unit: "in" },
  // 6: { maxPhotos: 2, width: 9, height: 6, arrangement: "grid", unit: "in" },
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
