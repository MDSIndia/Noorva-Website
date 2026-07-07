"use client";

import { forwardRef, type Ref } from "react";
import PhoneFrame from "./PhoneFrame";

interface Phone3DProps {
  children: React.ReactNode;
  glowColor?: string;
  className?: string;
  screenWrapRef?: Ref<HTMLDivElement>;
}

// Perspective must live on a static ancestor of the node GSAP transforms —
// putting it on the animated node itself breaks rotateX/rotateY depth cues.
// This component owns that boundary: `ref` always points at the transform
// target, `className` positions the static perspective wrapper around it.
const Phone3D = forwardRef<HTMLDivElement, Phone3DProps>(function Phone3D(
  { children, glowColor, className, screenWrapRef },
  ref
) {
  return (
    <div className={className} style={{ perspective: 1400 }}>
      <PhoneFrame ref={ref} glowColor={glowColor} screenWrapRef={screenWrapRef}>
        {children}
      </PhoneFrame>
    </div>
  );
});

export default Phone3D;
