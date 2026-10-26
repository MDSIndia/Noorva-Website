"use client";

// "See Noorva in Action" — a wider, desktop-style conversation demo (in
// addition to the phone-mockup chat in the hero), plus a small "at a
// glance" status panel. One card, switchable between a few different
// example requests via tabs — rather than stacking separate demo cards —
// so the section stays a single focused moment. Illustrative content, not
// a live product screenshot.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Globe,
  CalendarClock,
  RotateCw,
  BookOpen,
  Lock,
  User,
  GraduationCap,
  Laptop2,
  Sandwich,
  ShoppingBag,
  Dumbbell,
  CalendarCheck,
  ListChecks,
  Battery,
  CircleCheck,
  PhoneCall,
  Gift,
  Bell,
  TrendingUp,
  Rocket,
  Target,
  type LucideIcon,
} from "lucide-react";
import PageSection from "./ui/PageSection";
import SectionHeading from "./ui/SectionHeading";
import Card from "./ui/Card";

const TRAITS = [
  { icon: Sparkles, label: "Understands context" },
  { icon: Globe, label: "Checks your world" },
  { icon: CalendarClock, label: "Plans intelligently" },
  { icon: RotateCw, label: "Follows up & adapts" },
  { icon: BookOpen, label: "Remembers what matters" },
  { icon: Lock, label: "Respects your privacy" },
];

interface DemoItem {
  icon: LucideIcon;
  meta: string;
  label: string;
}
interface GlanceItem {
  icon: LucideIcon;
  label: string;
  value: string;
}
interface DemoExample {
  tab: string;
  userMessage: string;
  intro: string;
  items: DemoItem[];
  outro: string;
  glance: GlanceItem[];
}

const EXAMPLES: DemoExample[] = [
  {
    tab: "Plan my day",
    userMessage:
      "I have a busy day today. I need to drop my sister at college, finish a project, go to the gym and buy groceries.",
    intro: "Got it. Here's a smart plan for your day:",
    items: [
      { icon: GraduationCap, meta: "07:30 AM", label: "Drop your sister at college" },
      { icon: Laptop2, meta: "08:30 AM", label: "Deep work: finish your project" },
      { icon: Sandwich, meta: "12:30 PM", label: "Lunch break" },
      { icon: ShoppingBag, meta: "01:00 PM", label: "Grocery shopping (near your place)" },
      { icon: Dumbbell, meta: "06:00 PM", label: "Gym — 45 min workout" },
      { icon: CalendarCheck, meta: "07:30 PM", label: "Review & plan for tomorrow" },
    ],
    outro:
      "I've set reminders, blocked focus time for your project, and added traffic-aware travel time. Shall I reschedule if anything changes?",
    glance: [
      { icon: ListChecks, label: "Today's Focus", value: "Finish project" },
      { icon: CalendarClock, label: "Next Task", value: "Drop sister at college in 25 mins" },
      { icon: ShoppingBag, label: "Grocery List", value: "12 items" },
      { icon: Battery, label: "Energy Level", value: "Optimal · 82%" },
      { icon: CircleCheck, label: "Daily Progress", value: "3 / 6 completed" },
    ],
  },
  {
    tab: "Remember something",
    userMessage: "Remind me to call the vet before Friday, and don't let me forget mom's birthday next week.",
    intro: "Done — I'll keep track of both:",
    items: [
      { icon: PhoneCall, meta: "By Friday", label: "Call the vet" },
      { icon: Gift, meta: "Next Tuesday", label: "Mom's birthday — pick a gift" },
      { icon: Bell, meta: "Ongoing", label: "Nudge you the day before each" },
    ],
    outro: "I'll check in if either one is still pending closer to the date.",
    glance: [
      { icon: ListChecks, label: "Reminders Set", value: "2" },
      { icon: CalendarClock, label: "Next Reminder", value: "Call the vet · Thursday" },
      { icon: Gift, label: "Upcoming", value: "Mom's birthday · 6 days" },
      { icon: CircleCheck, label: "Missed This Week", value: "0" },
    ],
  },
  {
    tab: "Help me decide",
    userMessage:
      "I'm deciding between two job offers — one pays more, the other has better growth. Help me think it through.",
    intro: "Based on what matters most to you, here's a quick breakdown:",
    items: [
      { icon: TrendingUp, meta: "Offer A", label: "Higher pay, slower growth path" },
      { icon: Rocket, meta: "Offer B", label: "Lower pay, faster growth & mentorship" },
      { icon: Target, meta: "Your priority", label: "You've said long-term growth matters more" },
    ],
    outro: "Want me to save this as a decision framework for next time?",
    glance: [
      { icon: ListChecks, label: "Decision", value: "Job offer" },
      { icon: TrendingUp, label: "Leaning Toward", value: "Offer B" },
      { icon: Target, label: "Key Factor", value: "Long-term growth" },
      { icon: CircleCheck, label: "Saved For Later", value: "Yes" },
    ],
  },
];

export default function CompanionDemoSection() {
  const [active, setActive] = useState(0);
  const ex = EXAMPLES[active];

  return (
    <PageSection id="companion-demo">
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <SectionHeading
            eyebrow="See Noorva In Action"
            title="From thought to action."
            accent="In seconds."
            description="Noorva understands your natural language, your context and your world — then turns it into clarity and action."
          />
          <div className="mt-10 flex flex-col gap-3">
            {TRAITS.map((t, i) => {
              const Icon = t.icon;
              return (
                <motion.div
                  key={t.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.06 }}
                  className="flex items-center gap-3 rounded-xl glass px-4 py-3"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[color:var(--ink)]" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-[color:var(--ink)]">{t.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8">
          {/* Example switcher — same demo card, different requests */}
          <div className="mb-5 flex flex-wrap gap-2">
            {EXAMPLES.map((e, i) => (
              <button
                key={e.tab}
                type="button"
                onClick={() => setActive(i)}
                className="rounded-full px-4 py-2 text-xs font-medium tracking-[0.02em] transition-all duration-300"
                style={
                  i === active
                    ? { backgroundImage: "var(--accent-gradient)", color: "#fff" }
                    : { border: "1px solid var(--line)", color: "var(--ink-soft)" }
                }
              >
                {e.tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Card className="md:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={ex.tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="p-4 sm:p-6 md:p-8"
                >
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full glass-soft">
                      <User className="h-4 w-4 text-[color:var(--ink)]" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 rounded-2xl rounded-tl-sm glass-soft px-4 py-3 text-sm leading-relaxed text-[color:var(--ink)]">
                      {ex.userMessage}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundImage: "var(--accent-gradient)" }}
                    >
                      <Sparkles className="h-4 w-4 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="w-full min-w-0">
                      <p className="mb-3 text-sm font-medium text-[color:var(--ink)]">{ex.intro}</p>
                      <div className="flex flex-col gap-2">
                        {ex.items.map((s) => {
                          const Icon = s.icon;
                          return (
                            <div
                              key={s.label}
                              className="flex items-center gap-3 rounded-xl border border-[color:var(--line)] px-3.5 py-2.5"
                            >
                              <Icon className="h-4 w-4 shrink-0 text-[color:var(--ink-soft)]" strokeWidth={1.5} />
                              <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                                <span className="shrink-0 text-xs font-medium text-[color:var(--ink-faint)] sm:w-28">{s.meta}</span>
                                <span className="text-sm text-[color:var(--ink)]">{s.label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-[color:var(--ink-soft)]">{ex.outro}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </Card>

            <Card delay={0.1}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={ex.tab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="p-4 sm:p-6 md:p-8"
                >
                  <h3 className="mb-5 text-xs font-semibold tracking-[0.15em] text-[color:var(--ink-faint)] uppercase">
                    Noorva at a glance
                  </h3>
                  <div className="flex flex-col gap-5">
                    {ex.glance.map((g) => {
                      const Icon = g.icon;
                      return (
                        <div key={g.label} className="flex items-start gap-3">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ink-soft)]" strokeWidth={1.5} />
                          <div>
                            <p className="text-xs text-[color:var(--ink-faint)]">{g.label}</p>
                            <p className="text-sm font-medium text-[color:var(--ink)]">{g.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>
    </PageSection>
  );
}
