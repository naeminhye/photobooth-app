// constants/index.ts
import basic4Cut from "../assets/illustrators/basic-4-cut.png";
import basic6Cut from "../assets/illustrators/basic-6-cut.png";
import film3Cut from "../assets/illustrators/film-3-cut.png";
import wide4Cut from "../assets/illustrators/wide-4-cut.png";
import rizz4Cut from "../assets/illustrators/rizz-4-cut.png";

export const SUPPORTED_FORMATS = [".png", ".jpg", ".jpeg", ".svg", ".gif"];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const MAX_PHOTOS = 10;

// Define element types
export type ElementType = "image" | "text" | "shape" | "icon";
export interface Element {
  id: string;
  type: ElementType;
  src?: string;
  text?: string;
  shape?: "circle" | "square" | "triangle" | "polygon" | "line";
  x: number;
  y: number;
  rotate: number;
  width: number;
  height: number;
  zIndex: number;
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

//////////////////////////////////////////////////////////////////////////////

export interface Canvas {
  width: number;
  height: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasData {
  name: string;
  canvas: Canvas;
  rectangles: Rectangle[];
  templatePath: string;
}

export const NEW_LAYOUT: CanvasData[] = [
  {
    name: "basic 4-cut",
    canvas: {
      width: 854,
      height: 2532,
    },
    rectangles: [
      { x: 68, y: 140, width: 712, height: 572 },
      { x: 68, y: 724, width: 712, height: 572 },
      { x: 68, y: 1309, width: 712, height: 572 },
      { x: 68, y: 1896, width: 712, height: 572 },
    ],
    templatePath: basic4Cut,
  },
  // Basic 4 cut: 1652 x 4920
  // {
  //   name: "basic 4-cut",
  //   canvas: {
  //     width: 1080,
  //     height: 1612,
  //   },
  //   rectangles: [
  //     { x: 44, y: 90, width: 452, height: 363 },
  //     { x: 44, y: 461, width: 452, height: 363 },
  //     { x: 44, y: 833, width: 452, height: 363 },
  //     { x: 44, y: 1206, width: 452, height: 363 },
  //   ],
  //   templatePath: basic4Cut,
  // },
  {
    name: "basic 6-cut",
    canvas: {
      width: 1207,
      height: 1800,
    },
    rectangles: [
      { x: 60, y: 131, width: 535, height: 517 },
      { x: 615, y: 149, width: 535, height: 517 },
      { x: 49, y: 667, width: 535, height: 517 },
      { x: 603, y: 684, width: 535, height: 517 },
      { x: 58, y: 1202, width: 535, height: 517 },
      { x: 612, y: 1221, width: 535, height: 517 },
    ],
    templatePath: basic6Cut,
  },
  {
    name: "film 3-cut",
    canvas: {
      width: 1800,
      height: 603,
    },
    rectangles: [
      { x: 41, y: 111, width: 565, height: 450 },
      { x: 618, y: 111, width: 565, height: 450 },
      { x: 1194, y: 111, width: 565, height: 450 },
    ],
    templatePath: film3Cut,
  },
  {
    name: "wide 4-cut",
    canvas: {
      width: 1207,
      height: 1800,
    },
    rectangles: [
      { x: 52, y: 108, width: 544, height: 750 },
      { x: 612, y: 108, width: 544, height: 750 },
      { x: 52, y: 965, width: 544, height: 750 },
      { x: 612, y: 965, width: 544, height: 750 },
    ],
    templatePath: wide4Cut,
  },
  {
    name: "rizz 4-cut",
    canvas: { width: 1080, height: 1347 },
    rectangles: [
      { x: 136, y: 164, width: 388, height: 556 },
      { x: 555, y: 46, width: 388, height: 556 },
      { x: 136, y: 756, width: 388, height: 556 },
      { x: 555, y: 638, width: 388, height: 556 },
    ],
    templatePath: rizz4Cut,
  },
];
//   name: "layer 4-cut",
