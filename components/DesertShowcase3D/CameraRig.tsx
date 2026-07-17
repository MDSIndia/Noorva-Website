"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { desertFlightProgress } from "../store";
import { FLIGHT_CURVE, progressToT } from "./flightPath";

// How far ahead along the curve (as a fraction of its total length) the
// camera looks — a proper "flythrough" look-ahead rather than looking
// straight down its own direction of travel, which reads as flatter.
const LOOK_AHEAD = 0.03;

// How quickly the rendered camera catches up to the scroll-driven target
// position/look-at — a real camera dolly has mass and never teleports
// frame-to-frame, so this eases the actual render position toward the
// curve-sampled target instead of snapping to it directly. This is a
// second smoothing layer on top of GSAP's own scrub lag (see
// DesertShowcase3D.tsx) — that one smooths the scroll->progress mapping
// itself; this one smooths progress->camera-transform, which also
// absorbs small backward jitter from natural scroll-direction noise
// (trackpad micro-bounce, momentum-scroll overshoot) into a continuous
// glide instead of a visible per-frame snap-back. Lower than a typical
// UI-easing value on purpose — "drone footage / NASA rover movement,"
// per the brief, reads as noticeably heavier and slower to settle than
// a snappy interface transition would.
const POSITION_DAMPING = 3.2;
const LOOK_DAMPING = 2.7;

interface CameraRigProps {
  cameraRoll: boolean;
  reducedMotion: boolean;
}

export default function CameraRig({ cameraRoll, reducedMotion }: CameraRigProps) {
  const rollRef = useRef(0);
  const smoothedPosition = useRef<THREE.Vector3 | null>(null);
  const smoothedLook = useRef<THREE.Vector3 | null>(null);

  useFrame(({ camera, clock }, delta) => {
    if (reducedMotion) {
      // One fixed, calm framing for the whole section — no path, no roll,
      // no camera-follow. Matches the posture CosmicBackground.tsx/
      // StoryCinematic.tsx already take under prefers-reduced-motion.
      camera.position.set(0, 1.7, 5);
      camera.lookAt(0, 1.4, -6);
      // Cleared so re-entering motion later (e.g. the OS setting flips
      // mid-session) starts the glide fresh from wherever the camera
      // actually is, instead of easing from this stale fixed framing.
      smoothedPosition.current = null;
      smoothedLook.current = null;
      return;
    }

    const t = progressToT(desertFlightProgress.value);
    const targetPosition = FLIGHT_CURVE.getPointAt(t);
    const targetLook = FLIGHT_CURVE.getPointAt(Math.min(1, t + LOOK_AHEAD));

    if (!smoothedPosition.current || !smoothedLook.current) {
      // First frame — jump straight there rather than easing in from the
      // origin, which would otherwise play as an unwanted opening swoop.
      smoothedPosition.current = targetPosition.clone();
      smoothedLook.current = targetLook.clone();
    } else {
      smoothedPosition.current.x = THREE.MathUtils.damp(smoothedPosition.current.x, targetPosition.x, POSITION_DAMPING, delta);
      smoothedPosition.current.y = THREE.MathUtils.damp(smoothedPosition.current.y, targetPosition.y, POSITION_DAMPING, delta);
      smoothedPosition.current.z = THREE.MathUtils.damp(smoothedPosition.current.z, targetPosition.z, POSITION_DAMPING, delta);
      smoothedLook.current.x = THREE.MathUtils.damp(smoothedLook.current.x, targetLook.x, LOOK_DAMPING, delta);
      smoothedLook.current.y = THREE.MathUtils.damp(smoothedLook.current.y, targetLook.y, LOOK_DAMPING, delta);
      smoothedLook.current.z = THREE.MathUtils.damp(smoothedLook.current.z, targetLook.z, LOOK_DAMPING, delta);
    }

    camera.position.copy(smoothedPosition.current);
    camera.lookAt(smoothedLook.current);

    if (cameraRoll) {
      // A tiny continuous bank, damped toward a slow sine target — never
      // static, but small enough to read as "floating cinematic camera,"
      // not a banking aircraft. Applied as an additional local rotation
      // on top of the fresh lookAt orientation computed above
      // (recomputed from scratch every frame), so it never
      // accumulates/drifts.
      const elapsed = clock.getElapsedTime();
      const targetRoll = Math.sin(elapsed * 0.1) * 0.022;
      rollRef.current = THREE.MathUtils.damp(rollRef.current, targetRoll, 2.5, 1 / 60);
      camera.rotateZ(rollRef.current);
    }
  });

  return null;
}
