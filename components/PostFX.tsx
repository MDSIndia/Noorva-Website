"use client";

import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Component, type ReactNode } from "react";

// EffectComposer.addPass reads renderer.getContext().getContextAttributes().alpha
// with no null-guard of its own — if the WebGL context is lost between our
// own readiness check below and this component actually mounting, that read
// throws and would otherwise take the whole Canvas down with it. Catching it
// here just drops bloom instead, which is a fine trade for a context hiccup.
class PostFXBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function PostFX() {
  const { gl } = useThree();

  // gl.getContext() and getContextAttributes() can both throw/return null
  // if the WebGL context isn't ready or has been lost — checked directly
  // during render (not via an effect+state round trip) since the context
  // is already available synchronously through useThree() by this point.
  let enabled = false;
  try {
    const ctx = gl.getContext();
    enabled = !!ctx?.getContextAttributes?.();
  } catch {
    enabled = false;
  }

  if (!enabled) return null;

  return (
    <PostFXBoundary>
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.62} luminanceSmoothing={0.85} intensity={0.95} mipmapBlur />
      </EffectComposer>
    </PostFXBoundary>
  );
}
