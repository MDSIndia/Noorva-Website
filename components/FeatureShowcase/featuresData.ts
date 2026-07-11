import { Compass, MessageCircle, CalendarCheck, HeartHandshake, type LucideIcon } from "lucide-react";

export type Side = "left" | "right";

// CSS custom properties aren't resolvable inside WebGL materials — this
// mirrors the literal hex values from app/globals.css's :root block. Shared
// here (rather than defined inline in PhoneModel.tsx, where it originated)
// since Podium.tsx now needs the same mapping to recolor its glow to match
// whichever feature's phone is currently active/incoming.
export const ACCENT_HEX: Record<string, string> = {
  "var(--accent-1)": "#7c5cfc",
  "var(--accent-2)": "#4fa8d5",
  "var(--accent-warm)": "#e8b478",
};

export interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  accent: string;
  textSide: Side;
  /** Full-screen mockup shown on the 3D phone's display for this feature. */
  screenImage: string;
}

export const FEATURES: Feature[] = [
  {
    icon: Compass,
    title: "Guide",
    body: "Sees the path forward when a decision feels too big to hold alone.",
    accent: "var(--accent-2)",
    textSide: "left",
    screenImage: "/features/guide.png?v=2",
  },
  {
    icon: MessageCircle,
    title: "Mentor",
    body: "Grows your thinking, one honest conversation at a time.",
    accent: "var(--accent-1)",
    textSide: "right",
    screenImage: "/features/mentor.png?v=2",
  },
  {
    icon: CalendarCheck,
    title: "Planner",
    body: "Turns scattered intentions into a plan you'll actually follow.",
    accent: "var(--accent-warm)",
    textSide: "left",
    screenImage: "/features/planner.png?v=2",
  },
  {
    icon: HeartHandshake,
    title: "Companion",
    body: "Present for the everyday moments, remembering what matters.",
    accent: "var(--accent-warm)",
    textSide: "right",
    screenImage: "/features/companion.png?v=2",
  },
];
