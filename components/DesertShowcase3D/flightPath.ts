import * as THREE from "three";
import { PROXY_MAX } from "./sceneVisibility";

// 6 waypoints (pre-start, one per feature, finale pull-back/up) forming a
// gently undulating path — the camera flies forward mostly along -Z, with
// small X/Y sway baked into the control points themselves so it never
// reads as a straight rail. These points are NOT required to land exactly
// on the scroll proxy's p=0/1/2/3 values — see progressToT() below, which
// maps proxy scroll -> normalized curve position by simple arc-length
// division. Every consumer (CameraRig, feature construct anchors) uses
// that same mapping, so the camera and each scene's construct always
// agree on "where" a given p value is, regardless of how these raw
// control points happen to be spaced.
const WAYPOINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 1.6, 4), // pre-start — resting position before scroll begins
  new THREE.Vector3(-1.2, 1.9, -10), // Guide
  new THREE.Vector3(1.6, 1.4, -26), // Mentor
  new THREE.Vector3(-1.8, 2.3, -44), // Planner
  new THREE.Vector3(1.2, 1.7, -64), // Companion
  new THREE.Vector3(0, 3.4, -82), // finale pull-back/up
];

// "centripetal" (not the "catmullrom"/uniform variant this used to pass)
// — uniform Catmull-Rom parameterization can overshoot at uneven/sharp
// turns and briefly loop or reverse direction between control points;
// centripetal (Barry & Goldman) is specifically built to avoid exactly
// that, which matters here since the waypoints above zigzag in X while
// dropping fairly evenly in Z. Confirmed via screenshot comparison this
// was producing a perceptible backward flicker in the camera's forward
// travel around the sharper turns.
export const FLIGHT_CURVE = new THREE.CatmullRomCurve3(WAYPOINTS, false, "centripetal");

// Proxy scroll value (0..PROXY_MAX) -> normalized [0,1] position along the
// flight curve.
export function progressToT(p: number): number {
  return Math.max(0, Math.min(1, p / PROXY_MAX));
}

// How far past a feature's own home scroll position (in the same units
// as desertFlightProgress.value) its construct is anchored ahead of. A
// construct anchored at exactly featureIndex sits right where the CAMERA
// itself is by the time presence(featureIndex, p) reaches full strength
// — meaning for the back half of its "fully visible" window the camera
// has already flown past that point and the construct ends up beside or
// behind the camera instead of ahead of it (confirmed via screenshot: at
// p=0 exactly, the Guide construct was completely out of frame). Leading
// the anchor by this much keeps it generally ahead of the camera through
// most of the presence window instead.
export const ANCHOR_LEAD = 0.32;

// World-space anchor for a given feature index's construct — sampled
// ANCHOR_LEAD ahead of where the camera itself is when
// desertFlightProgress.value === featureIndex (see ANCHOR_LEAD above),
// offset sideways/up so the camera's own path doesn't fly straight
// through the construct's mesh.
export function featureAnchor(featureIndex: number, lateral: number, vertical = 0): THREE.Vector3 {
  const t = progressToT(featureIndex + ANCHOR_LEAD);
  const point = FLIGHT_CURVE.getPointAt(t);
  const tangent = FLIGHT_CURVE.getTangentAt(t);
  // Perpendicular to the tangent within the XZ (ground) plane.
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  return point.clone().addScaledVector(side, lateral).add(new THREE.Vector3(0, vertical, 0));
}
