"use client";

import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useEffect, useState } from "react";

export default function PostFX() {
  const { gl } = useThree();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let ok = false;
    try {
      if (!gl) throw new Error("no-gl");
      // WebGLRenderer.getContext() may throw if context not ready
      const ctx = (gl as any).getContext?.();
      const attrs = ctx?.getContextAttributes?.();
      // If getContextAttributes returns null (context lost) or undefined, bail out.
      if (!ctx || attrs === null) ok = false;
      else ok = true;
    } catch (e) {
      ok = false;
    }
    setEnabled(ok);
  }, [gl]);

  if (!enabled) return null;

  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.72} luminanceSmoothing={0.8} intensity={0.7} mipmapBlur />
    </EffectComposer>
  );
}
