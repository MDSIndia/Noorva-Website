"use client";

// "See Noorva in Action" — a wider, desktop-style conversation demo (in
// addition to the phone-mockup chat in the hero) showing a fuller
// request-to-plan exchange, plus a small "at a glance" status panel.
// Illustrative content, not a live product screenshot.

import { motion } from "framer-motion";
import {
  Sparkles,
  Globe,
  CalendarClock,
  RotateCw,
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
} from "lucide-react";
import PageSection from "./ui/PageSection";
import SectionHeading from "./ui/SectionHeading";
import Card from "./ui/Card";

const TRAITS = [
  { icon: Sparkles, label: "Understands context" },
  { icon: Globe, label: "Checks your world" },
  { icon: CalendarClock, label: "Plans intelligently" },
  { icon: RotateCw, label: "Follows up & adapts" },
];

const SCHEDULE = [
  { icon: GraduationCap, time: "07:30 AM", task: "Drop your sister at college" },
  { icon: Laptop2, time: "08:30 AM", task: "Deep work: finish your project" },
  { icon: Sandwich, time: "12:30 PM", task: "Lunch break" },
  { icon: ShoppingBag, time: "01:00 PM", task: "Grocery shopping (near your place)" },
  { icon: Dumbbell, time: "06:00 PM", task: "Gym — 45 min workout" },
  { icon: CalendarCheck, time: "07:30 PM", task: "Review & plan for tomorrow" },
];

const GLANCE = [
  { icon: ListChecks, label: "Today's Focus", value: "Finish project" },
  { icon: CalendarClock, label: "Next Task", value: "Drop sister at college in 25 mins" },
  { icon: ShoppingBag, label: "Grocery List", value: "12 items" },
  { icon: Battery, label: "Energy Level", value: "Optimal · 82%" },
  { icon: CircleCheck, label: "Daily Progress", value: "3 / 6 completed" },
];

export default function CompanionDemoSection() {
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
                  className="flex items-center gap-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-3"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[color:var(--ink)]" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-[color:var(--ink)]">{t.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Card className="md:col-span-2">
              <div className="p-6 md:p-8">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--paper-dim)]">
                    <User className="h-4 w-4 text-[color:var(--ink)]" strokeWidth={1.5} />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-[color:var(--line)] bg-[color:var(--paper-dim)] px-4 py-3 text-sm leading-relaxed text-[color:var(--ink)]">
                    I have a busy day today. I need to drop my sister at college, finish a project, go to the gym and buy groceries.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundImage: "var(--accent-gradient)" }}
                  >
                    <Sparkles className="h-4 w-4 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="w-full">
                    <p className="mb-3 text-sm font-medium text-[color:var(--ink)]">
                      Got it. Here&rsquo;s a smart plan for your day:
                    </p>
                    <div className="flex flex-col gap-2">
                      {SCHEDULE.map((s) => {
                        const Icon = s.icon;
                        return (
                          <div
                            key={s.task}
                            className="flex items-center gap-3 rounded-xl border border-[color:var(--line)] px-3.5 py-2.5"
                          >
                            <Icon className="h-4 w-4 shrink-0 text-[color:var(--ink-soft)]" strokeWidth={1.5} />
                            <span className="w-20 shrink-0 text-xs font-medium text-[color:var(--ink-faint)]">{s.time}</span>
                            <span className="text-sm text-[color:var(--ink)]">{s.task}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[color:var(--ink-soft)]">
                      I&rsquo;ve set reminders, blocked focus time for your project, and added traffic-aware travel time.
                      Shall I reschedule if anything changes?
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card delay={0.1}>
              <div className="p-6 md:p-8">
                <h3 className="mb-5 text-xs font-semibold tracking-[0.15em] text-[color:var(--ink-faint)] uppercase">
                  Noorva at a glance
                </h3>
                <div className="flex flex-col gap-5">
                  {GLANCE.map((g) => {
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
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageSection>
  );
}
