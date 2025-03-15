import { useEffect, useState } from "react";

export interface Gradient {
  id: string;
  // Linear gradient properties
  fillLinearGradientStartPoint?: { x: number; y: number };
  fillLinearGradientStartPointX?: number;
  fillLinearGradientStartPointY?: number;
  fillLinearGradientEndPoint?: { x: number; y: number };
  fillLinearGradientEndPointX?: number;
  fillLinearGradientEndPointY?: number;
  fillLinearGradientColorStops?: Array<number | string>;
  // Radial gradient properties
  fillRadialGradientStartPoint?: { x: number; y: number };
  fillRadialGradientStartPointX?: number;
  fillRadialGradientStartPointY?: number;
  fillRadialGradientEndPoint?: { x: number; y: number };
  fillRadialGradientEndPointX?: number;
  fillRadialGradientEndPointY?: number;
  fillRadialGradientStartRadius?: number;
  fillRadialGradientEndRadius?: number;
  fillRadialGradientColorStops?: Array<number | string>;
}

const gradients: Gradient[] = [
  {
    id: "radial-gradient",
    // Radial gradient properties
    fillRadialGradientStartPoint: { x: 100, y: 300 }, // Center (adjust dynamically in PhotoStrip)
    fillRadialGradientEndPoint: { x: 100, y: 300 }, // Same as start for uniform radial
    fillRadialGradientStartRadius: 0, // Start from center
    fillRadialGradientEndRadius: 300, // Adjust dynamically in PhotoStrip
    fillRadialGradientColorStops: [
      0, "#F8E8A2", // Light Yellow at center
      0.25, "#F5A623", // Orange
      0.5, "#D81E5B", // Magenta
      0.75, "#6B2D5C", // Purple
      1, "#2B59C3", // Blue at edge
    ],
  },
  {
    id: "instagram-gradient",
    fillLinearGradientColorStops: [
      0, "#F8E8A2", // Light Yellow at 0%
      0.25, "#F5A623", // Orange at 25%
      0.5, "#D81E5B", // Magenta at 50%
      0.75, "#6B2D5C", // Purple at 75%
      1, "#2B59C3", // Blue at 100%
    ],
    fillLinearGradientStartPoint: { x: 0, y: 0 },
    fillLinearGradientEndPoint: { x: 100, y: 100 },
  },
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

const GradientPicker = ({ gradient, onSelect }: GradientPickerProps) => {
  const [selectedGradient, setSelectedGradient] = useState<Gradient | undefined>(
    undefined
  );

  useEffect(() => {
    if (gradient) {
      setSelectedGradient(gradient);
    }
  }, [gradient]);

  const handleGradientSelect = (gradient: Gradient) => {
    if (selectedGradient?.id === gradient.id) {
      setSelectedGradient(undefined);
      onSelect(undefined);
    } else {
      setSelectedGradient(gradient);
      onSelect(gradient);
    }
  };

  // Generate CSS gradient string based on gradient type
  const getGradientStyle = (gradient: Gradient) => {
    if (gradient.fillRadialGradientColorStops) {
      // Use radial gradient for preview
      return {
        background: `radial-gradient(circle at ${gradient.fillRadialGradientStartPoint?.x}px ${gradient.fillRadialGradientStartPoint?.y}px, ${gradient.fillRadialGradientColorStops
          .map((value, index, arr) =>
            index % 2 === 0
              ? `${arr[index + 1]} ${Math.round((value as number) * 100)}%`
              : ""
          )
          .filter(Boolean)
          .join(", ")})`,
      };
    } else if (gradient.fillLinearGradientColorStops) {
      // Use linear gradient for preview
      return {
        background: `linear-gradient(45deg, ${gradient.fillLinearGradientColorStops
          .map((value, index, arr) =>
            index % 2 === 0
              ? `${arr[index + 1]} ${Math.round((value as number) * 100)}%`
              : ""
          )
          .filter(Boolean)
          .join(", ")})`,
      };
    }
    return { background: "transparent" };
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 40px)",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        {gradients.map((gradient, index) => (
          <div
            key={index}
            onClick={() => handleGradientSelect(gradient)}
            style={{
              width: "40px",
              height: "40px",
              cursor: "pointer",
              border:
                selectedGradient?.id === gradient.id
                  ? "2px solid blue"
                  : "2px solid white",
              borderRadius: "8px",
              ...getGradientStyle(gradient), // Apply the appropriate gradient style
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default GradientPicker;