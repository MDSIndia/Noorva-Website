import * as THREE from "three";

/** A rectangle rounded only at its four corners — flat edges in between,
 *  unlike RoundedBox's uniformly-rounded "pill" silhouette. This is the
 *  actual shape of a modern iPhone's rail (and its screen) when viewed
 *  face-on. Shared by the body/screen meshes and the on-screen feature
 *  image so they always trace the exact same outline. */
export function roundedRectShape(w: number, h: number, r: number) {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  shape.closePath();
  return shape;
}
