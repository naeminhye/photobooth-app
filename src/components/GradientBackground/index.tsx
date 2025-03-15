// components/GradientBackground/index.tsx
import React, { useMemo } from "react";
import "./styles.css";

interface GradientBackgroundProps {
  maxStar?: number;
  minStar?: number;
}

const GradientBackground: React.FC = ({
  maxStar = 8,
  minStar = 3,
}: GradientBackgroundProps) => {
  // Generate a random number of stars between 3 and 8
  const starCount = useMemo(
    () => Math.floor(Math.random() * (maxStar - minStar + 1)) + minStar,
    [maxStar, minStar]
  );

  // Generate star elements with random positions and sizes
  const stars = useMemo(() => {
    const starArray = [];
    for (let i = 0; i < starCount; i++) {
      const size = Math.random() * (25 - 10) + 10; // Random size between 10px and 25px
      const top = Math.random() * 80 + 10; // Random top position between 10% and 90%
      const left = Math.random() * 80 + 10; // Random left position between 10% and 90%
      starArray.push(
        <div
          key={i}
          className="star"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            top: `${top}%`,
            left: `${left}%`,
          }}
        />
      );
    }
    return starArray;
  }, [starCount]);

  return <div className="gradient-background">{stars}</div>;
};

export default GradientBackground;
