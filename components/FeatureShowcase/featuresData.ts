import { Compass, MessageCircle, CalendarCheck, HeartHandshake, type LucideIcon } from "lucide-react";
import GuideScreen from "./GuideScreen";
import MentorScreen from "./MentorScreen";
import PlannerScreen from "./PlannerScreen";
import CompanionScreen from "./CompanionScreen";

export type Side = "left" | "right";

export interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  Screen: typeof GuideScreen;
  accent: string;
  textSide: Side;
}

export const FEATURES: Feature[] = [
  {
    icon: Compass,
    title: "Guide",
    body: "Sees the path forward when a decision feels too big to hold alone.",
    Screen: GuideScreen,
    accent: "var(--accent-2)",
    textSide: "left",
  },
  {
    icon: MessageCircle,
    title: "Mentor",
    body: "Grows your thinking, one honest conversation at a time.",
    Screen: MentorScreen,
    accent: "var(--accent-1)",
    textSide: "right",
  },
  {
    icon: CalendarCheck,
    title: "Planner",
    body: "Turns scattered intentions into a plan you'll actually follow.",
    Screen: PlannerScreen,
    accent: "var(--accent-warm)",
    textSide: "left",
  },
  {
    icon: HeartHandshake,
    title: "Companion",
    body: "Present for the everyday moments, remembering what matters.",
    Screen: CompanionScreen,
    accent: "var(--accent-warm)",
    textSide: "right",
  },
];
