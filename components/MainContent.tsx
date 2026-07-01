"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import bg1 from "../assets/images/background image 1.png";
import bg2 from "../assets/images/background image 2.png";
import bg3 from "../assets/images/background image 3.png";
import bg4 from "../assets/images/background image 4.png";
import bg5 from "../assets/images/background image 5.png";
import bg6 from "../assets/images/background image 6.png";
import bg7 from "../assets/images/background image 7.png";
import bg8 from "../assets/images/background image 8.png";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─── SLIDES ───────────────────────────────────────────────────── */
const SLIDES = [
  {
    src: bg1,
    chapter: "I",
    heading: "Where Every\nJourney Begins",
    body: "Before guidance, there is curiosity. Noorva is born from the belief that every person deserves a companion that truly listens, learns, and leads the way forward.",
  },
  {
    src: bg2,
    chapter: "II",
    heading: "Intelligence\nShaped Around You",
    body: "Noorva learns your rhythms — your mornings, your goals, your moments of doubt and ambition — and shapes its intelligence around the life you actually live.",
  },
  {
    src: bg3,
    chapter: "III",
    heading: "A Smarter\nPath Ahead",
    body: "With every interaction, Noorva deepens its understanding. Trusted knowledge, timely guidance, and human-like conversation — all moving you forward with clarity.",
  },
  {
    src: bg4,
    chapter: "IV",
    heading: "Built on\nDeep Listening",
    body: "Noorva doesn't just process words — it hears the meaning behind them. Every question you ask shapes a more attuned, more empathetic companion for the road ahead.",
  },
  {
    src: bg5,
    chapter: "V",
    heading: "Knowledge\nAt Your Pace",
    body: "Whether you need a quick answer or a deep dive, Noorva matches your tempo. It meets you where you are and grows alongside your curiosity, always ready when you are.",
  },
  {
    src: bg6,
    chapter: "VI",
    heading: "Clarity Through\nComplexity",
    body: "In a world of overwhelming information, Noorva cuts through the noise — distilling what matters, surfacing what's relevant, and presenting it with effortless precision.",
  },
  {
    src: bg7,
    chapter: "VII",
    heading: "A Presence\nYou Can Trust",
    body: "More than an assistant, Noorva is a presence — consistent, thoughtful, and always in your corner. It earns trust not through perfection, but through genuine understanding.",
  },
  {
    src: bg8,
    chapter: "VIII",
    heading: "The Beginning\nOf What's Next",
    body: "This is only the start. Noorva evolves with you — anticipating tomorrow's challenges, celebrating today's victories, and illuminating every step of your personal journey.",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   STORY SECTION — sequential chapter flow.
   Each slide is displayed one at a time as the user scrolls.
   Subtle reveal animation keeps the layout premium and uncluttered.
   ═══════════════════════════════════════════════════════════════════ */
function StorySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const slides = slideRefs.current.filter(Boolean) as HTMLElement[];
    const panels = panelRefs.current.filter(Boolean) as HTMLDivElement[];

    slides.forEach((slide, index) => {
      const isFirst = index === 0;
      gsap.set(slide, {
        autoAlpha: isFirst ? 1 : 0,
        y: isFirst ? 0 : 40,
        scale: isFirst ? 1 : 0.98,
        pointerEvents: isFirst ? 'auto' : 'none',
      });
    });
    panels.forEach((panel, index) => {
      const isFirst = index === 0;
      gsap.set(panel, {
        autoAlpha: isFirst ? 1 : 0,
        y: isFirst ? 0 : 20,
        scale: isFirst ? 1 : 0.98,
      });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: `+=${SLIDES.length * 100}%`,
        pin: true,
        pinSpacing: true,
        scrub: 0.8,
        snap: 1 / (SLIDES.length - 1),
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    slides.forEach((slide, index) => {
      const panel = panels[index];
      const showTime = index * 1.4;
      const hideTime = showTime + 1.4;

      tl.to(slide, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'power2.out',
      }, showTime);

      if (panel) {
        tl.to(panel, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'power2.out',
        }, showTime);
      }

      if (index < slides.length - 1) {
        tl.to([
          slide,
          panel,
        ].filter(Boolean), {
          autoAlpha: 0,
          y: 0,
          scale: 1.02,
          duration: 1,
          ease: 'power1.inOut',
        }, hideTime);
      }
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative bg-[#050c17]"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(79,211,255,0.18),transparent_18%),radial-gradient(circle_at_88%_18%,rgba(194,87,255,0.14),transparent_18%)]" />
        <div className="absolute inset-x-16 top-16 hidden h-16 rounded-full bg-cyan-400/10 blur-3xl lg:block" />
        <div className="absolute right-12 top-1/4 hidden h-24 w-24 rounded-full border border-cyan-300/15 bg-cyan-300/5 blur-3xl opacity-60 lg:block" />
      </div>
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(3,5,12,0.96)_0%,rgba(9,12,24,0.93)_40%,rgba(6,8,20,0.98)_100%)]" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 28px)',
          opacity: 0.1,
        }}
      />

      <div className="relative mx-auto max-w-[1480px] px-6 py-16 lg:pt-28 lg:pb-8">
        <div className="relative z-10" style={{ minHeight: `${SLIDES.length * 100}vh` }}>
          <div className="relative h-screen lg:h-[90vh] flex items-center justify-center">
            {SLIDES.map((slide, i) => (
              <section
                key={i}
                ref={(el) => { slideRefs.current[i] = el; }}
                className="story-slide absolute inset-0"
                style={{ zIndex: i + 1 }}
              >
                <div className="relative mx-auto w-full max-w-full sm:max-w-[980px] lg:max-w-[1280px] overflow-hidden rounded-[2.5rem] border border-white/15 bg-white/5 shadow-[0_55px_120px_rgba(8,15,36,0.48)] backdrop-blur-[14px]">
                  <div className="slide-frame relative h-[92vh] sm:h-[86vh] lg:h-[80vh] overflow-hidden">
                    <Image
                      src={slide.src}
                      alt={`Chapter ${slide.chapter}`}
                      fill
                      className="object-cover object-center brightness-[1.12] contrast-[1.18] saturate-[1.08]"
                      sizes="(max-width: 768px) 90vw, 1180px"
                      priority={i === 0}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_50%)] pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.01)_0%,transparent_45%)] pointer-events-none" />
                    <div className="absolute left-8 top-8 hidden h-24 w-24 rounded-full border border-cyan-300/20 blur-3xl opacity-50 lg:block" />
                    <div className="absolute right-8 bottom-20 hidden h-16 w-16 rounded-full border border-violet-300/20 blur-3xl opacity-50 lg:block" />
                    <div className="absolute left-4 top-4 h-16 w-16 rounded-full border border-cyan-300/15 blur-xl opacity-70 sm:left-10 sm:top-10 sm:h-24 sm:w-24" />
                    <div className="absolute right-4 bottom-16 hidden h-12 w-12 rounded-full border border-violet-300/15 opacity-70 md:block md:right-10 md:bottom-24 md:h-16 md:w-16" />
                    <div className="absolute left-0 top-1/2 h-px w-full bg-cyan-300/10" />
                    <div className="absolute inset-x-4 top-20 hidden grid-cols-3 gap-4 lg:grid lg:inset-x-6 lg:top-24">
                      <div className="h-px w-full bg-cyan-300/10" />
                      <div className="h-px w-full bg-violet-300/10" />
                      <div className="h-px w-full bg-white/10" />
                    </div>

                    <div className="absolute left-4 top-4 flex items-center justify-between gap-3 rounded-[1.75rem] border border-white/10 bg-black/30 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-white/75 shadow-[0_16px_40px_rgba(0,0,0,0.22)] sm:left-6 sm:top-6 sm:gap-4 sm:px-4 sm:py-3">
                      <span>Chapter {slide.chapter}</span>
                      <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[10px] text-cyan-200">Live</span>
                    </div>

                    <div
                      ref={(el) => { panelRefs.current[i] = el; }}
                      className="absolute inset-x-4 bottom-4 slide-panel rounded-[2rem] border border-white/10 bg-black/20 p-5 backdrop-blur-xl shadow-[0_22px_70px_rgba(0,0,0,0.24)] sm:inset-x-6 sm:bottom-6 sm:p-8"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-[0.35em] text-cyan-100">
                        <span>Noorva insight</span>
                        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] text-white/70">Insight</span>
                      </div>
                      <div className="mb-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-white/40">
                        <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                        <span>System node active</span>
                      </div>
                      <h3 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                        {slide.heading}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-white/70 sm:text-base">
                        {slide.body}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-white/40">
        <div className="h-[1px] w-24 bg-white/10" />
        <span>scroll for each chapter</span>
        <div className="h-[1px] w-24 bg-white/10" />
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   END SCREEN
   ═══════════════════════════════════════════════════════════════════ */
function EndScreen() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(
      el.querySelectorAll(".ei"),
      { opacity: 0, y: 38, filter: "blur(10px)" },
      {
        opacity: 1, y: 0, filter: "blur(0px)",
        duration: 1.6, stagger: 0.16, ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  return (
    <div
      ref={ref}
      className="relative w-full min-h-screen flex items-center justify-center px-6 bg-[#02050c] overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(84,168,255,0.16), transparent 24%), radial-gradient(circle at 30% 15%, rgba(120,80,255,0.12), transparent 18%)",
        }}
      />
      {[520, 360].map((size) => (
        <div
          key={size}
          className="absolute rounded-full border border-white/[0.03] pointer-events-none"
          style={{
            width: size,
            height: size,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-end justify-center pb-24 pointer-events-none">
        <div className="h-1 w-[260px] rounded-full bg-white/5 backdrop-blur-xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-10 text-center">
        <span className="ei block text-[9px] tracking-[0.65em] uppercase text-white/30 font-light">
          Elegant intelligence
        </span>

        <h1
          className="ei font-[var(--font-playfair)] text-6xl md:text-7xl lg:text-[5.5rem] font-extralight leading-none tracking-[-0.04em]"
          style={{
            background: "linear-gradient(150deg, #ffffff 0%, #c4b5fd 34%, #91c5ff 72%, #ffffff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Noorva
        </h1>

        <p className="ei mx-auto max-w-xl text-sm leading-relaxed text-white/50 tracking-wide sm:text-base">
          A premium companion that is calm, precise, and beautifully tailored for every moment.
        </p>

        <div className="ei mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-12 py-4 text-sm uppercase tracking-[0.22em] text-white/80 transition duration-300 hover:border-white/20 hover:bg-white/10"
          >
            Begin the journey
          </a>

          <span className="text-[10px] uppercase tracking-[0.35em] text-white/40">
            refined · responsive · ready
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN EXPORT ───────────────────────────────────────────────── */
export default function MainContent() {
  return (
    <div className="bg-black text-white" style={{ overflowX: "clip" }}>
      <StorySection />
      <EndScreen />
    </div>
  );
}
