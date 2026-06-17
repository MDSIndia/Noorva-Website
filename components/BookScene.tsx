"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BOOK_SCENE_VH } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const TOTAL_PAGES = 7;
const SETTLE_END  = 0.05;
const OPEN_END    = 0.15;

const GOLD     = "#C9A84C";
const GOLD_DIM = "#A8883A";
const INK      = "#1A0C04";
const INK_MID  = "#3D2410";
const INK_SOFT = "#5A3A22";

const PARCHMENT = `
  radial-gradient(ellipse 200% 120% at 25% 20%, rgba(255,250,220,0.65) 0%, transparent 50%),
  radial-gradient(ellipse 150% 100% at 80% 80%, rgba(190,145,70,0.14) 0%, transparent 45%),
  linear-gradient(158deg, #F9EDD5 0%, #F1DCB2 38%, #E9D09E 62%, #F1DCB2 100%)
`;

const PARCHMENT_L = `
  radial-gradient(ellipse 180% 110% at 70% 25%, rgba(255,248,210,0.55) 0%, transparent 55%),
  radial-gradient(ellipse 120% 90%  at 20% 80%, rgba(180,135,55,0.12) 0%, transparent 45%),
  linear-gradient(152deg, #EDE0C4 0%, #E4D2A6 40%, #DAC594 65%, #E4D2A6 100%)
`;

const LEATHER = `
  radial-gradient(ellipse 80% 70% at 30% 25%, rgba(90,40,12,0.45) 0%, transparent 55%),
  radial-gradient(ellipse 60% 50% at 75% 75%, rgba(40,12,3,0.35) 0%, transparent 50%),
  linear-gradient(148deg, #3C1E0C 0%, #251208 28%, #1D0C06 50%, #291408 72%, #3C1E0C 100%)
`;

const eio = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

interface BookState {
  settleT : number;
  openT   : number;
  pageIdx : number;
  flipT   : number;
  isLast  : boolean;
}

function parseProgress(p: number): BookState {
  if (p < SETTLE_END) {
    return { settleT: p / SETTLE_END, openT: 0, pageIdx: 0, flipT: 0, isLast: false };
  }
  const openT = clamp((p - SETTLE_END) / (OPEN_END - SETTLE_END), 0, 1);
  if (p < OPEN_END) {
    return { settleT: 1, openT, pageIdx: 0, flipT: 0, isLast: false };
  }
  const pp     = (p - OPEN_END) / (1 - OPEN_END);
  const pf     = pp * TOTAL_PAGES;
  const raw    = Math.floor(pf);
  const pidx   = Math.min(raw, TOTAL_PAGES - 1);
  const local  = pf - raw;
  // dwell 0-0.28, flip 0.28-0.83, settle 0.83-1
  let flipT = 0;
  if      (local > 0.83) flipT = 1;
  else if (local > 0.28) flipT = clamp((local - 0.28) / 0.55, 0, 1);
  return {
    settleT: 1, openT: 1,
    pageIdx: pidx,
    flipT: eio(flipT),
    isLast: pidx >= TOTAL_PAGES - 1 && local > 0.9,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG ORNAMENTS
// ─────────────────────────────────────────────────────────────────────────────

function Divider({ color = GOLD_DIM, w = 180 }: { color?: string; w?: number }) {
  return (
    <svg width={w} height={16} viewBox={`0 0 ${w} 16`} fill="none">
      <line x1="0"   y1="8" x2={w*0.36} y2="8" stroke={color} strokeWidth="0.6" opacity="0.55"/>
      <line x1={w*0.64} y1="8" x2={w} y2="8" stroke={color} strokeWidth="0.6" opacity="0.55"/>
      <path d={`M${w*0.36} 8 Q${w*0.44} 2 ${w*0.5} 8 Q${w*0.56} 14 ${w*0.64} 8`} stroke={color} strokeWidth="0.7" fill="none" opacity="0.7"/>
      <circle cx={w*0.5} cy="8" r="2" fill={color} opacity="0.55"/>
      <circle cx={w*0.38} cy="8" r="1" fill={color} opacity="0.4"/>
      <circle cx={w*0.62} cy="8" r="1" fill={color} opacity="0.4"/>
    </svg>
  );
}

function CornerDecor({ pos }: { pos: "tl"|"tr"|"bl"|"br" }) {
  const L = pos.includes("l"), T = pos.includes("t");
  return (
    <div style={{
      position: "absolute",
      [T ? "top" : "bottom"]: "8px", [L ? "left" : "right"]: "8px",
    }}>
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
        <path
          d={L && T ? "M2 18 V2 H18" : L ? "M2 16 V32 H18" : T ? "M32 18 V2 H16" : "M32 16 V32 H16"}
          stroke={GOLD_DIM} strokeWidth="0.9" fill="none" opacity="0.55"
        />
        <path
          d={L && T ? "M5 16 V5 H16" : L ? "M5 18 V29 H16" : T ? "M29 16 V5 H18" : "M29 18 V29 H18"}
          stroke={GOLD_DIM} strokeWidth="0.5" fill="none" opacity="0.32"
        />
        <circle cx={L ? 2 : 32} cy={T ? 2 : 32} r="1.8" fill={GOLD_DIM} opacity="0.45"/>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ICONS  (one per chapter)
// ─────────────────────────────────────────────────────────────────────────────

function PageIcon({ idx, sz = 52 }: { idx: number; sz?: number }) {
  const c = GOLD_DIM;
  const icons = [
    // 0 open book
    <svg key={0} width={sz} height={sz} viewBox="0 0 60 60" fill="none">
      <path d="M30 12 L30 50" stroke={c} strokeWidth="0.8"/>
      <path d="M8 22 Q18 16 30 22" stroke={c} strokeWidth="0.9" fill="none"/>
      <path d="M52 22 Q42 16 30 22" stroke={c} strokeWidth="0.9" fill="none"/>
      <path d="M8 42 Q18 48 30 42" stroke={c} strokeWidth="0.9" fill="none"/>
      <path d="M52 42 Q42 48 30 42" stroke={c} strokeWidth="0.9" fill="none"/>
      <circle cx="30" cy="31" r="2.5" fill={c} opacity="0.55"/>
    </svg>,
    // 1 companion figure
    <svg key={1} width={sz} height={sz} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="17" r="8" stroke={c} strokeWidth="0.9"/>
      <path d="M14 52 Q14 34 30 34 Q46 34 46 52" stroke={c} strokeWidth="0.9" fill="none"/>
      <path d="M22 44 L30 52 L38 44" stroke={c} strokeWidth="0.65" fill="none"/>
    </svg>,
    // 2 eye / wisdom
    <svg key={2} width={sz} height={sz} viewBox="0 0 60 60" fill="none">
      <path d="M8 30 Q30 8 52 30 Q30 52 8 30Z" stroke={c} strokeWidth="0.9" fill="none"/>
      <circle cx="30" cy="30" r="7" stroke={c} strokeWidth="0.9"/>
      <circle cx="30" cy="30" r="3" fill={c} opacity="0.55"/>
    </svg>,
    // 3 heart
    <svg key={3} width={sz} height={sz} viewBox="0 0 60 60" fill="none">
      <path d="M30 46 L11 26 Q7 16 18 12 Q26 10 30 22 Q34 10 42 12 Q53 16 49 26 Z" stroke={c} strokeWidth="0.9" fill="none"/>
    </svg>,
    // 4 nodes
    <svg key={4} width={sz} height={sz} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="5" stroke={c} strokeWidth="0.9"/>
      <circle cx="14" cy="17" r="3.5" stroke={c} strokeWidth="0.7"/>
      <circle cx="46" cy="17" r="3.5" stroke={c} strokeWidth="0.7"/>
      <circle cx="14" cy="43" r="3.5" stroke={c} strokeWidth="0.7"/>
      <circle cx="46" cy="43" r="3.5" stroke={c} strokeWidth="0.7"/>
      <path d="M17.5 19 L25 25 M42.5 19 L35 25 M17.5 41 L25 35 M42.5 41 L35 35" stroke={c} strokeWidth="0.55" opacity="0.65"/>
    </svg>,
    // 5 horizon / stars
    <svg key={5} width={sz} height={sz} viewBox="0 0 60 60" fill="none">
      <path d="M4 40 Q30 14 56 40" stroke={c} strokeWidth="0.9" fill="none"/>
      <path d="M4 46 Q30 20 56 46" stroke={c} strokeWidth="0.45" opacity="0.4" fill="none"/>
      <circle cx="30" cy="13" r="2.2" fill={c} opacity="0.9"/>
      <circle cx="16" cy="22" r="1.5" fill={c} opacity="0.6"/>
      <circle cx="44" cy="20" r="1.5" fill={c} opacity="0.6"/>
      <circle cx="8"  cy="31" r="1"   fill={c} opacity="0.4"/>
      <circle cx="52" cy="29" r="1"   fill={c} opacity="0.4"/>
    </svg>,
    // 6 quill
    <svg key={6} width={sz} height={sz} viewBox="0 0 60 60" fill="none">
      <path d="M18 46 L42 14 Q52 9 50 20 L28 50 Z" stroke={c} strokeWidth="0.9" fill="none"/>
      <path d="M28 50 L23 53 L26 47" stroke={c} strokeWidth="0.7" fill="none"/>
      <path d="M36 19 L24 43" stroke={c} strokeWidth="0.45" opacity="0.45"/>
    </svg>,
  ];
  return icons[Math.min(idx, icons.length - 1)];
}

// ─────────────────────────────────────────────────────────────────────────────
// LEFT PAGE
// ─────────────────────────────────────────────────────────────────────────────

const LEFT_DATA = [
  { roman: "◈", title: "NOORVA",        sub: null          },
  { roman: "I",  title: "The Companion", sub: "Chapter I"   },
  { roman: "II", title: "Ancient Wisdom",sub: "Chapter II"  },
  { roman: "III",title: "The Heart",     sub: "Chapter III" },
  { roman: "IV", title: "The Ecosystem", sub: "Chapter IV"  },
  { roman: "V",  title: "Tomorrow",      sub: "Chapter V"   },
  { roman: "VI", title: "Your Journey",  sub: "Epilogue"    },
];

function LeftPage({ idx, mobile }: { idx: number; mobile: boolean }) {
  const d = LEFT_DATA[Math.min(idx, LEFT_DATA.length - 1)];
  return (
    <div style={{
      width: "100%", height: "100%", background: PARCHMENT_L,
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "28px 22px",
    }}>
      {/* Watermark roman numeral */}
      <div style={{
        position: "absolute",
        fontSize: mobile ? "110px" : "170px",
        fontFamily: "var(--font-playfair), serif",
        fontWeight: 900, color: GOLD, opacity: 0.065,
        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        userSelect: "none", lineHeight: 1, letterSpacing: "-0.03em",
        pointerEvents: "none",
      }}>{d.roman}</div>

      <CornerDecor pos="tl"/><CornerDecor pos="tr"/>
      <CornerDecor pos="bl"/><CornerDecor pos="br"/>

      {/* Border lines */}
      {["top","bottom"].map(side => (
        <div key={side} style={{
          position: "absolute", [side]: "20px", left: "20px", right: "20px",
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${GOLD}55, transparent)`,
        }}/>
      ))}
      {["left","right"].map(side => (
        <div key={side} style={{
          position: "absolute", [side]: "20px", top: "20px", bottom: "20px",
          width: "1px",
          background: `linear-gradient(180deg, transparent, ${GOLD}55, transparent)`,
        }}/>
      ))}

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        {d.sub && (
          <div style={{
            fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase",
            color: GOLD, opacity: 0.75, fontFamily: "var(--font-inter)",
            fontWeight: 600, marginBottom: "14px",
          }}>{d.sub}</div>
        )}
        <div style={{
          fontSize: mobile ? "22px" : "clamp(20px, 2.8vw, 30px)",
          fontFamily: "var(--font-playfair), serif",
          fontWeight: 700, color: INK,
          letterSpacing: "0.03em", marginBottom: "14px",
          lineHeight: 1.25,
        }}>{d.title}</div>

        <Divider w={140}/>

        <div style={{ marginTop: "18px", opacity: 0.45 }}>
          <PageIcon idx={idx} sz={mobile ? 36 : 48}/>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE LAYOUT WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function Page({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div style={{
      width: "100%", height: "100%", background: PARCHMENT,
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
      alignItems: center ? "center" : "flex-start",
      justifyContent: "center",
      padding: "clamp(20px, 3vh, 36px) clamp(18px, 2.5vw, 32px)",
    }}>
      <CornerDecor pos="tl"/><CornerDecor pos="tr"/>
      <CornerDecor pos="bl"/><CornerDecor pos="br"/>
      {["top","bottom"].map(s => (
        <div key={s} style={{
          position: "absolute", [s]: "16px", left: "16px", right: "16px",
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${GOLD}5A, transparent)`,
        }}/>
      ))}
      <div style={{ position: "relative", zIndex: 1, width: "100%", textAlign: center ? "center" : "left" }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RIGHT PAGE CONTENT
// ─────────────────────────────────────────────────────────────────────────────

function eyebrowStyle(): React.CSSProperties {
  return {
    fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase",
    color: GOLD, opacity: 0.82, fontFamily: "var(--font-inter)", fontWeight: 600,
    marginBottom: "10px",
  };
}
function headingStyle(): React.CSSProperties {
  return {
    fontSize: "clamp(17px, 2.6vw, 28px)", fontFamily: "var(--font-playfair), serif",
    fontWeight: 700, color: INK, lineHeight: 1.2, marginBottom: "8px",
  };
}
function bodyStyle(): React.CSSProperties {
  return {
    fontSize: "clamp(10px, 1.3vw, 13px)", fontFamily: "var(--font-playfair), serif",
    fontStyle: "italic", color: INK_SOFT, lineHeight: 1.78,
  };
}
function featureStyle(): React.CSSProperties {
  return {
    fontSize: "clamp(9px, 1.2vw, 12px)", fontFamily: "var(--font-playfair), serif",
    fontStyle: "italic", color: INK_MID, lineHeight: 1.55,
  };
}
function featRow(text: string, i: number) {
  return (
    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
      <span style={{ color: GOLD, fontSize: "9px", flexShrink: 0, marginTop: "2px" }}>◆</span>
      <span style={featureStyle()}>{text}</span>
    </div>
  );
}

// Page 0 — Title
function P0() {
  return (
    <Page center>
      <div style={{ fontSize: "9px", letterSpacing: "0.32em", textTransform: "uppercase", color: GOLD, opacity: 0.75, fontFamily: "var(--font-inter)", marginBottom: "16px" }}>
        Presented to the World
      </div>
      <div style={{ fontSize: "clamp(32px, 5vw, 52px)", fontFamily: "var(--font-playfair), serif", fontWeight: 900, color: INK, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "6px", textShadow: `0 0 1px ${INK}40` }}>
        NOORVA
      </div>
      <Divider w={160}/>
      <div style={{ margin: "14px 0", ...bodyStyle(), maxWidth: "320px" }}>
        A new era of Human-AI connection — where intelligence becomes wisdom, and technology becomes a companion for life.
      </div>
      <Divider w={100}/>
      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <img src="/NoorvaLogo.png" alt="Noorva" style={{ height: "28px", width: "auto", objectFit: "contain", filter: "sepia(1) saturate(0.5) brightness(0.45)", opacity: 0.88 }}/>
        <div style={{ fontSize: "8px", letterSpacing: "0.32em", textTransform: "uppercase", color: INK_SOFT, opacity: 0.5, fontFamily: "var(--font-inter)" }}>
          MMXXV · First Edition
        </div>
      </div>
    </Page>
  );
}

// Page 1 — Companion
function P1() {
  return (
    <Page>
      <div style={eyebrowStyle()}>Chapter I</div>
      <div style={headingStyle()}>Your AI<br/>Companion</div>
      <Divider w={140}/>
      <div style={{ marginTop: "12px", marginBottom: "10px" }}>
        <span style={{ float: "left", fontSize: "clamp(40px, 5.5vw, 58px)", fontFamily: "var(--font-playfair), serif", fontWeight: 900, color: GOLD, lineHeight: 0.82, marginRight: "7px", marginTop: "4px" }}>N</span>
        <p style={bodyStyle()}>
          ot another assistant, not another chatbot — Noorva is a living presence that grows alongside you through every chapter of your life. A guide, mentor, and confidant unlike any other.
        </p>
      </div>
      <div style={{ clear: "both" }}/>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {["Remembers your entire journey & context","Adapts to your unique voice & personality","Grows wiser with every conversation","Understands emotion, not just language"].map(featRow)}
      </div>
    </Page>
  );
}

// Page 2 — Wisdom
function P2() {
  return (
    <Page>
      <div style={eyebrowStyle()}>Chapter II</div>
      <div style={headingStyle()}>Ancient Wisdom,<br/>Infinite Knowledge</div>
      <Divider w={140}/>
      <div style={{ marginTop: "12px", marginBottom: "10px" }}>
        <span style={{ float: "left", fontSize: "clamp(40px, 5.5vw, 58px)", fontFamily: "var(--font-playfair), serif", fontWeight: 900, color: GOLD, lineHeight: 0.82, marginRight: "7px", marginTop: "4px" }}>L</span>
        <p style={bodyStyle()}>
          ike a wise sage who has witnessed centuries of human experience, Noorva draws from the deepest wells of knowledge to illuminate your path through {"life's"} greatest questions.
        </p>
      </div>
      <div style={{ clear: "both" }}/>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {["Access to vast, curated knowledge domains","Contextual wisdom tailored to your moment","Learns from the world's greatest thinkers","Guides with clarity, not just information"].map(featRow)}
      </div>
    </Page>
  );
}

// Page 3 — Mood
function P3() {
  return (
    <Page>
      <div style={eyebrowStyle()}>Chapter III</div>
      <div style={headingStyle()}>The Language<br/>of the Heart</div>
      <Divider w={140}/>
      <div style={{ marginTop: "12px", marginBottom: "10px" }}>
        <span style={{ float: "left", fontSize: "clamp(40px, 5.5vw, 58px)", fontFamily: "var(--font-playfair), serif", fontWeight: 900, color: GOLD, lineHeight: 0.82, marginRight: "7px", marginTop: "4px" }}>N</span>
        <p style={bodyStyle()}>
          oorva reads between the lines — understanding not merely what you say, but how you truly feel. Your joys, anxieties, and dreams are all understood with rare emotional intelligence.
        </p>
      </div>
      <div style={{ clear: "both" }}/>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {["Real-time emotional resonance detection","Adaptive tone for every mood & moment","Mental wellness awareness and support","Responds with empathy, not algorithms"].map(featRow)}
      </div>
    </Page>
  );
}

// Page 4 — Ecosystem
function P4() {
  return (
    <Page>
      <div style={eyebrowStyle()}>Chapter IV</div>
      <div style={headingStyle()}>A Living<br/>Ecosystem</div>
      <Divider w={140}/>
      <div style={{ marginTop: "12px", marginBottom: "10px" }}>
        <span style={{ float: "left", fontSize: "clamp(40px, 5.5vw, 58px)", fontFamily: "var(--font-playfair), serif", fontWeight: 900, color: GOLD, lineHeight: 0.82, marginRight: "7px", marginTop: "4px" }}>S</span>
        <p style={bodyStyle()}>
          eamlessly woven into the fabric of your digital life, Noorva connects, integrates, and orchestrates the tools that matter most — transforming fragments into a coherent, intelligent whole.
        </p>
      </div>
      <div style={{ clear: "both" }}/>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {["Connects all your apps & workflows","Intelligent source filtering & curation","Cross-platform memory and continuity","Orchestrates your entire digital universe"].map(featRow)}
      </div>
    </Page>
  );
}

// Page 5 — Future
function P5() {
  const items = [
    { q: "2025 Q3", t: "Early Access Launch"   },
    { q: "2025 Q4", t: "Voice & Vision"         },
    { q: "2026",    t: "Noorva Mobile"           },
    { q: "2026+",   t: "Neural Integration"      },
  ];
  return (
    <Page center>
      <div style={eyebrowStyle()}>Chapter V</div>
      <div style={{ ...headingStyle(), textAlign: "center" }}>{"Tomorrow's"}<br/>Horizon</div>
      <Divider w={140}/>
      <div style={{ margin: "12px 0", ...bodyStyle(), maxWidth: "320px", textAlign: "center" }}>
        &quot;The world where AI and human wisdom move as one is no longer a distant dream. Noorva stands at that threshold.&quot;
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "300px" }}>
        {items.map(({ q, t }) => (
          <div key={q} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ fontSize: "8px", letterSpacing: "0.12em", color: GOLD, fontFamily: "var(--font-inter)", fontWeight: 700, flexShrink: 0, width: "44px" }}>{q}</div>
            <div style={{ flex: 1, height: "1px", background: `${GOLD}40` }}/>
            <div style={{ fontSize: "clamp(9px, 1.2vw, 12px)", color: INK_MID, fontFamily: "var(--font-playfair), serif", fontStyle: "italic" }}>{t}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}

// Page 6 — Contact
function P6() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <Page center>
      <div style={eyebrowStyle()}>Epilogue</div>
      <div style={{ ...headingStyle(), textAlign: "center" }}>Begin Your<br/>Journey</div>
      <Divider w={140}/>
      <div style={{ margin: "10px 0", ...bodyStyle(), maxWidth: "290px", textAlign: "center" }}>
        The ancient book is open. The first chapter of your Noorva journey awaits. Reserve your place among the first to enter.
      </div>
      {!done ? (
        <form onSubmit={e => { e.preventDefault(); if (email.trim()) setDone(true); }} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "290px" }}>
          <input
            type="email" placeholder="your@email.com" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={{
              width: "100%", padding: "9px 14px", textAlign: "center",
              background: "rgba(180,140,80,0.10)", border: `1px solid ${GOLD}55`,
              borderRadius: "2px", color: INK, fontSize: "12px",
              fontFamily: "var(--font-inter)", outline: "none",
            }}
          />
          <button type="submit" style={{
            width: "100%", padding: "9px 24px",
            background: `linear-gradient(135deg, ${GOLD}28, ${GOLD}14)`,
            border: `1px solid ${GOLD}66`, borderRadius: "2px",
            color: INK, fontSize: "9px", fontWeight: 700,
            letterSpacing: "0.20em", textTransform: "uppercase",
            cursor: "pointer", fontFamily: "var(--font-inter)",
          }}>
            Reserve My Spot
          </button>
        </form>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
          <div style={{ fontSize: "22px", color: GOLD, marginBottom: "8px" }}>◆</div>
          <div style={{ ...bodyStyle(), marginBottom: "6px" }}>Your name has been inscribed.</div>
          <div style={{ fontSize: "10px", color: GOLD, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "var(--font-inter)" }}>{email}</div>
        </motion.div>
      )}
      <div style={{ marginTop: "16px", fontSize: "8px", color: INK_SOFT, opacity: 0.45, letterSpacing: "0.18em", fontFamily: "var(--font-inter)" }}>
        2,400+ PIONEERS ALREADY ENROLLED
      </div>
    </Page>
  );
}

const PAGES: React.FC[] = [P0, P1, P2, P3, P4, P5, P6];

// ─────────────────────────────────────────────────────────────────────────────
// BOOK COVER
// ─────────────────────────────────────────────────────────────────────────────

function CoverCorner({ pos }: { pos: "tl"|"tr"|"bl"|"br" }) {
  const L = pos.includes("l"), T = pos.includes("t");
  return (
    <div style={{ position: "absolute", [T ? "top" : "bottom"]: "14px", [L ? "left" : "right"]: "14px" }}>
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        <path d={L && T ? "M2 15 V2 H15" : L ? "M2 15 V28 H15" : T ? "M28 15 V2 H15" : "M28 15 V28 H15"} stroke={GOLD} strokeWidth="1" fill="none" opacity="0.6"/>
        <circle cx={L ? 2 : 28} cy={T ? 2 : 28} r="2" fill={GOLD} opacity="0.45"/>
      </svg>
    </div>
  );
}

function BookCover({ openT }: { openT: number }) {
  // Hide cover entirely once fully open (avoids back-face covering the spread)
  if (openT >= 0.98) return null;
  return (
    <div style={{
      position: "absolute", inset: 0,
      transformStyle: "preserve-3d",
      transform: `rotateY(${-openT * 180}deg)`,
      transformOrigin: "left center",
      zIndex: 12,
    }}>
      {/* Front face */}
      <div style={{
        position: "absolute", inset: 0,
        background: LEATHER,
        backfaceVisibility: "hidden",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "28px",
      }}>
        <div style={{ position: "absolute", inset: "12px", border: "1px solid rgba(201,168,76,0.32)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", inset: "18px", border: "1px solid rgba(201,168,76,0.14)", pointerEvents: "none" }}/>
        <CoverCorner pos="tl"/><CoverCorner pos="tr"/>
        <CoverCorner pos="bl"/><CoverCorner pos="br"/>

        <img src="/NoorvaLogo.png" alt="Noorva" style={{ height: "30px", width: "auto", filter: "sepia(1) saturate(2.2) brightness(0.8)", marginBottom: "18px", opacity: 0.88 }}/>

        <div style={{ width: "70px", height: "1px", background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, marginBottom: "14px", opacity: 0.55 }}/>

        <div style={{
          fontSize: "clamp(24px, 4vw, 42px)",
          fontFamily: "var(--font-playfair), serif",
          fontWeight: 800, letterSpacing: "0.16em",
          color: GOLD,
          textShadow: `0 0 22px ${GOLD}65, 0 2px 6px rgba(0,0,0,0.85)`,
          marginBottom: "8px",
        }}>NOORVA</div>

        <div style={{ width: "70px", height: "1px", background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, marginBottom: "14px", opacity: 0.55 }}/>

        <div style={{ fontSize: "clamp(8px, 1vw, 10px)", letterSpacing: "0.30em", textTransform: "uppercase", color: `${GOLD}AA`, fontFamily: "var(--font-inter)", textAlign: "center" }}>
          The Book of Intelligence
        </div>

        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{ position: "absolute", bottom: "32px", fontSize: "8px", letterSpacing: "0.24em", color: `${GOLD}66`, fontFamily: "var(--font-inter)", textTransform: "uppercase" }}
        >
          Scroll to Open
        </motion.div>
      </div>

      {/* Back face — fades out as cover opens so book spread shows through */}
      <div style={{
        position: "absolute", inset: 0,
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        opacity: Math.max(0, 1 - openT * 2.5),
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(155deg, #281608 0%, #1C0E06 100%)`,
      }}>
        <div style={{ fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}44`, fontFamily: "var(--font-inter)" }}>
          Ex Libris · Noorva
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE DOTS INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

function PageDots({ current, total, visible }: { current: number; total: number; visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "absolute", bottom: "-34px", left: "50%", transform: "translateX(-50%)",
      display: "flex", gap: "7px", alignItems: "center",
    }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: i === current ? "18px" : "5px", height: "5px",
          borderRadius: "3px",
          background: i === current ? GOLD : `${GOLD}44`,
          transition: "all 0.45s ease",
        }}/>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOK SCENE — MAIN
// ─────────────────────────────────────────────────────────────────────────────

export default function BookScene() {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const [prog,   setProgress] = useState(0);
  const [mobile, setMobile]   = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 680);
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
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { settleT, openT, pageIdx, flipT } = parseProgress(prog);
  const flipShadow = Math.sin(flipT * Math.PI) * 0.32;
  const showFront  = flipT < 0.5; // which face of the flipping page is visible
  const nextLeft   = Math.min(pageIdx + 1, TOTAL_PAGES - 1);

  const bookW = mobile ? "min(96vw, 440px)" : "min(93vw, 1100px)";
  const bookH = mobile ? "min(82vh, 580px)" : "min(76vh, 680px)";

  // Inline scaleX flip approach — works in ALL browsers including headless.
  // Phase 1 (flipT 0→0.5): front page compresses, scaleX 1→0 (page "folds away")
  // Phase 2 (flipT 0.5→1): back content expands, scaleX 0→1 (next page "unfolds")
  const flipPhase  = showFront ? flipT * 2 : (flipT - 0.5) * 2;
  const flipScaleX = showFront ? (1 - flipPhase) : flipPhase;
  // Slight skew gives a subtle fold illusion
  const flipSkew   = Math.sin(flipT * Math.PI) * -6;

  return (
    <div
      ref={wrapRef}
      style={{ height: `${BOOK_SCENE_VH}vh`, position: "relative", background: "#F2E4C2" }}
    >
      <div style={{
        position: "sticky", top: 0, height: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: `
          radial-gradient(ellipse 75% 55% at 50% 42%, rgba(255,252,228,0.85) 0%, transparent 65%),
          radial-gradient(ellipse 55% 75% at 18% 68%, rgba(195,148,72,0.18) 0%, transparent 50%),
          linear-gradient(162deg, #F6E9CF 0%, #EEDCAC 48%, #E9D3A2 100%)
        `,
      }}>

        {/* Warm center glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 55% 45% at 50% 46%, rgba(255,242,180,0.55) 0%, transparent 70%)",
        }}/>

        {/* Book container — NO opacity (would break 3D compositing) */}
        <div style={{
          position: "relative",
          // Use clip-path for settle animation instead of opacity
          transform: `scale(${0.88 + settleT * 0.12}) translateY(${(1 - settleT) * 28}px)`,
          visibility: settleT > 0.05 ? "visible" : "hidden",
        }}>
          {/* 3D perspective wrapper */}
          <div style={{
            perspective: mobile ? "1600px" : "2600px",
            perspectiveOrigin: "50% 38%",
          }}>
            {/* Book body — NO preserve-3d to avoid compositing issues with child opacity */}
            <div style={{
              width: bookW, height: bookH,
              position: "relative",
              transform: mobile ? "none" : "rotateX(3.5deg) rotateY(-4deg)",
              boxShadow: `
                0 50px 120px rgba(0,0,0,0.38),
                0 24px 60px  rgba(0,0,0,0.26),
                0 6px  20px  rgba(0,0,0,0.18)
              `,
            }}>

              {/* ── OPEN BOOK SPREAD ──────────────────────── */}
              {/* Cover hides the spread when closed; no opacity needed (avoids compositing issues) */}
              {!mobile ? (
                <div style={{ position: "absolute", inset: 0, display: "flex" }}>

                  {/* LEFT PAGE */}
                  <div style={{ width: "44%", height: "100%", position: "relative", flexShrink: 0 }}>
                    {LEFT_DATA.map((_, i) => (
                      <div key={i} style={{ position: "absolute", inset: 0, display: i === pageIdx ? "block" : "none" }}>
                        <LeftPage idx={i} mobile={false}/>
                      </div>
                    ))}
                    {/* Shadow cast by flipping page */}
                    <div style={{
                      position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5,
                      background: `linear-gradient(to left, rgba(0,0,0,${flipShadow}) 0%, transparent 65%)`,
                    }}/>
                  </div>

                  {/* SPINE */}
                  <div style={{
                    width: "2.2%", flexShrink: 0, zIndex: 20,
                    background: "linear-gradient(90deg, rgba(0,0,0,0.38), rgba(80,35,8,0.22), rgba(0,0,0,0.12))",
                  }}/>

                  {/* RIGHT PAGE AREA */}
                  <div style={{ flex: 1, height: "100%", position: "relative" }}>
                    {/* Page stack (depth effect) */}
                    {[4,3,2,1].map(n => (
                      <div key={n} style={{
                        position: "absolute", inset: 0,
                        background: n % 2 === 0 ? "#EDD4A2" : "#E9CE98",
                        transform: `translateX(${n*1.8}px) translateY(${n*0.5}px)`,
                        zIndex: n,
                        borderRight: `1px solid rgba(140,100,40,${0.12 + n*0.04})`,
                      }}/>
                    ))}

                    {/* BEHIND PAGE — visible after flip completes */}
                    <div style={{ position: "absolute", inset: 0, zIndex: 5, overflow: "hidden" }}>
                      {PAGES.map((Comp, i) => (
                        <div key={i} style={{ position: "absolute", inset: 0, display: i === Math.min(pageIdx + 1, PAGES.length - 1) ? "block" : "none" }}>
                          <Comp/>
                        </div>
                      ))}
                    </div>

                    {/* FLIPPING PAGE — scaleX-based fold, works everywhere */}
                    <div style={{
                      position: "absolute", inset: 0,
                      transformOrigin: "left center",
                      transform: `scaleX(${flipScaleX}) skewY(${flipSkew}deg)`,
                      zIndex: 6,
                      overflow: "hidden",
                    }}>
                      {/* Front face — current page content */}
                      <div style={{
                        position: "absolute", inset: 0,
                        display: showFront ? "block" : "none",
                      }}>
                        {PAGES.map((Comp, i) => (
                          <div key={i} style={{ position: "absolute", inset: 0, display: i === pageIdx ? "block" : "none" }}>
                            <Comp/>
                          </div>
                        ))}
                        <div style={{
                          position: "absolute", inset: 0, pointerEvents: "none",
                          background: `linear-gradient(to right, rgba(0,0,0,${flipShadow * 0.5}) 0%, transparent 40%)`,
                        }}/>
                      </div>
                      {/* Back face — next chapter left-page art (scaleX(-1) to un-mirror) */}
                      <div style={{
                        position: "absolute", inset: 0,
                        display: showFront ? "none" : "block",
                        transform: "scaleX(-1)",
                      }}>
                        {LEFT_DATA.map((_, i) => (
                          <div key={i} style={{ position: "absolute", inset: 0, display: i === nextLeft ? "block" : "none" }}>
                            <LeftPage idx={i} mobile={false}/>
                          </div>
                        ))}
                        <div style={{
                          position: "absolute", inset: 0, pointerEvents: "none",
                          background: `linear-gradient(to left, rgba(0,0,0,${flipShadow * 0.5}) 0%, transparent 40%)`,
                        }}/>
                      </div>
                    </div>

                    {/* Spine shadow */}
                    <div style={{
                      position: "absolute", inset: 0, pointerEvents: "none", zIndex: 7,
                      background: `linear-gradient(to right, rgba(0,0,0,${0.25 + flipShadow * 0.15}) 0%, rgba(0,0,0,0.06) 8%, transparent 22%)`,
                    }}/>

                  </div>
                </div>
              ) : (
                /* ── MOBILE: single page ─────── */
                <div style={{ position: "absolute", inset: 0 }}>
                  {/* Behind */}
                  <div style={{ position: "absolute", inset: 0, zIndex: 1, overflow: "hidden" }}>
                    {PAGES.map((Comp, i) => (
                      <div key={i} style={{ position: "absolute", inset: 0, display: i === Math.min(pageIdx + 1, PAGES.length - 1) ? "block" : "none" }}>
                        <Comp/>
                      </div>
                    ))}
                  </div>
                  {/* Flipper — scaleX, same approach as desktop */}
                  <div style={{
                    position: "absolute", inset: 0,
                    transformOrigin: "left center",
                    transform: `scaleX(${flipScaleX}) skewY(${flipSkew}deg)`,
                    zIndex: 2,
                    overflow: "hidden",
                  }}>
                    {/* Front face */}
                    <div style={{ position: "absolute", inset: 0, display: showFront ? "block" : "none" }}>
                      {PAGES.map((Comp, i) => (
                        <div key={i} style={{ position: "absolute", inset: 0, display: i === pageIdx ? "block" : "none" }}>
                          <Comp/>
                        </div>
                      ))}
                    </div>
                    {/* Back face (scaleX(-1) to un-mirror) */}
                    <div style={{ position: "absolute", inset: 0, display: showFront ? "none" : "block", transform: "scaleX(-1)" }}>
                      {PAGES.map((Comp, i) => (
                        <div key={i} style={{ position: "absolute", inset: 0, display: i === nextLeft ? "block" : "none" }}>
                          <Comp/>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── BOTTOM PAGE EDGES ───────────── */}
              <div style={{
                position: "absolute", bottom: "-10px", left: "3%", right: "3%",
                height: "10px",
                background: "linear-gradient(180deg, #EEDC9C 0%, #D8C48A 100%)",
                borderRadius: "0 0 3px 3px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.22)",
                zIndex: -1,
              }}/>

              {/* ── BOOK COVER (on top, opens on scroll) ── */}
              <BookCover openT={openT}/>

            </div>{/* /book body */}
          </div>{/* /perspective wrapper */}

          {/* Page dots */}
          <PageDots current={pageIdx} total={TOTAL_PAGES} visible={openT > 0.92}/>

          {/* "Turn the page" cue */}
          <AnimatePresence>
            {openT > 0.96 && pageIdx === 0 && flipT < 0.08 && (
              <motion.div
                key="turn-cue"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  position: "absolute", bottom: "-52px", left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
                }}
              >
                <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M6 13l6 6 6-6" stroke={`${GOLD}99`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                <span style={{ fontSize: "7px", letterSpacing: "0.28em", color: `${GOLD}77`, textTransform: "uppercase", fontFamily: "var(--font-inter)" }}>
                  turn the page
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* "Open the book" cue */}
        <AnimatePresence>
          {settleT > 0.6 && openT < 0.08 && (
            <motion.div
              key="open-cue"
              initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }}
              style={{
                position: "absolute", bottom: "44px", left: "50%",
                transform: "translateX(-50%)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "7px",
              }}
            >
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M6 13l6 6 6-6" stroke={`${GOLD}99`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <span style={{ fontSize: "7px", letterSpacing: "0.28em", color: `${GOLD}77`, textTransform: "uppercase", fontFamily: "var(--font-inter)" }}>
                open the book
              </span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>{/* /sticky */}
    </div>
  );
}
