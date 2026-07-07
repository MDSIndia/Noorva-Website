"use client";

import { forwardRef, type Ref } from "react";
import phoneFrame from "@/assets/images/iphone-14-3d-frame.jpg";

interface PhoneFrameProps {
  children: React.ReactNode;
  /** CSS color value for the ambient glow ring — swapped per active feature. */
  glowColor?: string;
  /** Attached to the screen-viewport container so it can be faded out while the chrome is mid-rotation (its fixed screen crop no longer lines up with a turned frame). */
  screenWrapRef?: Ref<HTMLDivElement>;
}

// The source render's 720x720 canvas has generous empty margin around the
// device itself. These boxes (measured by hand against the extracted frame
// via a pixel-grid overlay) crop tightly to the phone's outer bezel, and to
// its display glass within that, so the container below maps 1:1 onto the
// physical phone instead of a mostly-empty square.
const CROP = { left: 205, top: 27, width: 313, height: 651 }; // bezel, within the 720x720 source
const SCREEN = { left: 21, top: 36, width: 274, height: 593 }; // display glass, within CROP
const NOTCH = { left: 115, top: 31, width: 80, height: 22 }; // pill cutout, within CROP

const bgSizeX = (720 / CROP.width) * 100;
const bgSizeY = (720 / CROP.height) * 100;
const bgPosX = (CROP.left / (720 - CROP.width)) * 100;
const bgPosY = (CROP.top / (720 - CROP.height)) * 100;

const chromeStyle: React.CSSProperties = {
  // Set from a CSS custom property (defaulted on the outer container below)
  // rather than a literal url() — this is what useFeatureAnimation.ts swaps
  // frame-by-frame as the phone turns, without needing a second ref.
  backgroundImage: "var(--phone-frame-bg)",
  backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
  backgroundPosition: `${bgPosX}% ${bgPosY}%`,
  backgroundRepeat: "no-repeat",
  // The source frame renders on a pure-black canvas — screen-blending it
  // onto our near-black page background makes that canvas read as
  // transparent while leaving the phone's own bright pixels untouched.
  mixBlendMode: "screen",
};

const screenPct = {
  left: (SCREEN.left / CROP.width) * 100,
  top: (SCREEN.top / CROP.height) * 100,
  width: (SCREEN.width / CROP.width) * 100,
  height: (SCREEN.height / CROP.height) * 100,
};

// clip-path inset() edges, as percentages of the full cropped bezel.
const notchClip = {
  top: (NOTCH.top / CROP.height) * 100,
  right: 100 - ((NOTCH.left + NOTCH.width) / CROP.width) * 100,
  bottom: 100 - ((NOTCH.top + NOTCH.height) / CROP.height) * 100,
  left: (NOTCH.left / CROP.width) * 100,
};

const PhoneFrame = forwardRef<HTMLDivElement, PhoneFrameProps>(function PhoneFrame(
  { children, glowColor = "var(--accent-1)", screenWrapRef },
  ref
) {
  return (
    <div
      ref={ref}
      className="relative w-[240px] shrink-0 sm:w-[280px] lg:w-[320px] will-change-transform"
      style={
        {
          aspectRatio: `${CROP.width} / ${CROP.height}`,
          "--phone-frame-bg": `url(${phoneFrame.src})`,
        } as React.CSSProperties
      }
    >
      {/* Ambient glow ring, color echoes the active feature */}
      <div
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[60px] opacity-60 blur-[60px] transition-colors duration-700"
        style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }}
      />

      {/* Phone body + bezel, cropped from the source 3D render */}
      <div className="absolute inset-0" style={chromeStyle} />

      {/* Screen viewport — screen variants stack absolute inset-0 inside here.
          Faded out by useFeatureAnimation while the chrome is mid-turn, since
          this fixed crop only lines up with the frontal-facing frame. */}
      <div
        ref={screenWrapRef}
        className="absolute overflow-hidden rounded-[16px] bg-black sm:rounded-[19px] lg:rounded-[22px]"
        style={{
          left: `${screenPct.left}%`,
          top: `${screenPct.top}%`,
          width: `${screenPct.width}%`,
          height: `${screenPct.height}%`,
        }}
      >
        {children}
      </div>

      {/* Notch, redrawn on top so it stays visible over the screen content */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          ...chromeStyle,
          clipPath: `inset(${notchClip.top}% ${notchClip.right}% ${notchClip.bottom}% ${notchClip.left}% round 50%)`,
        }}
      />
    </div>
  );
});

export default PhoneFrame;
