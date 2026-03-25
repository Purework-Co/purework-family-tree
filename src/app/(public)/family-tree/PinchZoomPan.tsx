"use client";

import { useRef, useEffect, ReactNode } from "react";
import { create } from "pinch-zoom-pan";

interface Props {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function PinchZoomPan({ children, className, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const content = container.firstElementChild as HTMLElement;
    if (!content) return;

    const canvas = create({
      element: container,
      minZoom: 0.1,
      maxZoom: 3,
      captureWheel: true,
    });

    return () => {
      canvas.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        cursor: "grab",
        touchAction: "none",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}
