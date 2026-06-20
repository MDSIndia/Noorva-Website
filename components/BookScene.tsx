"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BOOK_SCENE_VH } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BLANK_PAGES   = 5;    // endpaper flips — crammed into a tiny scroll band
const CONTENT_PAGES = 7;    // real content sections
const TOTAL_PAGES   = BLANK_PAGES + CONTENT_PAGES;  // 12

const SETTLE_END = 0.08;
const OPEN_END   = 0.18;   // cover opens
// All 5 blank pages are compressed into 4 % of total scroll (≈ 32 vh at 800 vh)
// → each blank page = 0.8 % ≈ 6–7 vh.  One trackpad swipe covers all five.
const BLANK_END  = 0.22;

const CYAN      = "#00D4FF";
const GREEN     = "#00FF88";
const TEXT      = "#E8F4FF";
const TEXT_MID  = "#7AA8C8";
const TEXT_SOFT = "#3A5870";

// Clean dark page — no grid noise
const PAGE_BG = `
  radial-gradient(ellipse 130% 80% at 12% 8%,  rgba(0,100,200,0.09) 0%, transparent 55%),
  radial-gradient(ellipse  80% 60% at 88% 92%, rgba(0,180,255,0.05) 0%, transparent 50%),
  linear-gradient(158deg, #070E1C 0%, #050B16 45%, #060D1A 100%)
`;
const COVER_BG = `
  radial-gradient(ellipse 100% 80% at 50% 38%, rgba(0,80,160,0.14) 0%, transparent 65%),
  linear-gradient(148deg, #030609 0%, #04091400 35%, #030710 55%, #050B17 80%, #030609 100%)
`;

// ─── Math helpers ─────────────────────────────────────────────────────────────
const eio   = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;

function easeOutBounce(t: number): number {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1/d1)   return n1*t*t;
  if (t < 2/d1)   return n1*(t -= 1.5/d1)*t + 0.75;
  if (t < 2.5/d1) return n1*(t -= 2.25/d1)*t + 0.9375;
  return n1*(t -= 2.625/d1)*t + 0.984375;
}

interface BookState {
  settleT: number; openT: number;
  pageIdx: number; flipT: number; isLast: boolean;
}

function parseProgress(p: number): BookState {
  // Phase 1 — book falls & settles
  if (p < SETTLE_END)
    return { settleT: p/SETTLE_END, openT:0, pageIdx:0, flipT:0, isLast:false };

  // Phase 2 — cover swings open
  const openT = clamp((p - SETTLE_END)/(OPEN_END - SETTLE_END), 0, 1);
  if (p < OPEN_END)
    return { settleT:1, openT, pageIdx:0, flipT:0, isLast:false };

  // Phase 3 — blank endpaper flips (ultra-compressed: 4 % of total scroll)
  if (p < BLANK_END) {
    const bp   = (p - OPEN_END) / (BLANK_END - OPEN_END);  // 0 → 1
    const bpf  = bp * BLANK_PAGES;
    const bidx = Math.min(Math.floor(bpf), BLANK_PAGES - 1);
    const bloc = bpf - Math.floor(bpf);
    // No dwell at all — the full slot is the flip
    return {
      settleT:1, openT:1,
      pageIdx: bidx, flipT: eio(Math.min(bloc / 0.88, 1)),
      isLast: false,
    };
  }

  // Phase 4 — 7 content pages, each with a comfortable dwell
  const pp   = (p - BLANK_END) / (1 - BLANK_END);
  const pf   = pp * CONTENT_PAGES;
  const raw  = Math.floor(pf);
  const cidx = Math.min(raw, CONTENT_PAGES - 1);
  const loc  = pf - raw;
  let flipT = 0;
  if (loc > 0.65) flipT = 1;
  else            flipT = clamp(loc / 0.65, 0, 1);
  return {
    settleT:1, openT:1,
    pageIdx: BLANK_PAGES + cidx,
    flipT: eio(flipT),
    isLast: cidx >= CONTENT_PAGES - 1 && loc > 0.85,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE REVEAL
// ─────────────────────────────────────────────────────────────────────────────

function W({ d = 0, dur = 1.8, children, s }: {
  d?: number; dur?: number; children: React.ReactNode; s?: React.CSSProperties;
}) {
  return (
    <div style={{ animation:`penWrite ${dur}s ${d}s ease-out both`, ...s }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA CURSOR  — sweeps along actual text lines only
// ─────────────────────────────────────────────────────────────────────────────

// Each entry: [x1%, x2%, y%] — one text line in the page coordinate space
type LineMap = [number, number, number][];

// Lines for the two-column content pages (P1-P6)
// x range matches the ContentCol; y positions match each rendered text element
const LINES_CONTENT: LineMap = [
  [22, 52, 30],  // module tag  (short, left-aligned)
  [22, 75, 38],  // heading line 1
  [22, 58, 46],  // heading line 2
  [22, 68, 53],  // divider / transition
  [22, 85, 58],  // body line 1
  [22, 85, 63],  // body line 2
  [22, 52, 70],  // feature col-1 row 1
  [54, 85, 70],  // feature col-2 row 1
  [22, 52, 77],  // feature col-1 row 2
  [54, 85, 77],  // feature col-2 row 2
];

// Lines for the centred title page (P0)
const LINES_TITLE: LineMap = [
  [32, 68, 36],  // init tag
  [36, 64, 44],  // logo area
  [36, 64, 51],  // NOORVA heading
  [36, 64, 58],  // divider
  [25, 75, 64],  // description line 1
  [28, 72, 69],  // description line 2
  [36, 64, 76],  // build tag
];

// Lines for the roadmap page (P5) — timeline rows
const LINES_ROADMAP: LineMap = [
  [22, 52, 30],  // module tag
  [22, 72, 38],  // heading line 1
  [22, 55, 46],  // heading line 2
  [22, 68, 53],  // divider
  [22, 82, 58],  // quote line 1
  [22, 72, 63],  // quote line 2
  [22, 85, 70],  // timeline row 1
  [22, 85, 76],  // timeline row 2
  [22, 85, 82],  // timeline row 3
  [22, 75, 88],  // timeline row 4
];

// Lines for the sign-up page (P6) — form fields
const LINES_SIGNUP: LineMap = [
  [22, 52, 30],  // module tag
  [22, 72, 38],  // heading line 1
  [22, 55, 46],  // heading line 2
  [22, 68, 53],  // divider
  [22, 80, 59],  // body text
  [22, 62, 64],  // body text line 2
  [22, 72, 72],  // email input
  [22, 72, 80],  // submit button
];

function DataCursor({ wKey, lines = LINES_CONTENT }: { wKey: number; lines?: LineMap }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const start = performance.now();
    const N       = lines.length;
    const TOTAL_S = N * 0.72;  // ~0.72 s per line → smooth but not sluggish
    let id: number;
    function tick(now: number) {
      const t  = Math.min((now - start) / 1000 / TOTAL_S, 1);
      const lf = t * N;
      const li = Math.min(Math.floor(lf), N - 1);
      if (li < 0 || !lines[li]) { if (t < 1) id = requestAnimationFrame(tick); return; }
      const lt = lf - li;
      const [x1, x2, y] = lines[li];
      const x = lerp(x1, x2, lt);        // left → right across this line
      if (ref.current) {
        ref.current.style.left    = `${x}%`;
        ref.current.style.top     = `${y}%`;
        ref.current.style.opacity = t < 0.97 ? "1" : "0";
      }
      if (t < 1) id = requestAnimationFrame(tick);
    }
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [wKey, lines]);

  return (
    <div ref={ref} style={{
      position:"absolute", zIndex:60, pointerEvents:"none",
      transform:"translate(-50%,-50%)", opacity:0, willChange:"left,top",
    }}>
      {/* Crosshair */}
      <div style={{ position:"relative", width:"18px", height:"18px" }}>
        <div style={{ position:"absolute", top:"50%", left:0, right:0, height:"1px",
          background:CYAN, transform:"translateY(-50%)",
          boxShadow:`0 0 5px ${CYAN}, 0 0 14px ${CYAN}` }}/>
        <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:"1px",
          background:CYAN, transform:"translateX(-50%)",
          boxShadow:`0 0 5px ${CYAN}, 0 0 14px ${CYAN}` }}/>
        <div style={{ position:"absolute", inset:"5px", border:`1px solid ${CYAN}`,
          boxShadow:`0 0 8px ${CYAN}60` }}/>
      </div>
      {/* Core dot */}
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        width:"5px", height:"5px", borderRadius:"50%",
        background:CYAN, boxShadow:`0 0 8px ${CYAN}, 0 0 24px ${CYAN}80`,
      }}/>
      {/* Trailing line */}
      <div style={{
        position:"absolute", top:"50%", right:"100%", marginRight:"2px",
        width:"20px", height:"1px",
        background:`linear-gradient(to left, ${CYAN}88, transparent)`,
        transform:"translateY(-50%)",
      }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SHELL
// ─────────────────────────────────────────────────────────────────────────────

function PageShell({ children, cursor }: { children: React.ReactNode; cursor?: React.ReactNode }) {
  return (
    <div style={{
      width:"100%", height:"100%",
      background:PAGE_BG,
      position:"relative", overflow:"hidden",
      display:"flex", alignItems:"stretch",
    }}>
      {/* Subtle top border line */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px",
        background:`linear-gradient(90deg, transparent 0%, ${CYAN}40 30%, ${CYAN}55 50%, ${CYAN}40 70%, transparent 100%)` }}/>
      {/* Subtle bottom border line */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"1px",
        background:`linear-gradient(90deg, transparent 0%, ${CYAN}20 40%, ${CYAN}30 50%, ${CYAN}20 60%, transparent 100%)` }}/>
      {children}
      {cursor}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ACCENT COLUMN (left decorative zone)
// ─────────────────────────────────────────────────────────────────────────────

function AccentCol({ number, icon }: { number: string; icon: React.ReactNode }) {
  return (
    <div style={{
      width:"clamp(80px, 18%, 140px)", flexShrink:0,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      position:"relative", gap:"20px",
      borderRight:`1px solid ${CYAN}18`,
    }}>
      {/* Watermark number */}
      <div style={{
        position:"absolute",
        fontSize:"clamp(80px, 12vw, 130px)",
        fontFamily:"monospace", fontWeight:900,
        color:CYAN, opacity:0.05,
        userSelect:"none", lineHeight:1, pointerEvents:"none",
        top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        whiteSpace:"nowrap",
      }}>{number}</div>
      {/* Icon */}
      <div style={{ position:"relative", zIndex:1, opacity:0.65 }}>{icon}</div>
      {/* Module number label */}
      <div style={{
        position:"absolute", bottom:"22px",
        fontSize:"8px", letterSpacing:"0.20em",
        color:TEXT_SOFT, fontFamily:"monospace",
        writingMode:"vertical-rl", textOrientation:"mixed",
        transform:"rotate(180deg)",
      }}>{number}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE CONTENT COLUMN (right)
// ─────────────────────────────────────────────────────────────────────────────

function ContentCol({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      justifyContent:"center",
      alignItems: center ? "center" : "flex-start",
      padding:"clamp(20px, 3.5vh, 40px) clamp(20px, 3vw, 42px)",
      textAlign: center ? "center" : "left",
      position:"relative",
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const tag = (label: string) => (
  <div style={{
    fontSize:"8px", letterSpacing:"0.28em",
    textTransform:"uppercase", color:CYAN, opacity:0.85,
    fontFamily:"monospace", marginBottom:"14px",
  }}>{'>'} {label}</div>
);

const heading = (line1: string, line2?: string) => (
  <div style={{
    fontSize:"clamp(32px, 4.2vw, 50px)",
    fontFamily:"var(--font-inter), sans-serif",
    fontWeight:800, color:TEXT, lineHeight:1.1,
    letterSpacing:"-0.02em", marginBottom:"16px",
  }}>
    {line1}{line2 && <><br/>{line2}</>}
  </div>
);

const divLine = () => (
  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
    <div style={{ flex:1, height:"1px", background:`linear-gradient(90deg, ${CYAN}50, transparent)` }}/>
    <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:CYAN, boxShadow:`0 0 6px ${CYAN}` }}/>
    <div style={{ width:"40px", height:"1px", background:`${CYAN}30` }}/>
  </div>
);

const body = (text: string) => (
  <p style={{
    fontSize:"clamp(12px, 1.45vw, 15px)",
    fontFamily:"var(--font-inter), sans-serif",
    color:TEXT_MID, lineHeight:1.80,
    marginBottom:"20px", maxWidth:"420px",
  }}>{text}</p>
);

const featGrid = (items: string[]) => (
  <div style={{
    display:"grid",
    gridTemplateColumns: items.length > 2 ? "1fr 1fr" : "1fr",
    gap:"8px 24px",
  }}>
    {items.map((t, i) => (
      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"8px" }}>
        <span style={{
          flexShrink:0, marginTop:"3px", width:"16px", height:"16px",
          border:`1px solid ${CYAN}50`, borderRadius:"2px",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <span style={{ width:"5px", height:"5px", borderRadius:"1px", background:CYAN, boxShadow:`0 0 4px ${CYAN}` }}/>
        </span>
        <span style={{
          fontSize:"clamp(11px, 1.3vw, 13px)",
          fontFamily:"var(--font-inter), sans-serif",
          color:TEXT_MID, lineHeight:1.55,
        }}>{t}</span>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────────────────────────────────────

const IconNeural = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <circle cx="22" cy="22" r="5" stroke={CYAN} strokeWidth="1"/>
    {[[8,8],[36,8],[8,36],[36,36],[22,5],[22,39]].map(([cx,cy],i) => (
      <g key={i}>
        <circle cx={cx} cy={cy} r="2.5" stroke={CYAN} strokeWidth="0.8" opacity="0.7"/>
        <line x1="22" y1="22" x2={cx} y2={cy} stroke={CYAN} strokeWidth="0.5" opacity="0.35"/>
      </g>
    ))}
  </svg>
);
const IconUser = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <circle cx="22" cy="14" r="6" stroke={CYAN} strokeWidth="1"/>
    <path d="M10 38 Q10 26 22 26 Q34 26 34 38" stroke={CYAN} strokeWidth="1" fill="none"/>
    <circle cx="22" cy="14" r="2" fill={CYAN} opacity="0.4"/>
  </svg>
);
const IconBrain = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <ellipse cx="22" cy="22" rx="14" ry="12" stroke={CYAN} strokeWidth="0.9"/>
    <path d="M22 10 C26 14 26 18 22 20 C18 22 18 26 22 30" stroke={CYAN} strokeWidth="0.8" fill="none" opacity="0.6"/>
    <path d="M12 18 C15 18 17 22 15 24" stroke={CYAN} strokeWidth="0.7" fill="none" opacity="0.5"/>
    <path d="M32 18 C29 18 27 22 29 24" stroke={CYAN} strokeWidth="0.7" fill="none" opacity="0.5"/>
    <circle cx="22" cy="22" r="2" fill={CYAN} opacity="0.5"/>
  </svg>
);
const IconHeart = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <path d="M8 26 L14 26 L18 16 L22 34 L26 22 L29 26 L36 26" stroke={CYAN} strokeWidth="1.2" fill="none"/>
    <circle cx="8" cy="26" r="1.5" fill={CYAN} opacity="0.6"/>
    <circle cx="36" cy="26" r="1.5" fill={CYAN} opacity="0.6"/>
  </svg>
);
const IconNet = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <circle cx="22" cy="22" r="3.5" stroke={CYAN} strokeWidth="0.9"/>
    {[[8,8],[36,8],[8,36],[36,36],[22,6]].map(([cx,cy],i) => (
      <g key={i}>
        <circle cx={cx} cy={cy} r="2.8" stroke={CYAN} strokeWidth="0.7" opacity="0.65"/>
        <line x1="22" y1="22" x2={cx} y2={cy} stroke={CYAN} strokeWidth="0.5" opacity="0.35" strokeDasharray={i%2?"3,2":"4,2"}/>
      </g>
    ))}
  </svg>
);
const IconTimeline = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <line x1="8" y1="22" x2="36" y2="22" stroke={CYAN} strokeWidth="0.7" opacity="0.4"/>
    {[10,18,26,34].map((x,i) => (
      <g key={i}>
        <circle cx={x} cy="22" r="3" stroke={CYAN} strokeWidth="0.8" opacity="0.8"/>
        <line x1={x} y1="22" x2={x} y2={i%2===0?14:30} stroke={CYAN} strokeWidth="0.6" opacity="0.4"/>
        <circle cx={x} cy={i%2===0?14:30} r="1.5" fill={CYAN} opacity="0.4"/>
      </g>
    ))}
  </svg>
);
const IconSend = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <path d="M10 34 L34 10 M34 10 L18 10 M34 10 L34 26" stroke={CYAN} strokeWidth="1.1" fill="none" opacity="0.85"/>
    <circle cx="10" cy="34" r="2.5" fill={CYAN} opacity="0.5"/>
    <line x1="10" y1="34" x2="18" y2="26" stroke={CYAN} strokeWidth="1.4" opacity="0.35"/>
  </svg>
);

const ICONS = [IconNeural, IconUser, IconBrain, IconHeart, IconNet, IconTimeline, IconSend];
const NUMS  = ["00","01","02","03","04","05","06"];
const TAGS  = [
  "system.initialize()",
  "module_01.ts",
  "module_02.ts",
  "module_03.ts",
  "module_04.ts",
  "roadmap.json",
  "access.request()",
];

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 0  ─  Title page
// ─────────────────────────────────────────────────────────────────────────────

function P0({ wKey }: { wKey: number }) {
  return (
    <PageShell cursor={<DataCursor wKey={wKey} lines={LINES_TITLE}/>}>
      <div key={wKey} style={{ flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"40px 32px", gap:"0" }}>

        <W d={0} dur={0.8} s={{ marginBottom:"18px" }}>
          <div style={{ fontSize:"8px", letterSpacing:"0.30em", textTransform:"uppercase",
            color:TEXT_SOFT, fontFamily:"monospace" }}>{'>'} system.initialize()</div>
        </W>

        <W d={0.5} dur={1.4} s={{ marginBottom:"6px" }}>
          <img src="/NoorvaLogo.png" alt="Noorva"
            style={{ height:"32px", width:"auto", objectFit:"contain",
              filter:"brightness(0.9) saturate(0.3) hue-rotate(185deg)", opacity:0.75 }}/>
        </W>

        <W d={1.1} dur={0.5} s={{ marginBottom:"18px" }}>
          <div style={{ width:"56px", height:"1px",
            background:`linear-gradient(90deg, transparent, ${CYAN}70, transparent)` }}/>
        </W>

        <W d={1.5} dur={2.0} s={{ marginBottom:"18px" }}>
          <div style={{
            fontSize:"clamp(52px, 7vw, 80px)",
            fontFamily:"var(--font-inter), sans-serif",
            fontWeight:900, color:TEXT, letterSpacing:"0.18em",
            textTransform:"uppercase", lineHeight:1,
            textShadow:`0 0 60px ${CYAN}50, 0 0 20px ${CYAN}30`,
          }}>NOORVA</div>
        </W>

        <W d={2.8} dur={0.5} s={{ marginBottom:"18px" }}>
          <div style={{ width:"56px", height:"1px",
            background:`linear-gradient(90deg, transparent, ${CYAN}70, transparent)` }}/>
        </W>

        <W d={3.2} dur={2.0} s={{ marginBottom:"28px" }}>
          <div style={{ fontSize:"clamp(12px, 1.5vw, 15px)",
            fontFamily:"var(--font-inter), sans-serif",
            color:TEXT_MID, lineHeight:1.75, textAlign:"center", maxWidth:"340px" }}>
            A new era of Human‑AI connection — where intelligence becomes wisdom,
            and technology becomes a companion for life.
          </div>
        </W>

        <W d={4.2} dur={1.5}>
          <div style={{ display:"flex", alignItems:"center", gap:"16px",
            fontSize:"8px", letterSpacing:"0.22em", color:TEXT_SOFT, fontFamily:"monospace" }}>
            <span>build 2025.1</span>
            <div style={{ width:"3px", height:"3px", borderRadius:"50%", background:`${CYAN}50` }}/>
            <span>alpha</span>
          </div>
        </W>
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT PAGES P1–P4  (shared two-zone layout)
// ─────────────────────────────────────────────────────────────────────────────

interface PageData {
  h1: string; h2?: string;
  desc: string;
  features: string[];
}

const CONTENT: PageData[] = [
  {
    h1:"Your AI", h2:"Companion",
    desc:"Not another chatbot — Noorva is a living presence that grows alongside you through every chapter of life. A guide, mentor, and confidant unlike any other.",
    features:["Remembers your full journey & context","Adapts to your unique voice & personality","Grows wiser with every conversation","Understands emotion, not just language"],
  },
  {
    h1:"Ancient Wisdom,", h2:"Infinite Knowledge",
    desc:"Like a sage who has witnessed centuries of human experience, Noorva draws from the deepest wells of knowledge to illuminate your path.",
    features:["Access to vast, curated knowledge domains","Contextual wisdom tailored to your moment","Learns from the world's greatest thinkers","Guides with clarity, not just information"],
  },
  {
    h1:"The Language", h2:"of the Heart",
    desc:"Noorva reads between the lines — understanding not merely what you say, but how you truly feel. Your joys, anxieties, and dreams are understood with rare emotional intelligence.",
    features:["Real-time emotional resonance detection","Adaptive tone for every mood & moment","Mental wellness awareness and support","Responds with empathy, not algorithms"],
  },
  {
    h1:"A Living", h2:"Ecosystem",
    desc:"Seamlessly woven into the fabric of your digital life, Noorva connects, integrates, and orchestrates the tools that matter most.",
    features:["Connects all your apps & workflows","Intelligent source filtering & curation","Cross-platform memory and continuity","Orchestrates your entire digital universe"],
  },
];

function ContentPage({ idx, wKey }: { idx: number; wKey: number }) {
  const d   = CONTENT[idx - 1];
  const Ico = ICONS[idx];
  return (
    <PageShell cursor={<DataCursor wKey={wKey}/>}>
      <AccentCol number={NUMS[idx]} icon={<Ico/>}/>
      <ContentCol>
        <div key={wKey}>
          <W d={0}   dur={0.7}>{tag(TAGS[idx])}</W>
          <W d={0.5} dur={1.5}>{heading(d.h1, d.h2)}</W>
          <W d={1.3} dur={0.5}>{divLine()}</W>
          <W d={1.7} dur={2.0}>{body(d.desc)}</W>
          <W d={2.6} dur={2.5}>{featGrid(d.features)}</W>
        </div>
      </ContentCol>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 5  ─  Roadmap
// ─────────────────────────────────────────────────────────────────────────────

const ROAD = [
  { q:"Q3 2025", t:"Early Access Launch",   done:true  },
  { q:"Q4 2025", t:"Voice & Vision",         done:false },
  { q:"Q1 2026", t:"Noorva Mobile",          done:false },
  { q:"2026 +",  t:"Neural Integration",     done:false },
];

function P5({ wKey }: { wKey: number }) {
  return (
    <PageShell cursor={<DataCursor wKey={wKey} lines={LINES_ROADMAP}/>}>
      <AccentCol number="05" icon={<IconTimeline/>}/>
      <ContentCol>
        <div key={wKey}>
          <W d={0}   dur={0.7}>{tag(TAGS[5])}</W>
          <W d={0.5} dur={1.5}>{heading("Tomorrow's", "Horizon")}</W>
          <W d={1.3} dur={0.5}>{divLine()}</W>
          <W d={1.7} dur={1.8}>
            {body(`"The world where AI and human wisdom move as one is no longer a distant dream."`)}
          </W>
          <W d={2.5} dur={2.8}>
            <div style={{ display:"flex", flexDirection:"column", gap:"14px", marginTop:"4px" }}>
              {ROAD.map(({ q, t, done }) => (
                <div key={q} style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <div style={{
                    width:"6px", height:"6px", borderRadius:"50%", flexShrink:0,
                    background: done ? GREEN : "transparent",
                    border: done ? "none" : `1px solid ${CYAN}50`,
                    boxShadow: done ? `0 0 8px ${GREEN}` : "none",
                  }}/>
                  <div style={{ flex:1, height:"1px",
                    background: done ? `${GREEN}50` : `${CYAN}20` }}/>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <span style={{
                      fontSize:"8px", letterSpacing:"0.12em", fontFamily:"monospace",
                      color: done ? GREEN : TEXT_SOFT, flexShrink:0
                    }}>{q}</span>
                    <span style={{
                      fontSize:"clamp(11px, 1.3vw, 13px)",
                      fontFamily:"var(--font-inter), sans-serif",
                      color: done ? GREEN : TEXT_MID
                    }}>{t}</span>
                    {done && (
                      <span style={{ fontSize:"10px", color:GREEN, fontFamily:"monospace" }}>✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </W>
        </div>
      </ContentCol>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 6  ─  Sign-up
// ─────────────────────────────────────────────────────────────────────────────

function P6({ wKey }: { wKey: number }) {
  const [email, setEmail] = useState("");
  const [done, setDone]   = useState(false);
  return (
    <PageShell cursor={<DataCursor wKey={wKey} lines={LINES_SIGNUP}/>}>
      <AccentCol number="06" icon={<IconSend/>}/>
      <ContentCol>
        <div key={wKey}>
          <W d={0}   dur={0.7}>{tag(TAGS[6])}</W>
          <W d={0.5} dur={1.5}>{heading("Begin Your", "Journey")}</W>
          <W d={1.3} dur={0.5}>{divLine()}</W>
          <W d={1.7} dur={2.0}>
            {body("The book is open. The first chapter of your Noorva journey awaits. Reserve your place in the network.")}
          </W>
          <W d={2.6} dur={2.0}>
            {!done ? (
              <form onSubmit={e => { e.preventDefault(); if (email.trim()) setDone(true); }}
                style={{ display:"flex", flexDirection:"column", gap:"10px", maxWidth:"320px" }}>
                <input
                  type="email" value={email} required
                  placeholder="your@email.com"
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    padding:"12px 16px",
                    background:`rgba(0,212,255,0.06)`,
                    border:`1px solid ${CYAN}40`,
                    borderRadius:"3px", color:TEXT,
                    fontSize:"13px", fontFamily:"var(--font-inter), sans-serif",
                    outline:"none",
                    boxShadow:`inset 0 0 12px ${CYAN}08`,
                  }}
                />
                <button type="submit" style={{
                  padding:"12px 20px",
                  background:`linear-gradient(135deg, ${CYAN}22, rgba(74,144,255,0.14))`,
                  border:`1px solid ${CYAN}55`, borderRadius:"3px",
                  color:TEXT, fontSize:"9px", fontWeight:700,
                  letterSpacing:"0.24em", textTransform:"uppercase",
                  cursor:"pointer", fontFamily:"monospace",
                  boxShadow:`0 0 20px ${CYAN}18`,
                  transition:"all 0.2s ease",
                }}>
                  {'>'} Request Early Access
                </button>
              </form>
            ) : (
              <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}>
                <div style={{ marginBottom:"10px", fontSize:"22px", color:GREEN,
                  fontFamily:"monospace", fontWeight:700 }}>[ OK ]</div>
                <div style={{ fontSize:"13px", color:TEXT_MID, fontFamily:"var(--font-inter), sans-serif",
                  marginBottom:"6px" }}>Node registered successfully.</div>
                <div style={{ fontSize:"9px", color:CYAN, letterSpacing:"0.14em",
                  fontFamily:"monospace" }}>{email}</div>
              </motion.div>
            )}
          </W>
          <W d={3.8} dur={1.0}>
            <div style={{ marginTop:"20px", fontSize:"7px", letterSpacing:"0.20em",
              color:TEXT_SOFT, fontFamily:"monospace" }}>
              {'// '} 2,400+ early access nodes registered
            </div>
          </W>
        </div>
      </ContentCol>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BLANK ENDPAPER PAGE  (flips before content begins)
// ─────────────────────────────────────────────────────────────────────────────

function PBlank({ n }: { n: number }) {
  return (
    <div style={{
      width:"100%", height:"100%",
      background: PAGE_BG,
      position:"relative", overflow:"hidden",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {/* Subtle top/bottom border lines */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px",
        background:`linear-gradient(90deg, transparent, ${CYAN}22, transparent)` }}/>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"1px",
        background:`linear-gradient(90deg, transparent, ${CYAN}12, transparent)` }}/>

      {/* Faint centered hex seal watermark */}
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ opacity:0.06 }}>
        <polygon points="60,8 106,34 106,86 60,112 14,86 14,34"
          stroke={CYAN} strokeWidth="1.5" fill="none"/>
        <polygon points="60,20 96,40 96,80 60,100 24,80 24,40"
          stroke={CYAN} strokeWidth="0.8" fill="none"/>
        <polygon points="60,32 86,47 86,73 60,88 34,73 34,47"
          stroke={CYAN} strokeWidth="0.5" fill="none"/>
        <circle cx="60" cy="60" r="10" stroke={CYAN} strokeWidth="1" fill="none"/>
        <circle cx="60" cy="60" r="3"  fill={CYAN}/>
      </svg>

      {/* Faint page label bottom-right */}
      <div style={{
        position:"absolute", bottom:"20px", right:"24px",
        fontSize:"8px", letterSpacing:"0.22em", fontFamily:"monospace",
        color:`${CYAN}22`,
      }}>{n === 1 ? "i" : "ii"}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

const PAGES: React.FC<{ wKey: number }>[] = [
  () => <PBlank n={1}/>,
  () => <PBlank n={2}/>,
  () => <PBlank n={3}/>,
  () => <PBlank n={4}/>,
  () => <PBlank n={5}/>,
  P0,
  ({ wKey }) => <ContentPage idx={1} wKey={wKey}/>,
  ({ wKey }) => <ContentPage idx={2} wKey={wKey}/>,
  ({ wKey }) => <ContentPage idx={3} wKey={wKey}/>,
  ({ wKey }) => <ContentPage idx={4} wKey={wKey}/>,
  P5,
  P6,
];

// ─────────────────────────────────────────────────────────────────────────────
// BOOK COVER
// ─────────────────────────────────────────────────────────────────────────────

function BookCover({ openT }: { openT: number }) {
  if (openT >= 0.98) return null;
  return (
    <div style={{
      position:"absolute", inset:0,
      transformStyle:"preserve-3d",
      transform:`rotateY(${-openT * 180}deg)`,
      transformOrigin:"left center",
      zIndex:20,
    }}>
      {/* FRONT */}
      <div style={{
        position:"absolute", inset:0,
        background:COVER_BG,
        backfaceVisibility:"hidden",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"40px",
        boxShadow:`inset -10px 0 40px rgba(0,0,0,0.80), inset 3px 0 12px ${CYAN}06`,
      }}>
        {/* Double border */}
        <div style={{ position:"absolute", inset:"14px",
          border:`1px solid ${CYAN}25`, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:"20px",
          border:`1px solid ${CYAN}10`, pointerEvents:"none" }}/>

        {/* Corner accents */}
        {(["tl","tr","bl","br"] as const).map(pos => {
          const L = pos[1]==="l", T = pos[0]==="t";
          return (
            <div key={pos} style={{ position:"absolute",
              [T?"top":"bottom"]:"14px", [L?"left":"right"]:"14px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d={L&&T?"M0 16V0H16":L?"M0 8V24H16":T?"M24 16V0H8":"M24 8V24H8"}
                  stroke={CYAN} strokeWidth="0.8" fill="none" opacity="0.55"/>
                <circle cx={L?0:24} cy={T?0:24} r="1.5" fill={CYAN} opacity="0.6"/>
              </svg>
            </div>
          );
        })}

        {/* Edge circuit traces */}
        <div style={{ position:"absolute", top:"14px", left:"50px", right:"50px", height:"1px",
          background:`linear-gradient(90deg, transparent, ${CYAN}50, transparent)` }}/>
        <div style={{ position:"absolute", bottom:"14px", left:"50px", right:"50px", height:"1px",
          background:`linear-gradient(90deg, transparent, ${CYAN}30, transparent)` }}/>

        <img src="/NoorvaLogo.png" alt="Noorva"
          style={{ height:"30px", width:"auto", filter:"brightness(0.9) saturate(0.3) hue-rotate(185deg)",
            opacity:0.7, marginBottom:"20px" }}/>

        <div style={{ width:"48px", height:"1px", marginBottom:"18px",
          background:`linear-gradient(90deg, transparent, ${CYAN}70, transparent)` }}/>

        <div style={{
          fontSize:"clamp(36px, 5.5vw, 60px)",
          fontFamily:"var(--font-inter), sans-serif",
          fontWeight:900, letterSpacing:"0.20em",
          color:TEXT, textTransform:"uppercase",
          textShadow:`0 0 60px ${CYAN}55, 0 0 20px ${CYAN}35, 0 0 5px ${CYAN}80`,
          marginBottom:"18px",
        }}>NOORVA</div>

        <div style={{ width:"48px", height:"1px", marginBottom:"20px",
          background:`linear-gradient(90deg, transparent, ${CYAN}70, transparent)` }}/>

        <div style={{ fontSize:"8px", letterSpacing:"0.32em", textTransform:"uppercase",
          color:`${CYAN}88`, fontFamily:"monospace", textAlign:"center", marginBottom:"36px" }}>
          {'>'} AI · Intelligence · Companion
        </div>

        {/* Hex seal */}
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom:"8px" }}>
          <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" stroke={CYAN} strokeWidth="0.7" fill="none" opacity="0.35"/>
          <polygon points="24,10 37,17.5 37,30.5 24,38 11,30.5 11,17.5" stroke={CYAN} strokeWidth="0.4" fill="none" opacity="0.2"/>
          <circle cx="24" cy="24" r="4" stroke={CYAN} strokeWidth="0.6" fill="none" opacity="0.45"/>
          <circle cx="24" cy="24" r="1.5" fill={CYAN} opacity="0.6"/>
        </svg>

        <motion.div
          animate={{ opacity:[0.3, 0.85, 0.3] }}
          transition={{ duration:2.2, repeat:Infinity }}
          style={{ fontSize:"7px", letterSpacing:"0.28em",
            color:`${CYAN}50`, fontFamily:"monospace", marginTop:"12px" }}
        >
          {'>'} scroll to open_
        </motion.div>
      </div>

      {/* BACK */}
      <div style={{
        position:"absolute", inset:0, backfaceVisibility:"hidden",
        transform:"rotateY(180deg)",
        background:`linear-gradient(145deg, #030609 0%, #060B18 100%)`,
        opacity: Math.max(0, 1 - openT * 3),
      }}>
        <div style={{ position:"absolute", inset:"20px",
          border:`1px solid ${CYAN}12`, pointerEvents:"none" }}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE INDICATOR DOTS
// ─────────────────────────────────────────────────────────────────────────────

function PageDots({ current, total, visible }: { current: number; total: number; visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{
      position:"absolute", bottom:"-44px", left:"50%",
      transform:"translateX(-50%)", display:"flex", gap:"8px", alignItems:"center",
    }}>
      {Array.from({ length:total }, (_, i) => (
        <div key={i} style={{
          width: i === current ? "22px" : "5px", height:"4px", borderRadius:"2px",
          background: i === current ? CYAN : `${CYAN}28`,
          transition:"all 0.4s cubic-bezier(.34,1.56,.64,1)",
          boxShadow: i === current ? `0 0 8px ${CYAN}` : "none",
        }}/>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function BookScene() {
  const wrapRef        = useRef<HTMLDivElement>(null);
  const [prog, setProgress] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [writeKeys, setWriteKeys] = useState<number[]>(Array(TOTAL_PAGES).fill(1));
  const prevPageRef    = useRef(-1);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    function onScroll() {
      const el = wrapRef.current;
      if (!el) return;
      const rect  = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      setProgress(clamp(-rect.top / total, 0, 1));
    }
    window.addEventListener("scroll", onScroll, { passive:true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { settleT, openT, pageIdx, flipT, isLast } = parseProgress(prog);

  useEffect(() => {
    if (pageIdx !== prevPageRef.current && prog > BLANK_END) {
      prevPageRef.current = pageIdx;
      // Only content pages have WriteBlock animations that need re-triggering
      if (pageIdx >= BLANK_PAGES) {
        setWriteKeys(prev => { const n = [...prev]; n[pageIdx]++; return n; });
      }
    }
  }, [pageIdx, prog]);

  // ── Fall-flat settle ────────────────────────────────────────────────────────
  const easedS     = eio(settleT);
  const settleScale = lerp(0.15, 1.0, easedS);
  const settleY     = lerp(-75, 0, easeOutBounce(settleT));
  const settleRotX  = lerp(72, 4, easedS);
  const settleRotY  = lerp(16, -2, easedS);

  const flipAngle     = -flipT * 180;
  const midShadow     = Math.sin(flipT * Math.PI);
  const curlOn        = openT > 0.97 && flipT < 0.10;
  const curlSz        = curlOn ? 28 : 0;

  const bookW = mobile ? "94vw" : "74vw";
  const bookH = mobile ? "86vh" : "88vh";

  return (
    <div ref={wrapRef} style={{ height:`${BOOK_SCENE_VH}vh`, position:"relative" }}>
      <div style={{
        position:"sticky", top:0, height:"100vh",
        display:"flex", alignItems:"center", justifyContent:"center",
        backgroundColor:"#04060F",
        overflow:"hidden",
      }}>

        {/* Background atmosphere */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          opacity: easedS * 0.85,
          background:`
            radial-gradient(ellipse 70% 55% at 50% 50%, rgba(0,80,150,0.30) 0%, transparent 65%),
            radial-gradient(ellipse 40% 30% at 50% 50%, rgba(0,120,200,0.18) 0%, transparent 50%)
          ` }}/>

        {/* Vignette */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity: easedS * 0.90,
          background:`radial-gradient(ellipse 88% 84% at 50% 50%, transparent 52%, rgba(0,0,0,0.82) 100%)` }}/>

        {/* ── BOOK WRAPPER ────────────────────────────────────────────────── */}
        <div style={{
          position:"relative",
          width:bookW, height:bookH,
          visibility: settleT > 0.01 ? "visible" : "hidden",
          transform:`translateY(${settleY}vh) scale(${settleScale})`,
          transformOrigin:"50% 50%",
        }}>
          <div style={{ perspective: mobile ? "1800px" : "3200px",
            perspectiveOrigin:"50% 40%", width:"100%", height:"100%" }}>
            <div style={{
              width:"100%", height:"100%",
              position:"relative",
              transform:`rotateX(${settleRotX}deg) rotateY(${settleRotY}deg)`,
              transformStyle:"preserve-3d",
              borderRadius:"2px",
              boxShadow:`
                0 140px 200px rgba(0,0,0,0.95),
                0  70px 110px rgba(0,0,0,0.75),
                0  28px  60px rgba(0,0,0,0.60),
                0   0px  50px ${CYAN}20,
                inset 0 0 0 1px ${CYAN}18
              `,
            }}>

              {/* ── LEFT SPINE STRIP ──────────────────────────────────────── */}
              <div style={{
                position:"absolute", top:0, left:0, width:"16px", height:"100%", zIndex:15,
                background:`linear-gradient(90deg,
                  rgba(0,0,0,0.85) 0%,
                  rgba(0,15,30,0.75) 40%,
                  rgba(0,30,55,0.60) 65%,
                  rgba(0,15,30,0.70) 80%,
                  rgba(0,0,0,0.80) 100%)`,
                boxShadow:`inset -1px 0 6px rgba(0,0,0,0.6), inset 2px 0 4px ${CYAN}10`,
              }}>
                <div style={{ position:"absolute", top:"20px", bottom:"20px", right:0, width:"1px",
                  background:`linear-gradient(180deg, transparent, ${CYAN}35, transparent)` }}/>
              </div>

              {/* ── PAGE CONTENT AREA (offset right of spine) ─────────────── */}
              <div style={{ position:"absolute", top:0, left:"16px", right:0, bottom:0, overflow:"hidden", background:PAGE_BG }}>

                {/* UNDER-LAYER — next page always rendered beneath the flip element.
                    Eliminates the dark flash that occurs at 90° when backfaceVisibility
                    hides both faces simultaneously. */}
                <div style={{ position:"absolute", inset:0 }}>
                  {PAGES.map((Comp, i) => (
                    <div key={i} style={{ position:"absolute", inset:0,
                      display: i === Math.min(pageIdx + 1, TOTAL_PAGES - 1) ? "block" : "none" }}>
                      <Comp wKey={writeKeys[i]}/>
                    </div>
                  ))}
                </div>

                {/* FLIP ELEMENT — current page rotates 0 → -180° to reveal under-layer.
                    No back face needed; the under-layer fills the second half of the flip. */}
                <div style={{
                  position:"absolute", inset:0,
                  transformStyle:"preserve-3d",
                  transformOrigin:"left center",
                  transform:`rotateY(${flipAngle}deg)`,
                }}>
                  {/* FRONT FACE */}
                  <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", overflow:"hidden" }}>
                    {PAGES.map((Comp, i) => (
                      <div key={i} style={{ position:"absolute", inset:0,
                        display: i === pageIdx ? "block" : "none" }}>
                        <Comp wKey={writeKeys[i]}/>
                      </div>
                    ))}
                    {/* Fold shadow */}
                    <div style={{ position:"absolute", inset:0, pointerEvents:"none",
                      background:`linear-gradient(to right,
                        rgba(0,0,0,${midShadow*0.60}) 0%,
                        rgba(0,0,0,${midShadow*0.20}) 6%,
                        rgba(0,212,255,${midShadow*0.03}) 35%,
                        rgba(0,0,0,${midShadow*0.20}) 88%,
                        rgba(0,0,0,${midShadow*0.55}) 100%)` }}/>
                    {/* Corner curl */}
                    <div style={{
                      position:"absolute", bottom:0, right:0,
                      width:`${curlSz*2.4}px`, height:`${curlSz*2.4}px`,
                      pointerEvents:"none",
                      clipPath:"polygon(100% 0%, 100% 100%, 0% 100%)",
                      background:`linear-gradient(225deg, rgba(0,50,90,0.96) 0%, rgba(0,25,55,0.88) 35%, transparent 70%)`,
                      boxShadow: curlOn ? `-3px -3px 12px ${CYAN}35` : "none",
                      transition:"width 0.3s ease, height 0.3s ease",
                      zIndex:5,
                    }}/>
                    <div style={{
                      position:"absolute", bottom:0, right:0,
                      width:`${curlSz*2.8}px`, height:`${curlSz*2.8}px`,
                      pointerEvents:"none",
                      clipPath:"polygon(100% 0%, 100% 100%, 0% 100%)",
                      background:`radial-gradient(ellipse at 100% 100%, ${CYAN}22 0%, transparent 55%)`,
                      transition:"width 0.3s ease, height 0.3s ease",
                    }}/>
                  </div>
                </div>
              </div>

              {/* ── RIGHT PAGE EDGE STRIPS ─────────────────────────────────── */}
              {[5,4,3,2,1].map(n => (
                <div key={n} style={{
                  position:"absolute", top:`${n*0.4}%`, bottom:`${n*0.4}%`,
                  right:`${-n*3}px`, width:"3px",
                  background:`hsl(210,55%,${8+n*2}%)`,
                  borderRight:`1px solid ${CYAN}${(8+n*4).toString(16).padStart(2,"0")}`,
                  zIndex: -n,
                }}/>
              ))}

              {/* ── BOTTOM SHADOW STRIP ────────────────────────────────────── */}
              <div style={{
                position:"absolute", bottom:"-16px", left:"4%", right:"-4px", height:"16px",
                background:`linear-gradient(180deg, #0A1520 0%, #050E16 55%, #030A10 100%)`,
                borderRadius:"0 0 3px 3px",
                boxShadow:`0 10px 28px rgba(0,0,0,0.75), 0 0 16px ${CYAN}12`,
                zIndex:-1,
              }}/>

              <BookCover openT={openT}/>
            </div>
          </div>

          <PageDots
            current={Math.max(0, pageIdx - BLANK_PAGES)}
            total={TOTAL_PAGES - BLANK_PAGES}
            visible={openT > 0.92 && pageIdx >= BLANK_PAGES}
          />

          {/* Next-page cue */}
          <AnimatePresence>
            {openT > 0.96 && !isLast && flipT < 0.06 && pageIdx >= BLANK_PAGES && (
              <motion.div key="page-cue"
                initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{
                  position:"absolute", bottom:"-62px", left:"50%",
                  transform:"translateX(-50%)",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:"5px",
                }}>
                <motion.div animate={{ y:[0,8,0] }} transition={{ duration:1.8, repeat:Infinity }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M6 13l6 6 6-6" stroke={`${CYAN}80`} strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                <span style={{ fontSize:"7px", letterSpacing:"0.28em",
                  color:`${CYAN}60`, fontFamily:"monospace" }}>
                  {'>'} scroll
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Open-book cue */}
        <AnimatePresence>
          {settleT > 0.70 && openT < 0.06 && (
            <motion.div key="open-cue"
              initial={{ opacity:0 }} animate={{ opacity:0.85 }} exit={{ opacity:0 }}
              style={{
                position:"absolute", bottom:"36px", left:"50%",
                transform:"translateX(-50%)",
                display:"flex", flexDirection:"column", alignItems:"center", gap:"6px",
              }}>
              <motion.div animate={{ y:[0,10,0] }} transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M6 13l6 6 6-6" stroke={`${CYAN}80`} strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <span style={{ fontSize:"7px", letterSpacing:"0.28em",
                color:`${CYAN}60`, fontFamily:"monospace" }}>
                {'>'} open_book()
              </span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
