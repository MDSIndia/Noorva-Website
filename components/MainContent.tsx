"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─── Cosmos Starfield Canvas — Fixed full-viewport background ──── */
function CosmosBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Generate 3 layers of stars: tiny distant, medium, and bright large
    const makeStars = (count: number, minR: number, maxR: number, minA: number, maxA: number) =>
      Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * (maxR - minR) + minR,
        alpha: Math.random() * (maxA - minA) + minA,
        twinkleSpeed: 0.005 + Math.random() * 0.015,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));

    const tinyStars   = makeStars(260, 0.2, 0.7, 0.15, 0.45);
    const medStars    = makeStars(100, 0.7, 1.4, 0.35, 0.70);
    const brightStars = makeStars(25,  1.4, 2.2, 0.60, 1.00);

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all stars with twinkling
      [...tinyStars, ...medStars, ...brightStars].forEach((s) => {
        const twinkle = Math.sin(frame * s.twinkleSpeed + s.twinkleOffset) * 0.3 + 0.7;
        const a = s.alpha * twinkle;
        // Subtle soft glow for larger stars
        if (s.r > 1.2) {
          const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
          grd.addColorStop(0, `rgba(255,255,255,${a * 0.4})`);
          grd.addColorStop(1, "rgba(255,255,255,0)");
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ─── Grid SVG ─────────────────────────────────────────────────── */
function GridLines() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

/* ─── Typewriter hook ─────────────────────────────────────────── */
function useTypewriter(texts: string[], speed = 60, pause = 2000) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let idx = 0, charIdx = 0, deleting = false, timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const cur = texts[idx];
      if (!deleting) {
        el.textContent = cur.slice(0, ++charIdx);
        if (charIdx === cur.length) { deleting = true; timer = setTimeout(tick, pause); return; }
      } else {
        el.textContent = cur.slice(0, --charIdx);
        if (charIdx === 0) { deleting = false; idx = (idx + 1) % texts.length; }
      }
      timer = setTimeout(tick, deleting ? speed / 2 : speed);
    };
    tick();
    return () => clearTimeout(timer);
  }, [texts, speed, pause]);
  return ref;
}

export default function MainContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const typeRef = useTypewriter(["Guide Your Goals", "Understand Your Routine", "Deliver Trusted Knowledge", "Evolve With You"], 65, 1800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    /* ── Standard fade ups ──────────────────────── */
    el.querySelectorAll("[data-fade]").forEach((el) => {
      const dly = parseFloat((el as HTMLElement).dataset.delay || "0");
      gsap.fromTo(el, { opacity: 0, y: 35, filter: "blur(6px)" }, {
        opacity: 1, y: 0, filter: "blur(0px)", duration: 1.4, delay: dly, ease: "sine.out",
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
      });
    });

    /* ── Character slide-up ─────────────────────── */
    el.querySelectorAll("[data-chars]").forEach((target) => {
      const text = target.textContent || "";
      target.innerHTML = text.split("").map((ch) =>
        ch === " "
          ? "<span style='display:inline-block'>&nbsp;</span>"
          : `<span style='display:inline-block;overflow:hidden'><span class='char' style='display:inline-block;transform:translateY(115%)'>${ch}</span></span>`
      ).join("");
      gsap.to(target.querySelectorAll(".char"), {
        y: "0%", duration: 0.9, ease: "power4.out", stagger: 0.025,
        scrollTrigger: { trigger: target, start: "top 87%", toggleActions: "play none none reverse" },
      });
    });

    /* ── Scanline clip reveal ───────────────────── */
    el.querySelectorAll("[data-scan]").forEach((el) => {
      gsap.fromTo(el, { clipPath: "inset(0 100% 0 0)" }, {
        clipPath: "inset(0 0% 0 0)", duration: 1.6, ease: "sine.inOut",
        scrollTrigger: { trigger: el, start: "top 87%", toggleActions: "play none none reverse" },
      });
    });

    /* ── Staggered card grids ───────────────────── */
    el.querySelectorAll("[data-card-grid]").forEach((grid) => {
      gsap.fromTo(grid.querySelectorAll("[data-card]"),
        { opacity: 0, y: 40, scale: 0.98, filter: "blur(4px)" },
        {
          opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.3, ease: "sine.out", stagger: 0.15,
          scrollTrigger: { trigger: grid, start: "top 85%", toggleActions: "play none none reverse" },
        }
      );
    });

    /* ── Line grow ──────────────────────────────── */
    el.querySelectorAll("[data-line-grow]").forEach((line) => {
      gsap.fromTo(line, { scaleX: 0, transformOrigin: "left center" }, {
        scaleX: 1, duration: 1.2, ease: "power3.inOut",
        scrollTrigger: { trigger: line, start: "top 92%", toggleActions: "play none none reverse" },
      });
    });

    /* ── Liquid Ambient Glows ───────────────────── */
    el.querySelectorAll("[data-glow-parallax]").forEach((glow) => {
      // 1) Scroll Parallax
      gsap.to(glow, {
        y: -100,
        scrollTrigger: { trigger: glow, start: "top bottom", end: "bottom top", scrub: 2.5 },
      });
      // 2) Continuous Liquid Breathing
      gsap.to(glow, {
        scale: 1.15,
        rotation: 15,
        x: () => Math.random() * 40 - 20,
        duration: () => 8 + Math.random() * 5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    });

    /* ── Number counters ────────────────────────── */
    el.querySelectorAll("[data-counter]").forEach((counter) => {
      const target = parseInt((counter as HTMLElement).dataset.counter || "0");
      const suffix = (counter as HTMLElement).dataset.suffix || "";
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: counter, start: "top 85%",
        onEnter: () => gsap.to(obj, {
          val: target, duration: 2.2, ease: "power2.out",
          onUpdate: () => { counter.textContent = Math.round(obj.val).toLocaleString() + suffix; },
        }),
      });
    });

    /* ── 3D Tilt on cards ───────────────────────── */
    el.querySelectorAll(".tilt-card").forEach((card) => {
      const c = card as HTMLElement;
      const onMove = (e: MouseEvent) => {
        const rect = c.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(c, { rotateY: x * 10, rotateX: -y * 10, duration: 0.4, ease: "power2.out", transformPerspective: 900 });
      };
      const onLeave = () => gsap.to(c, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "power3.out" });
      c.addEventListener("mousemove", onMove);
      c.addEventListener("mouseleave", onLeave);
    });

    /* ── Magnetic buttons ───────────────────────── */
    el.querySelectorAll(".mag-btn").forEach((btn) => {
      const b = btn as HTMLElement;
      const onMove = (e: MouseEvent) => {
        const rect = b.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
        gsap.to(b, { x, y, duration: 0.4, ease: "power2.out" });
      };
      const onLeave = () => gsap.to(b, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
      b.addEventListener("mousemove", onMove);
      b.addEventListener("mouseleave", onLeave);
    });

    /* ── Horizontal ticker ──────────────────────── */
    const inner = el.querySelector("[data-ticker-inner]");
    if (inner) gsap.to(inner, { xPercent: -50, duration: 22, repeat: -1, ease: "none" });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative text-white w-full grain"
      style={{ background: "#000000", zIndex: 1 }}
    >
      {/* ── Fixed cosmos starfield behind all content ── */}
      <CosmosBackground />
      <GridLines />

      {/* ── Ambient glows ─────────────────────── */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div data-glow-parallax className="absolute w-[80vw] h-[80vw] rounded-full blur-[160px] opacity-[0.25]"
          style={{ background: "radial-gradient(circle,rgba(255,255,255,0.4) 0%,transparent 70%)", top: "2%", left: "10%" }} />
        <div data-glow-parallax className="absolute w-[65vw] h-[65vw] rounded-full blur-[140px] opacity-[0.20]"
          style={{ background: "radial-gradient(circle,rgba(220,230,255,0.3) 0%,transparent 70%)", top: "42%", right: "0%" }} />
        <div data-glow-parallax className="absolute w-[75vw] h-[75vw] rounded-full blur-[170px] opacity-[0.22]"
          style={{ background: "radial-gradient(circle,rgba(240,240,245,0.35) 0%,transparent 70%)", bottom: "12%", left: "5%" }} />
      </div>

      {/* ── Ticker ────────────────────────────── */}
      <div className="border-t border-b border-white/[0.04] overflow-hidden py-4 select-none"
        style={{ maskImage: "linear-gradient(to right,transparent,white 10%,white 90%,transparent)" }}>
        <div data-ticker-inner className="flex gap-14 whitespace-nowrap w-max">
          {[...Array(2)].map((_, r) => (
            <div key={r} className="flex gap-14 items-center">
              {["HUMAN-INTERACTIVE AI", "MOOD-AWARE GUIDANCE", "TRUSTED INTELLIGENCE", "ADVANCED SOURCE FILTERING",
                "GOAL MANAGEMENT", "ROUTINE LEARNING", "VOICE-FIRST", "EXPERT-BACKED KNOWLEDGE"].map((t, i) => (
                <span key={i} className="text-[10px] tracking-[0.42em] uppercase text-white/22 font-medium flex items-center gap-8">
                  {t}<span className="inline-block w-1 h-1 rounded-full bg-violet-500/40" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          1) HERO
      ═══════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 pt-28 pb-20 md:pt-44 md:pb-32 flex flex-col items-center text-center overflow-hidden">

        {/* Orbiting rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-0 h-0">
            <div className="absolute w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-500/[0.08] animate-ping" style={{ animationDuration: "5s" }} />
            <div className="absolute w-[420px] h-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/[0.07] animate-ping" style={{ animationDuration: "7s", animationDelay: "1s" }} />
            <div className="absolute w-[250px] h-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/[0.12] animate-ping" style={{ animationDuration: "3.5s", animationDelay: "2s" }} />
          </div>
        </div>

        <div data-fade className="relative z-10 flex flex-col items-center">
          <span data-scan className="inline-block text-[10px] tracking-[0.52em] uppercase text-cyan-300/65 mb-7 font-semibold border border-cyan-300/12 rounded-full px-5 py-2 bg-cyan-400/[0.04] shimmer">
            ◈ Introducing Noorva
          </span>

          <h1 className="font-[var(--font-playfair)] text-4xl md:text-6xl lg:text-[5.5rem] leading-[1.06] tracking-tight font-extralight max-w-5xl">
            <span data-chars className="block">Meet Noorva —</span>
            <span className="block text-transparent bg-clip-text font-light mt-2 glitch"
              data-text="Your Human-Interactive"
              style={{ backgroundImage: "linear-gradient(120deg,#c4b5fd 0%,#ffffff 40%,#93c5fd 80%)" }}>
              Your Human-Interactive
            </span>
            <span data-chars className="block mt-1">AI Companion</span>
          </h1>

          {/* Typewriter subheading */}
          <div data-fade data-delay="0.1" className="mt-10 text-lg md:text-xl text-violet-300/80 font-light tracking-wide typewriter-cursor">
            Noorva can&nbsp;<span ref={typeRef} className="text-white font-medium" />
          </div>

          <p data-fade data-delay="0.2" className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-white/58 font-light">
            A proactive, deeply personalized AI that understands your routines, goals, moods, and interests — helping you live smarter, stay organized, discover credible knowledge, and feel guided every day.
          </p>

          <p data-fade data-delay="0.3" className="mt-5 max-w-xl text-sm leading-relaxed text-white/36 font-light">
            Noorva is not built to simply answer commands. It is designed to live alongside you — learning how you think, what you value, how your days move, and when you need support the most.
          </p>

          {/* CTA */}
          <div data-fade data-delay="0.4" className="mt-12 flex flex-col sm:flex-row gap-5 items-center">
            <a href="#" className="mag-btn group relative inline-flex items-center justify-center rounded-full overflow-hidden font-semibold text-sm tracking-wider uppercase px-10 py-4 neon-glow transition-all duration-300 hover:scale-105"
              style={{ background: "linear-gradient(135deg,#7c5cfc,#4fa8d5)" }}>
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <span className="relative text-white flex items-center gap-2">Enter Noorva <span className="opacity-60">→</span></span>
            </a>
            <a href="#what-is-noorva" className="mag-btn group inline-flex items-center gap-3 rounded-full border border-white/10 text-white/65 font-medium text-sm tracking-wider uppercase px-10 py-4 transition-all duration-400 hover:text-white hover:border-white/22 hover:bg-white/[0.025]">
              See How It Works <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </a>
          </div>

          {/* Stat pills */}
          <div data-fade data-delay="0.5" className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-2xl mx-auto">
            {[
              { label: "Personalization Layers", val: 4, suffix: "" },
              { label: "Intelligence Modules", val: 7, suffix: "+" },
              { label: "Daily Life Contexts", val: 5, suffix: "" },
              { label: "Source Filtering Passes", val: 3, suffix: "x" },
            ].map(({ label, val, suffix }) => (
              <div key={label} className="gradient-border p-4 shimmer">
                <div className="text-2xl font-light text-white/90 font-mono">
                  <span data-counter={val} data-suffix={suffix}>0</span>
                </div>
                <div className="mt-1 text-[10px] text-white/35 tracking-wide uppercase font-light leading-snug">{label}</div>
              </div>
            ))}
          </div>

          {/* Pillars */}
          <div data-fade data-delay="0.55" className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {["Human-Interactive AI", "Mood-Aware Guidance", "Trusted Intelligence", "Daily Life Companion"].map((p) => (
              <span key={p} className="text-[10px] tracking-[0.3em] uppercase text-white/28 font-light flex items-center gap-3">
                <span className="w-1 h-1 rounded-full bg-violet-400/60" />{p}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div data-line-grow className="h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════
          2) BRAND INTRO
      ═══════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-24 md:py-36 grid md:grid-cols-12 gap-8 md:gap-16 items-start">
        <div data-fade className="md:col-span-5">
          <span data-scan className="inline-block text-[10px] tracking-[0.45em] uppercase text-violet-400/70 mb-5 border border-violet-400/10 rounded-full px-4 py-1.5 bg-violet-400/[0.04] font-semibold shimmer">
            Philosophy
          </span>
          <h2 data-chars className="mt-4 font-[var(--font-playfair)] text-3xl md:text-5xl text-white/92 leading-tight font-extralight tracking-tight">
            A Companion, Not Just an Assistant
          </h2>
        </div>
        <div data-fade data-delay="0.1" className="md:col-span-7 space-y-6 text-base md:text-lg leading-relaxed text-white/52 font-light">
          <p>Noorva is a new kind of AI experience — one that goes beyond reactive chat and task completion. It combines human-like interaction, proactive support, personalized intelligence, and credible knowledge delivery to become a meaningful part of everyday life.</p>
          <p>It learns from your routines, preferences, habits, goals, and evolving life context, then transforms that understanding into timely guidance, helpful reminders, intelligent recommendations, and natural conversations that feel personal, calm, and useful.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div data-line-grow className="h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════
          3) WHAT IS NOORVA?
      ═══════════════════════════════════════ */}
      <section id="what-is-noorva" className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-24 md:py-36">
        <div data-fade className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span data-scan className="inline-block text-[10px] tracking-[0.45em] uppercase text-cyan-200/50 mb-5 border border-cyan-200/10 rounded-full px-4 py-1.5 bg-cyan-200/[0.04] font-semibold shimmer">
            Overview
          </span>
          <h2 data-chars className="mt-4 font-[var(--font-playfair)] text-3xl md:text-5xl text-white/92 leading-tight font-extralight">
            What is Noorva?
          </h2>
          <p data-fade data-delay="0.12" className="mt-6 text-base md:text-lg text-white/50 leading-relaxed font-light">
            A Human-Interactive, Proactive Personal Intelligence System built to support people in their daily lives. It understands context, timing, routines, intent, and emotional rhythm.
          </p>
        </div>
        <div data-card-grid className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {[
            "Organize your day",
            "Stay consistent with goals",
            "Receive reminders that actually help",
            "Discover trustworthy expert knowledge",
            "Find the right video at the right moment",
            "Feel guided by an intelligent companion",
          ].map((item, idx) => (
            <div data-card key={idx} className="tilt-card group p-8 rounded-2xl border border-white/[0.05] bg-[#030208] hover:border-white/10 transition-all duration-500 cursor-default relative overflow-hidden shimmer">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: "radial-gradient(circle at 15% 15%,rgba(124,92,252,0.09),transparent 60%)" }} />
              <div className="w-9 h-9 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] flex items-center justify-center text-xs text-cyan-300/75 font-mono font-semibold mb-6 group-hover:border-cyan-400/40 group-hover:bg-cyan-400/[0.08] transition-all duration-300">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <h3 className="text-base text-white/75 font-light tracking-wide group-hover:text-white transition-colors duration-300 leading-snug">{item}</h3>
              <div className="mt-5 w-6 h-px bg-gradient-to-r from-cyan-400/40 to-transparent group-hover:w-14 transition-all duration-500" />
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div data-line-grow className="h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════
          4) CORE VALUES
      ═══════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-24 md:py-36">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div data-fade className="lg:col-span-4">
            <span data-scan className="inline-block text-[10px] tracking-[0.45em] uppercase text-amber-500/70 mb-5 border border-amber-500/10 rounded-full px-4 py-1.5 bg-amber-500/[0.04] font-semibold shimmer">
              Core Alignment
            </span>
            <h2 data-chars className="mt-4 font-[var(--font-playfair)] text-3xl md:text-5xl text-white/92 leading-tight font-extralight">
              Designed to Feel Like It Knows You
            </h2>
            <p data-fade data-delay="0.1" className="mt-6 text-sm text-white/42 leading-relaxed font-light">
              Most digital systems wait for commands. Noorva is designed to understand your world and support it proactively.
            </p>
          </div>
          <div data-card-grid className="lg:col-span-8 grid sm:grid-cols-2 gap-5">
            {[
              { title: "Personal", icon: "◉", copy: "Learns your interests, routines, habits, goals, preferred styles, and evolving tastes — the platform continuously adapts around you.", glow: "rgba(100,180,255,0.09)" },
              { title: "Proactive", icon: "◈", copy: "Doesn't just wait to be asked. Follows up, reminds, guides, surfaces relevant information, and supports your day at the right moment.", glow: "rgba(140,80,255,0.09)" },
              { title: "Human-Interactive", icon: "◎", copy: "Natural conversations and meaningful interaction build continuity over time — the experience feels alive, familiar, and deeply tailored.", glow: "rgba(60,200,160,0.07)" },
              { title: "Trustworthy", icon: "◇", copy: "Advanced source filtering prioritizes credible experts, verified information, and meaningful knowledge over noise, clickbait, and low-value content.", glow: "rgba(245,158,11,0.07)" },
            ].map(({ title, icon, copy, glow }) => (
              <div data-card key={title} className="tilt-card group relative p-8 rounded-2xl border border-white/[0.05] bg-[#030208] overflow-hidden cursor-default transition-all duration-500 hover:-translate-y-1 shimmer">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ background: `radial-gradient(circle at 10% 10%,${glow},transparent 60%)` }} />
                <span className="text-2xl text-white/18 group-hover:text-white/50 transition-colors duration-300 block mb-4">{icon}</span>
                <h3 className="text-xl font-medium text-white/88 group-hover:text-white transition-colors duration-300">{title}</h3>
                <div className="mt-3 h-px w-8 bg-gradient-to-r from-white/22 to-transparent group-hover:w-16 transition-all duration-500" />
                <p className="mt-5 text-sm leading-relaxed text-white/40 group-hover:text-white/60 transition-colors duration-500 font-light">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div data-line-grow className="h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════
          5) NOORVA EXPERIENCE — 4 LAYERS
      ═══════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-24 md:py-36">
        <div data-fade className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span data-scan className="inline-block text-[10px] tracking-[0.45em] uppercase text-cyan-200/50 mb-5 border border-cyan-200/10 rounded-full px-4 py-1.5 bg-cyan-200/[0.04] font-semibold shimmer">
            The Architecture
          </span>
          <h2 data-chars className="mt-4 font-[var(--font-playfair)] text-3xl md:text-5xl text-white/92 leading-tight font-extralight">
            The Noorva Experience
          </h2>
          <p data-fade data-delay="0.1" className="mt-6 text-base text-white/50 leading-relaxed font-light">A layered intelligence system where each part makes the experience more personal, useful, and human.</p>
        </div>
        <div data-card-grid className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {[
            { layer: "01 · Learning", title: "Human-Interactive AI", desc: "Continuously understands your preferences, behavior, routines, interests, challenges, and evolving life patterns through natural interaction.", glow: "rgba(59,130,246,0.13)", badge: "bg-blue-500/10 text-blue-300/80 border-blue-500/15" },
            { layer: "02 · Action", title: "Noorva Guide", desc: "Turns understanding into real support — helping you create goals, organize plans, follow routines, and stay consistent with reminders.", glow: "rgba(139,92,246,0.13)", badge: "bg-violet-500/10 text-violet-300/80 border-violet-500/15" },
            { layer: "03 · Timing", title: "Mood Intelligence", desc: "Decides when to interact, how to interact, and when not to interrupt — so every interaction feels relevant, calm, and perfectly timed.", glow: "rgba(16,185,129,0.11)", badge: "bg-emerald-500/10 text-emerald-300/80 border-emerald-500/15" },
            { layer: "04 · Trust", title: "Source Filtering", desc: "Filters knowledge through experts, credible institutions, and high-quality sources so every answer is not only personalized — but reliable.", glow: "rgba(245,158,11,0.11)", badge: "bg-amber-500/10 text-amber-300/80 border-amber-500/15" },
          ].map(({ layer, title, desc, glow, badge }) => (
            <div data-card key={title} className="tilt-card group relative p-8 rounded-3xl border border-white/[0.05] bg-[#030208] overflow-hidden flex flex-col justify-between min-h-[340px] hover:border-white/10 transition-all duration-500 cursor-default hover:-translate-y-1 scanlines">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: `radial-gradient(circle at 50% 0%,${glow},transparent 70%)` }} />
              {/* Corner grid */}
              <div className="absolute top-4 right-4 w-12 h-12 opacity-[0.06]">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="0.5">
                  {[0, 16, 32].map((v) => (<g key={`g${v}`}><line key={`h${v}`} x1={v} y1="0" x2={v} y2="48" /><line key={`v${v}`} x1="0" y1={v} x2="48" y2={v} /></g>))}
                </svg>
              </div>
              <div>
                <span className={`inline-block text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border font-mono font-semibold mb-6 ${badge}`}>{layer}</span>
                <h3 className="text-lg font-medium text-white/90 group-hover:text-white transition-colors duration-300">{title}</h3>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-white/38 group-hover:text-white/58 transition-colors duration-500 font-light">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div data-line-grow className="h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════
          6) FEATURES
      ═══════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-24 md:py-36">
        <div data-fade className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span data-scan className="inline-block text-[10px] tracking-[0.45em] uppercase text-violet-400/70 mb-5 border border-violet-400/10 rounded-full px-4 py-1.5 bg-violet-400/[0.04] font-semibold shimmer">
            Capabilities
          </span>
          <h2 data-chars className="mt-4 font-[var(--font-playfair)] text-3xl md:text-5xl text-white/92 leading-tight font-extralight">
            What Noorva Can Do
          </h2>
        </div>
        <div data-card-grid className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {[
            { num: "01", title: "Guide Your Goals", desc: "Turn ambitions into clear action. Set goals, build structured plans, break them into manageable tasks, and follow through with intelligent reminders." },
            { num: "02", title: "Understand Your Routine", desc: "From mornings to late nights, learns your rhythm — work, learning, travel, wellness, fitness, rest — so its support fits naturally into your life." },
            { num: "03", title: "Remind at the Right Time", desc: "Context-aware nudges built around your schedule, intent, and priorities — designed to help without overwhelming you." },
            { num: "04", title: "Deliver Trusted Knowledge", desc: "Identifies credible experts, trustworthy sources, verified videos, and meaningful information — then delivers it in a way that is easy to consume." },
            { num: "05", title: "Recommend Right Content", desc: "Discover relevant, expert-backed content and videos that match your interests, mood, and intent — without wasting time on random scrolling." },
            { num: "06", title: "Stay With You Via Voice", desc: "Voice-first interaction lets Noorva capture tasks, remember things, answer questions, and continue conversations naturally." },
            { num: "07", title: "Evolve With You", desc: "As your routines, preferences, goals, and life situations change, Noorva updates its understanding and adapts the experience around your new reality." },
          ].map(({ num, title, desc }) => (
            <div data-card key={title} className="tilt-card group p-8 rounded-2xl border border-white/[0.05] bg-[#030208] hover:border-white/10 transition-all duration-500 cursor-default relative overflow-hidden hover:-translate-y-1 shimmer">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: "radial-gradient(circle at 10% 10%,rgba(124,92,252,0.07),transparent 60%)" }} />
              <div className="flex justify-between items-start mb-7">
                <span className="text-xs text-white/22 font-mono tracking-widest font-semibold">{num}</span>
                <div className="w-2 h-2 rounded-full bg-violet-400/30 group-hover:bg-violet-400/75 group-hover:shadow-[0_0_10px_rgba(139,92,246,0.7)] transition-all duration-300" />
              </div>
              <h3 className="text-xl font-medium text-white/88 group-hover:text-white transition-colors duration-300">{title}</h3>
              <div className="mt-3 h-px bg-gradient-to-r from-violet-400/30 to-transparent w-8 group-hover:w-16 transition-all duration-500" />
              <p className="mt-5 text-sm leading-relaxed text-white/38 group-hover:text-white/58 transition-colors duration-500 font-light">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div data-line-grow className="h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════
          7) DAILY LIFE TIMELINE
      ═══════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-24 md:py-36">
        <div data-fade className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span data-scan className="inline-block text-[10px] tracking-[0.45em] uppercase text-amber-500/70 mb-5 border border-amber-500/10 rounded-full px-4 py-1.5 bg-amber-500/[0.04] font-semibold shimmer">
            Daily Context
          </span>
          <h2 data-chars className="mt-4 font-[var(--font-playfair)] text-3xl md:text-5xl text-white/92 leading-tight font-extralight">
            Built for Daily Life
          </h2>
          <p data-fade data-delay="0.1" className="mt-6 text-base text-white/48 leading-relaxed font-light">Noorva becomes useful in the moments that shape everyday life.</p>
        </div>
        <div data-card-grid className="relative flex flex-col md:flex-row md:justify-between gap-5 max-w-5xl mx-auto">
          <div className="hidden md:block absolute top-14 left-[5%] right-[5%] h-px">
            <div data-scan className="h-full bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </div>
          {[
            { time: "Morning", label: "06 — 09", desc: "Start with clarity — priorities, reminders, routines, and the right focus.", dot: "bg-amber-400", shadow: "shadow-amber-400/30" },
            { time: "Work", label: "09 — 13", desc: "Stay aligned with tasks, plans, and deadlines through intelligent follow-ups.", dot: "bg-violet-400", shadow: "shadow-violet-400/30" },
            { time: "Learning", label: "13 — 16", desc: "Expert-backed guidance and personalized recommendations based on your goals.", dot: "bg-teal-400", shadow: "shadow-teal-400/30" },
            { time: "Wellness", label: "16 — 19", desc: "Support routines — workouts, mindfulness, self-care, and habit building.", dot: "bg-emerald-400", shadow: "shadow-emerald-400/30" },
            { time: "Evening", label: "19 — 22", desc: "Wind down with the right content and lighter interactions aligned with your mood.", dot: "bg-blue-400", shadow: "shadow-blue-400/30" },
          ].map(({ time, label, desc, dot, shadow }) => (
            <div data-card key={time} className="tilt-card relative z-10 w-full md:w-1/5 p-6 rounded-2xl border border-white/[0.05] bg-[#030208] flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-2 hover:border-white/10 cursor-default group scanlines shimmer">
              <div className={`hidden md:block w-3 h-3 rounded-full ${dot} border-2 border-black ring-4 ring-white/[0.04] absolute -top-[42px] left-1/2 -translate-x-1/2 shadow-lg ${shadow} group-hover:scale-150 transition-transform duration-300`} />
              <span className="text-[10px] font-mono text-white/22 tracking-wider mb-2">{label}</span>
              <h4 className="text-base font-medium text-white/82 group-hover:text-white transition-colors duration-300 mb-3">{time}</h4>
              <p className="text-xs leading-relaxed text-white/40 font-light">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div data-line-grow className="h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════
          8) TRUST / SOURCE FILTERING
      ═══════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-24 md:py-36">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div data-fade className="lg:col-span-6 space-y-6">
            <span data-scan className="inline-block text-[10px] tracking-[0.45em] uppercase text-cyan-200/50 border border-cyan-200/10 rounded-full px-4 py-1.5 bg-cyan-200/[0.04] font-semibold shimmer">
              Credibility First
            </span>
            <h2 data-chars className="mt-4 font-[var(--font-playfair)] text-3xl md:text-5xl text-white/92 leading-tight font-extralight">
              Intelligence Is Only Valuable If It Can Be Trusted
            </h2>
            <p className="text-base leading-relaxed text-white/52 font-light">Personalization alone is not enough. Guidance should also be credible.</p>
            <p className="text-sm leading-relaxed text-white/38 font-light">
              Noorva uses an Advanced Source Filtering Architecture that identifies the right domain, expert roles, and strongest consensus before delivering information — prioritizing expert-backed, evidence-weighted, authority-first intelligence.
            </p>
          </div>
          <div data-fade data-delay="0.15" className="lg:col-span-6 p-8 md:p-12 rounded-3xl gradient-border scanlines relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] pointer-events-none">
              <svg viewBox="0 0 128 128" fill="none" stroke="currentColor" strokeWidth="0.5">
                {[0, 32, 64, 96].map((v) => (<g key={`g${v}`}><line key={`h${v}`} x1={v} y1="0" x2={v} y2="128" /><line key={`v${v}`} x1="0" y1={v} x2="128" y2={v} /></g>))}
              </svg>
            </div>
            <h3 className="text-xs tracking-widest uppercase text-cyan-200/55 font-mono font-semibold mb-9">What this means for users</h3>
            <ul className="space-y-5">
              {["More trustworthy information", "Better expert recommendations", "Less misinformation and low-value content", "Faster access to meaningful answers", "Knowledge tailored to both context and credibility"].map((b) => (
                <li key={b} className="flex items-start gap-4 group cursor-default">
                  <div className="w-5 h-5 rounded-full border border-cyan-400/25 bg-cyan-400/[0.04] flex items-center justify-center text-[10px] text-cyan-300/80 font-bold shrink-0 mt-0.5 group-hover:border-cyan-400/50 group-hover:bg-cyan-400/10 transition-all duration-300">✓</div>
                  <span className="text-sm leading-relaxed text-white/60 font-light group-hover:text-white/80 transition-colors duration-300">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div data-line-grow className="h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════
          9) VIDEO ECOSYSTEM
      ═══════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-24 md:py-36">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div data-fade className="lg:col-span-6 lg:order-2 space-y-6">
            <span data-scan className="inline-block text-[10px] tracking-[0.45em] uppercase text-violet-400/70 border border-violet-400/10 rounded-full px-4 py-1.5 bg-violet-400/[0.04] font-semibold shimmer">
              Ecosystem
            </span>
            <h2 data-chars className="mt-4 font-[var(--font-playfair)] text-3xl md:text-5xl text-white/92 leading-tight font-extralight">
              A Smarter Way to Discover Video Knowledge
            </h2>
            <p className="text-base leading-relaxed text-white/52 font-light">
              Instead of endless scrolling, Noorva helps you discover high-quality, expert-backed videos that match your exact intent. Natural prompts, credibility checks, and mood-aware discovery transform video consumption into something intentional.
            </p>
          </div>
          <div data-card-grid className="lg:col-span-6 lg:order-1 p-8 md:p-12 rounded-3xl gradient-border relative overflow-hidden scanlines">
            <h3 className="text-xs tracking-widest uppercase text-violet-300/55 font-mono font-semibold mb-9">Inside the video ecosystem</h3>
            <ul className="space-y-5">
              {["Precise natural-language video search", "Smart reminders for videos and categories", "Verified creator discovery", "Cross-platform expert content access", "Personalized recommendation flow", "Intelligent creator context & dynamic prompts"].map((item) => (
                <li data-card key={item} className="flex items-start gap-4 group cursor-default">
                  <div className="w-5 h-5 rounded-full border border-violet-400/25 bg-violet-400/[0.04] flex items-center justify-center text-[10px] text-violet-300/80 font-bold shrink-0 mt-0.5 group-hover:border-violet-400/50 group-hover:bg-violet-400/10 transition-all duration-300">✓</div>
                  <span className="text-sm leading-relaxed text-white/58 font-light group-hover:text-white/78 transition-colors duration-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div data-line-grow className="h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════
          10) WHY DIFFERENT
      ═══════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-24 md:py-36">
        <div data-fade className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span data-scan className="inline-block text-[10px] tracking-[0.45em] uppercase text-cyan-200/50 mb-5 border border-cyan-200/10 rounded-full px-4 py-1.5 bg-cyan-200/[0.04] font-semibold shimmer">
            Differentiation
          </span>
          <h2 data-chars className="mt-4 font-[var(--font-playfair)] text-3xl md:text-5xl text-white/92 leading-tight font-extralight">
            Why Noorva Feels Different
          </h2>
          <p data-fade data-delay="0.1" className="mt-6 text-sm text-white/42 leading-relaxed font-light">
            Not another app with AI added on top — a living intelligence layer for a person&apos;s day-to-day life.
          </p>
        </div>
        <div data-card-grid className="grid md:grid-cols-2 lg:grid-cols-5 gap-5 max-w-6xl mx-auto">
          {[
            "Learns through natural interaction, not just clicks and commands",
            "Supports goals, routines, tasks, and life organization — not only chat",
            "Uses mood and timing to make interaction feel relevant and non-intrusive",
            "Prioritizes trustworthy information and expert-backed guidance",
            "Brings together productivity, knowledge, and companionship in one experience",
          ].map((item, idx) => (
            <div data-card key={idx} className="tilt-card group p-7 rounded-2xl border border-white/[0.05] bg-[#030208] flex flex-col justify-between min-h-[220px] cursor-default transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/18 relative overflow-hidden shimmer">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: "radial-gradient(circle at 20% 20%,rgba(8,145,178,0.07),transparent 60%)" }} />
              <span className="text-xs font-mono text-cyan-400/40 font-semibold tracking-widest">[ 0{idx + 1} ]</span>
              <p className="text-sm leading-relaxed text-white/52 font-light mt-6 group-hover:text-white/70 transition-colors duration-300">{item}</p>
              <div className="mt-5 h-px w-6 bg-gradient-to-r from-cyan-400/30 to-transparent group-hover:w-14 transition-all duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          11) EMOTIONAL BRAND
      ═══════════════════════════════════════ */}
      <section className="relative py-32 md:py-48 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-12">
          <div className="absolute w-[800px] h-[800px] rounded-full border border-violet-400/20 animate-ping" style={{ animationDuration: "7s" }} />
          <div className="absolute w-[550px] h-[550px] rounded-full border border-cyan-400/15 animate-ping" style={{ animationDuration: "9s", animationDelay: "2.5s" }} />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-violet-300/20 animate-ping" style={{ animationDuration: "5s", animationDelay: "1s" }} />
        </div>
        <div data-fade className="relative z-10 mx-auto max-w-4xl px-6 md:px-12 text-center">
          <h2 data-chars className="font-[var(--font-playfair)] text-4xl md:text-6xl lg:text-7xl leading-tight text-white font-extralight">
            Technology That Feels Personal
          </h2>
          <div data-scan className="mx-auto my-8 h-px w-48 bg-gradient-to-r from-transparent via-white/18 to-transparent" />
          <p data-fade data-delay="0.1" className="text-lg md:text-xl leading-relaxed text-white/62 font-light max-w-3xl mx-auto">
            The future of AI is not colder, louder, or more overwhelming. It is calmer, more intelligent, more human, and more aligned with the way real life actually works.
          </p>
          <p data-fade data-delay="0.2" className="mt-6 text-sm leading-relaxed text-white/35 font-light max-w-2xl mx-auto">
            Noorva is being built for that future — where technology understands people more deeply, respects their time more carefully, and supports their lives more meaningfully.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div data-line-grow className="h-px bg-gradient-to-r from-transparent via-white/7 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════
          12) MISSION & VISION
      ═══════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-24 md:py-36 grid md:grid-cols-2 gap-12 md:gap-24">
        {[
          { label: "Our Purpose", color: "text-cyan-200/50 border-cyan-200/10 bg-cyan-200/[0.04]", title: "Our Mission", body: "To create a digital companion experience that is always with us — one that lives alongside people, understands them deeply, and helps them lead smarter, more productive, more intentional, and more fulfilling daily lives." },
          { label: "Our Aspiration", color: "text-violet-400/70 border-violet-400/10 bg-violet-400/[0.04]", title: "Our Vision", body: "We believe AI should not stop at utility. It should evolve into something more supportive, more emotionally aware, more trustworthy, and more integrated into the everyday human experience. Noorva is our step toward that future." },
        ].map(({ label, color, title, body }) => (
          <div data-fade key={title} className="space-y-6">
            <span data-scan className={`inline-block text-[10px] tracking-[0.45em] uppercase border rounded-full px-4 py-1.5 font-semibold shimmer ${color}`}>{label}</span>
            <h3 data-chars className="mt-4 font-[var(--font-playfair)] text-3xl md:text-4xl text-white/95 leading-tight font-extralight">{title}</h3>
            <p className="text-base leading-relaxed text-white/48 font-light">{body}</p>
          </div>
        ))}
      </section>

      {/* ═══════════════════════════════════════
          13) FINAL CTA
      ═══════════════════════════════════════ */}
      <section className="relative border-t border-white/[0.04] mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-24 md:py-36 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[500px] h-[500px] rounded-full border border-cyan-400/30 animate-ping" style={{ animationDuration: "5.5s" }} />
          </div>
        </div>
        <div data-fade className="relative z-10 flex flex-col items-center">
          <h2 data-chars className="font-[var(--font-playfair)] text-4xl md:text-6xl lg:text-7xl leading-tight text-white font-extralight">
            Step Into the Noorva Experience
          </h2>
          <div data-scan className="mx-auto my-8 h-px w-32 bg-gradient-to-r from-transparent via-white/18 to-transparent" />
          <p data-fade data-delay="0.1" className="text-base md:text-lg leading-relaxed text-white/52 font-light max-w-xl">
            Discover a more personal, proactive, and human way to interact with AI.
          </p>
          <div data-fade data-delay="0.2" className="mt-12 flex flex-col sm:flex-row gap-5 items-center">
            <a href="#" className="mag-btn group relative inline-flex items-center justify-center rounded-full overflow-hidden font-semibold text-sm tracking-wider uppercase px-10 py-5 neon-glow transition-all duration-300 hover:scale-105"
              style={{ background: "linear-gradient(135deg,#7c5cfc,#4fa8d5)" }}>
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <span className="relative text-white flex items-center gap-2">Experience Noorva <span className="opacity-60">→</span></span>
            </a>
            <a href="#" className="mag-btn group inline-flex items-center gap-3 rounded-full border border-white/10 text-white/65 font-medium text-sm tracking-wider uppercase px-10 py-5 transition-all duration-400 hover:text-white hover:border-white/22 hover:bg-white/[0.025]">
              Join the Journey <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          14) FOOTER
      ═══════════════════════════════════════ */}
      <footer className="relative border-t border-white/[0.04] mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-12 flex flex-col md:flex-row md:justify-between items-center gap-6">
        <span className="font-[var(--font-playfair)] text-2xl font-extralight tracking-wide glitch" data-text="Noorva">Noorva</span>
        <p className="text-xs md:text-sm text-white/35 text-center font-light tracking-wide max-w-md">
          Noorva — The AI companion that learns you, guides you, and grows with you.
        </p>
        <span className="text-[10px] tracking-widest text-white/16 uppercase font-mono">© {new Date().getFullYear()} Noorva</span>
      </footer>
    </div>
  );
}
