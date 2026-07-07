import { Compass, MessageCircle, CalendarCheck, HeartHandshake, type LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import { GuideArt, MentorArt, PlannerArt, CompanionArt } from "./FeatureArt";

export type Side = "left" | "right";

export interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  Art: ComponentType;
  accent: string;
  textSide: Side;
}

export const FEATURES: Feature[] = [
  {
    icon: Compass,
    title: "Guide",
    body: "Sees the path forward when a decision feels too big to hold alone.",
    Art: GuideArt,
    accent: "var(--accent-2)",
    textSide: "left",
  },
  {
    icon: MessageCircle,
    title: "Mentor",
    body: "Grows your thinking, one honest conversation at a time.",
    Art: MentorArt,
    accent: "var(--accent-1)",
    textSide: "right",
  },
  {
    icon: CalendarCheck,
    title: "Planner",
    body: "Turns scattered intentions into a plan you'll actually follow.",
    Art: PlannerArt,
    accent: "var(--accent-warm)",
    textSide: "left",
  },
  {
    icon: HeartHandshake,
    title: "Companion",
    body: "Present for the everyday moments, remembering what matters.",
    Art: CompanionArt,
    accent: "var(--accent-warm)",
    textSide: "right",
  },
];
