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
    // +1 = forward turn, -1 = backward turn. Both hinge at the SAME edge
    // (local x=0 — the spine, matching PageMesh's fixed world position) —
    // a real book has exactly one spine, and every page pivots on it
    // regardless of direction. uDirection only flips which rotational sense
    // the page swings in around that fixed hinge (see rigidAngle below).
    // An earlier version hinged backward turns at the FORE-edge instead
    // (inherited unchanged from the old CSS version's own transformOrigin
    // convention) — looked fine for ordinary backward chapter navigation,
    // but made the spine edge itself the one that visibly swings/moves,
    // which reads as wrong specifically for the book-closing flip: the
    // motion appeared to originate from the spine side instead of hinging
    // on it, the opposite of how a real book closes shut.
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
      // space — the hinge is always local x=0 (the spine), for both
      // directions, matching PageMesh's own fixed mesh position (see the
      // uDirection doc comment above for why). Distance from the spine is
      // therefore just position.x itself, unconditionally.
      float d = position.x;
      float t = d / uPageWidth;
      float theta = t * safeBend;

      float R = uPageWidth / safeBend;
      // The bend always bows the free end outward in the same local sense,
      // regardless of direction — the page's OWN curl is a property of the
      // page bowing away from its spine, not of which way it's being swung
      // (that's rigidAngle's job, below).
      vec3 curledLocal = vec3(R * sin(theta), position.y, R * (1.0 - cos(theta)));

      vec3 bendTangent = vec3(cos(theta), 0.0, sin(theta));
      vec3 heightTangent = vec3(0.0, 1.0, 0.0);
      vec3 curledNormal = normalize(cross(bendTangent, heightTangent));

      // Rigid hinge rotation pivots around the spine (local x=0) for both
      // directions now — only its SIGN differs, swinging the page in
      // opposite rotational senses around that one fixed hinge.
      float rigidAngle = uProgress * uEndRotation * -uDirection;
      float c = cos(rigidAngle);
      float s = sin(rigidAngle);
      float rx = curledLocal.x;
      float rz = curledLocal.z;
      vec3 rotated = vec3(
        rx * c + rz * s,
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
