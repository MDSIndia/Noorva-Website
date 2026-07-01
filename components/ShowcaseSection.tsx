"use client";

import Image from "next/image";
import bg1 from "../assets/images/background image 1.png";
import bg2 from "../assets/images/background image 2.png";
import bg3 from "../assets/images/background image 3.png";
import bg4 from "../assets/images/background image 4.png";

const STATS = [
  { value: "1.8s", label: "Response pulse" },
  { value: "98%", label: "Predictive clarity" },
  { value: "24/7", label: "Adaptive presence" },
];

const QUICK_FEATURES = [
  "Neon glass interface",
  "Dynamic insight layers",
  "Cinematic data flow",
];

export default function ShowcaseSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#03030d] text-white grain animate-float-slow">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(76,157,255,0.16),_transparent_24%),radial-gradient(circle_at_80%_20%,_rgba(186,98,255,0.12),_transparent_18%),linear-gradient(180deg,_#050711_0%,_#090c1d_45%,_#02030a_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,_rgba(255,255,255,0.03)_0%,_transparent_24%,_rgba(255,255,255,0.02)_100%)]" />
      <div className="absolute inset-0 border border-white/5 opacity-60" />

      <div className="relative mx-auto grid min-h-[92vh] max-w-[1480px] items-center gap-12 px-6 py-20 sm:px-8 lg:grid-cols-[0.44fr_0.56fr] lg:px-12">
        <div className="space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-cyan-100/85 shadow-[0_16px_60px_rgba(65,196,255,0.16)]">
            premium command deck
          </span>

          <div className="space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Noorva now lives in a futuristic control interface.
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-300/80 sm:text-lg">
              A premium, cinematic layout with glass panels, neon accents, and a polished intelligence dashboard that feels like the future of personal guidance.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <a href="#" className="btn-glow inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_24px_90px_rgba(61,200,255,0.22)] transition duration-300 hover:-translate-y-0.5">
              launch preview
            </a>
            <a href="#" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white/85 transition duration-300 hover:bg-white/10">
              view interface
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
                <p className="text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {QUICK_FEATURES.map((feature) => (
              <div key={feature} className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-slate-200 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="pointer-events-none absolute -left-10 top-10 hidden h-24 w-24 rounded-full bg-cyan-500/12 blur-3xl lg:block" />
          <div className="pointer-events-none absolute -right-10 bottom-10 h-28 w-28 rounded-full bg-violet-500/12 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-1/2 hidden h-[18rem] w-[18rem] -translate-y-1/2 rounded-full border border-cyan-300/10 blur-2xl lg:block" />

          <div className="relative w-full max-w-[700px] rounded-[2.5rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_90px_160px_rgba(0,0,0,0.36)] backdrop-blur-2xl gradient-border animate-float-slow neon-glow">
            <div className="absolute inset-x-6 top-6 flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-xs uppercase tracking-[0.28em] text-white/70 shadow-[0_16px_40px_rgba(8,12,25,0.45)]">
              <span>live neural mesh</span>
              <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-cyan-200">active</span>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-[#070b24] shadow-[inset_0_0_90px_rgba(63,129,255,0.16)] h-[62vh] min-h-[420px]">
              <Image
                src={bg4}
                alt="Noorva premium interface"
                fill
                className="object-cover brightness-[0.95] contrast-[1.04]"
                sizes="(max-width: 768px) 100vw, 700px"
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(7,14,38,0.55),transparent_42%)]" />

              <div className="absolute left-6 bottom-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/85 px-4 py-3 text-sm shadow-[0_24px_70px_rgba(0,0,0,0.30)]">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">signal flow</p>
                  <p className="mt-2 text-base font-semibold">98.7%</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/85 px-4 py-3 text-sm shadow-[0_24px_70px_rgba(0,0,0,0.30)]">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">latency</p>
                  <p className="mt-2 text-base font-semibold">42ms</p>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 space-y-4 lg:block">
              {[bg1, bg2, bg3].map((img, index) => (
                <div key={index} className="relative h-24 w-28 overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/65 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
                  <Image src={img} alt={`Accent frame ${index + 1}`} fill className="object-cover brightness-[0.95] contrast-[1.05]" sizes="112px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
