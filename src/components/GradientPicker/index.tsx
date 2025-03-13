import { useEffect, useState } from "react";

// Định nghĩa kiểu cho gradient
export interface Gradient {
  id: string;
  fillLinearGradientColorStops: [number, string, number, string]; // [vị trí, màu, vị trí, màu]
  fillLinearGradientStartPoint: { x: number; y: number };
  fillLinearGradientEndPoint: { x: number; y: number };
}

// Danh sách các gradient từ hình ảnh
const gradients: Gradient[] = [
  {
    id: "gradient-1",
    fillLinearGradientColorStops: [0, "#FCE38A", 1, "#F38181"],
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 100, y: 100 },
  },
  {
    id: "gradient-2",

    fillLinearGradientColorStops: [0, "#F54EA2", 1, "#FF7676"],
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 100, y: 100 },
  },
  {
    id: "gradient-3",

    fillLinearGradientColorStops: [0, "#17EAD9", 1, "#6078EA"],
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 100, y: 100 },
  },
  {
    id: "gradient-4",

    fillLinearGradientColorStops: [0, "#622774", 1, "#C53364"],
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 100, y: 100 },
  },
  {
    id: "gradient-5",

    fillLinearGradientColorStops: [0, "#7117EA", 1, "#EA6060"],
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 100, y: 100 },
  },
  {
    id: "gradient-6",
    fillLinearGradientColorStops: [0, "#42E695", 1, "#3BB2B8"],
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 100, y: 100 },
  },
  {
    id: "gradient-7",
    fillLinearGradientColorStops: [0, "#F02FC2", 1, "#6094EA"],
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 100, y: 100 },
  },
  {
    id: "gradient-8",

    fillLinearGradientColorStops: [0, "#65799B", 1, "#5E2563"],
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 100, y: 100 },
  },
  {
    id: "gradient-9",
    fillLinearGradientColorStops: [0, "#184E68", 1, "#57CA85"],
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 100, y: 100 },
  },
  {
    id: "gradient-10",
    fillLinearGradientColorStops: [0, "#5B247A", 1, "#1BCEDF"],
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 100, y: 100 },
  },
];

export interface GradientPickerProps {
  gradient?: Gradient | null;
  onSelect: (gradient?: Gradient) => void;
}

// Component chính
const GradientPicker = ({ gradient, onSelect }: GradientPickerProps) => {
  // State để lưu gradient đã chọn
  const [selectedGradient, setSelectedGradient] = useState<
    Gradient | undefined
  >(undefined);

  useEffect(
    () => {
      if (gradient) {
        setSelectedGradient(gradient);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gradient]
  );

  const handleGradientSelect = (gradient: Gradient) => {
    if (selectedGradient?.id === gradient.id) {
      setSelectedGradient(undefined);
      onSelect(undefined);
    } else {
      setSelectedGradient(gradient);
      onSelect(gradient);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 100px)",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        {gradients.map((gradient, index) => (
          <div
            key={index}
            onClick={() => handleGradientSelect(gradient)}
            style={{
              width: "100px",
              height: "100px",
              background: `linear-gradient(45deg, ${gradient.fillLinearGradientColorStops[1]}, ${gradient.fillLinearGradientColorStops[3]})`,
              cursor: "pointer",
              border:
                selectedGradient === gradient
                  ? "2px solid blue"
                  : "2px solid white",
              borderRadius: "8px",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default GradientPicker;
