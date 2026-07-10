"use client";

import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

// Validated in the Phase 0b spike (app/debug-curl, now removed): an
// arc-length-preserving cylindrical bend (not a naive angle-proportional-to-
// distance shear, which stretches/shears the texture) — bend first in local
// space using the flat/undeformed vertex position, then apply the rigid
// hinge rotation to the bent result, so "distance from spine" is always
// measured correctly. Normals are the cylinder's closed-form analytic
// tangent, not numerical epsilon-offset sampling.
const CurlPageMaterial = shaderMaterial(
  {
    uProgress: 0,
    uPageWidth: 1,
    uMaxBend: 2.3,
    uEndRotation: THREE.MathUtils.degToRad(92),
    // The current CSS version pivots a forward turn on the page's LEFT edge
    // (transformOrigin "left center") and a backward turn on its RIGHT edge
    // — turning "back" hinges on the opposite side, not a literal physical
    // book but a deliberate, already-tuned UI convention kept here as-is.
    // +1 = hinge at local x=0 (geometry's natural orientation), -1 = mirrors
    // the same math so the hinge reads as the opposite edge instead.
    uDirection: 1,
    uMap: null,
    uOpacity: 1,
  },
  /* glsl */ `
    uniform float uProgress;
    uniform float uPageWidth;
    uniform float uMaxBend;
    uniform float uEndRotation;
    uniform float uDirection;
    varying vec2 vUv;
    varying vec3 vNormalW;

    void main() {
      vUv = uv;

      // Same monotonic arc StoryGallerySection.tsx already uses for its
      // page-turn lift (Math.sin(progress * PI/2)) — peaks right as the
      // page reaches edge-on (progress=1), where a real page bows the most
      // just before it's lost from view.
      float curlT = sin(uProgress * 1.5707963);
      float totalBend = curlT * uMaxBend;
      float safeBend = max(totalBend, 0.0001);

      // position.x spans [0, uPageWidth] in the geometry's own fixed local
      // space, regardless of direction — the hinge itself is at whichever
      // END of that range uDirection points to (0 for forward, uPageWidth
      // for backward), not just a sign-flipped version of position.x. Using
      // xLocal directly (the earlier, buggy approach) only flipped the bend
      // angle's sign for a given point without actually relocating which
      // end stays anchored, so the "backward" turn barely visibly bent at
      // all — this instead measures distance from the correct hinge end,
      // bends around that, then rotates around that SAME hinge point.
      float hingeX = uDirection > 0.0 ? 0.0 : uPageWidth;
      float d = abs(position.x - hingeX);
      float t = d / uPageWidth;
      float theta = t * safeBend;

      float R = uPageWidth / safeBend;
      // bendDir: which local-X direction the free end swings away from the
      // hinge in — +X for forward (hinge at 0), -X for backward (hinge at
      // uPageWidth, free end at 0) — exactly uDirection itself.
      float bendDir = uDirection;
      vec3 curledLocal = vec3(hingeX + bendDir * R * sin(theta), position.y, R * (1.0 - cos(theta)));

      vec3 bendTangent = vec3(bendDir * cos(theta), 0.0, sin(theta));
      vec3 heightTangent = vec3(0.0, 1.0, 0.0);
      vec3 curledNormal = normalize(cross(bendTangent, heightTangent));

      // Rigid hinge rotation pivots around the hinge point itself (hingeX),
      // not local x=0 — irrelevant for forward (hingeX already 0) but
      // required for backward, where the hinge sits at uPageWidth instead.
      float rigidAngle = uProgress * uEndRotation * -uDirection;
      float c = cos(rigidAngle);
      float s = sin(rigidAngle);
      float rx = curledLocal.x - hingeX;
      float rz = curledLocal.z;
      vec3 rotated = vec3(
        hingeX + rx * c + rz * s,
        curledLocal.y,
        -rx * s + rz * c
      );
      vec3 rotatedNormal = vec3(
        curledNormal.x * c + curledNormal.z * s,
        curledNormal.y,
        -curledNormal.x * s + curledNormal.z * c
      );

      vNormalW = normalize(normalMatrix * rotatedNormal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(rotated, 1.0);
    }
  `,
  /* glsl */ `
    uniform sampler2D uMap;
    uniform float uOpacity;
    varying vec2 vUv;
    varying vec3 vNormalW;

    void main() {
      vec4 tex = texture2D(uMap, vUv);
      vec3 lightDir = normalize(vec3(0.4, 0.5, 0.8));
      float diff = max(dot(vNormalW, lightDir), 0.0);
      vec3 color = tex.rgb * (0.55 + diff * 0.55);
      gl_FragColor = vec4(color, tex.a * uOpacity);
    }
  `
);
extend({ CurlPageMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    curlPageMaterial: {
      uProgress?: number;
      uPageWidth?: number;
      uMaxBend?: number;
      uEndRotation?: number;
      uDirection?: number;
      uMap?: THREE.Texture | null;
      uOpacity?: number;
      side?: THREE.Side;
      transparent?: boolean;
      ref?: React.Ref<THREE.ShaderMaterial>;
    };
  }
}

export default CurlPageMaterial;
