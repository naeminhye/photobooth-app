// constants.ts
export interface Layout {
  maxPhotos: number;
  width: number;
  height: number;
  arrangement: "vertical" | "horizontal" | "grid";
}

export const LAYOUTS: Record<number, Layout> = {
  1: { maxPhotos: 3, width: 3, height: 3, arrangement: "vertical" }, // 3x9" 3 Photo
  2: { maxPhotos: 4, width: 3, height: 2.25, arrangement: "vertical" }, // 3x9" 4 Photo
  3: { maxPhotos: 6, width: 6, height: 2.5, arrangement: "vertical" }, // 6x18" 6 Photo
  4: { maxPhotos: 1, width: 6, height: 18, arrangement: "vertical" }, // 6x18" Portrait Single Photo
  5: { maxPhotos: 1, width: 6, height: 18, arrangement: "horizontal" }, // 6x18" Landscape Single Photo
  6: { maxPhotos: 3, width: 6, height: 6, arrangement: "vertical" }, // 6x18" Triple Photo
  7: { maxPhotos: 3, width: 6, height: 6, arrangement: "vertical" }, // 6x18" 3 Photo (different)
  8: { maxPhotos: 3, width: 6, height: 6, arrangement: "vertical" }, // 6x18" 3 Photo (different)
  9: { maxPhotos: 4, width: 3, height: 4.5, arrangement: "grid" }, // 6x18" 4 Photo (2x2 grid)
  10: { maxPhotos: 2, width: 6, height: 9, arrangement: "vertical" }, // 6x18" 2 Photo (vertical)
  11: { maxPhotos: 2, width: 6, height: 9, arrangement: "horizontal" }, // 6x18" 2 Photo (horizontal)
};
