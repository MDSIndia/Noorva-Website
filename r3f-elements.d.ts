import { ThreeElement, ThreeElements } from "@react-three/fiber";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";

// meshline's MeshLineGeometry/MeshLineMaterial are registered as JSX
// intrinsics via extend() (see PlannerConstruct.tsx) — that only makes
// them usable at runtime, TypeScript still needs these declared here to
// accept <meshLineGeometry>/<meshLineMaterial> tags.
interface MeshlineElements {
  meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
  meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements, MeshlineElements {}
  }
}
