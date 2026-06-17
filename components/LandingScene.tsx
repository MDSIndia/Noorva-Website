"use client";

import { useEffect, useRef, useState } from "react";
import { LANDING_VH } from "@/lib/constants";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;
const eio   = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;

function easeOutBounce(t: number): number {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1 / d1)        return n1 * t * t;
  if (t < 2 / d1)        return n1 * (t -= 1.5  / d1) * t + 0.75;
  if (t < 2.5 / d1)      return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

const GOLD   = "#C9A84C";
const LEATHER = `linear-gradient(148deg, #3C1E0C 0%, #251208 28%, #1D0C06 50%, #291408 72%, #3C1E0C 100%)`;

// ── Dust mote component ──────────────────────────────────────────────────────
function DustMote({ x, y, delay, dur }: { x: number; y: number; delay: number; dur: number }) {
  return (
    <div style={{
      position: "absolute",
      left: `${x}%`, top: `${y}%`,
      width: "3px", height: "3px",
      borderRadius: "50%",
      background: `radial-gradient(circle, rgba(201,168,76,0.9) 0%, transparent 70%)`,
      animation: `dustFloat ${dur}s ${delay}s ease-in-out infinite`,
      pointerEvents: "none",
      filter: "blur(0.5px)",
    }}/>
  );
}

// ── Wind streak component ────────────────────────────────────────────────────
function WindStreak({ y, delay, width, opacity }: { y: number; delay: number; width: number; opacity: number }) {
  return (
    <div style={{
      position: "absolute",
      top: `${y}%`, left: "-10%",
      width: `${width}px`, height: "1px",
      background: `linear-gradient(90deg, transparent, rgba(201,168,76,${opacity}), transparent)`,
      animation: `shimmerSlide ${1.4 + delay * 0.6}s ${delay}s linear infinite`,
      pointerEvents: "none",
    }}/>
  );
}

// ── Impact ring ──────────────────────────────────────────────────────────────
function ImpactRing({ delay, size }: { delay: number; size: number }) {
  return (
    <div style={{
      position: "absolute",
      left: "50%", top: "0",
      width: `${size}px`, height: `${size * 0.22}px`,
      border: `1px solid rgba(201,168,76,0.55)`,
      borderRadius: "50%",
      animation: `impactRing 0.9s ${delay}s ease-out forwards`,
      pointerEvents: "none",
    }}/>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LandingScene() {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const [prog, setProgress] = useState(0);
  const [showImpact, setShowImpact] = useState(false);
  const prevImpactFired = useRef(false);

  useEffect(() => {
    function onScroll() {
      const el = wrapRef.current;
      if (!el) return;
      const rect  = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const p = clamp(-rect.top / total, 0, 1);
      setProgress(p);

      // Fire impact rings once when book lands (~p 0.62)
      if (p > 0.62 && !prevImpactFired.current) {
        prevImpactFired.current = true;
        setShowImpact(true);
        setTimeout(() => setShowImpact(false), 1200);
      }
      if (p < 0.50 && prevImpactFired.current) {
        prevImpactFired.current = false;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const p = prog;

  // ── Scene phases ──────────────────────────────────────────────────────────
  // 0.00-0.22 : landscape fades in from darkness
  // 0.22-0.28 : stable landscape, atmosphere builds
  // 0.28-0.65 : book falls from sky (dramatic arc)
  // 0.65-0.80 : book has landed, golden glow, dust settles
  // 0.80-1.00 : fade to darkness → BookScene

  const landFade  = clamp(p / 0.22, 0, 1);
  const bookFallT = clamp((p - 0.28) / 0.37, 0, 1);
  const darkFade  = clamp((p - 0.80) / 0.20, 0, 1);

  // Book physics: easeOutBounce for natural landing deceleration
  const fallEased   = bookFallT > 0 ? easeOutBounce(Math.min(bookFallT, 1)) : 0;
  const bookTopPct  = lerp(-52, 28, fallEased);   // -52% = above screen, 28% = landed
  const bookRotateZ = lerp(-22, 0,   eio(bookFallT));
  const bookRotateX = lerp(12,  0,   eio(bookFallT));
  const bookScale   = lerp(0.22, 0.80, eio(bookFallT));

  // Impact pulse: brief scale bump when landing
  const impactPulse = Math.max(0, Math.sin(clamp((bookFallT - 0.96) / 0.04, 0, 1) * Math.PI)) * 0.045;

  // Light-ray and glow intensities
  const rayT   = clamp(bookFallT * 4, 0, 1) * clamp((0.88 - bookFallT) * 6, 0, 1);
  const glowT  = clamp((bookFallT - 0.94) / 0.06, 0, 1);

  // Wind streaks: active during the fall
  const windActive  = bookFallT > 0.04 && bookFallT < 0.92;

  // Dust cloud on ground
  const dustCloudT  = clamp((bookFallT - 0.93) / 0.07, 0, 1);

  // Settled glow (after landing)
  const settledGlow = glowT * (1 - darkFade);

  return (
    <div ref={wrapRef} style={{ height: `${LANDING_VH}vh`, position: "relative" }}>
      <div style={{
        position: "sticky", top: 0, height: "100vh",
        overflow: "hidden",
        zIndex: 100,
        backgroundColor: "#06050F",
      }}>

        {/* ── SKY GRADIENT ─────────────────────────────── */}
        <div style={{
          position: "absolute", inset: 0,
          opacity: landFade,
          background: `
            linear-gradient(to bottom,
              #06050F 0%,
              #080B1E 7%,
              #10183C 16%,
              #1E2A50 26%,
              #3A3860 38%,
              #6A4C35 52%,
              #A87025 62%,
              #CC9230 66%,
              #E0A838 68%,
              #C88828 73%,
              #7A4E18 82%,
              #1E1208 91%,
              #080608 100%
            )
          `,
          transition: "opacity 0.5s",
        }}/>

        {/* ── SUN CORONA ───────────────────────────────── */}
        <div style={{
          position: "absolute",
          left: "40%", top: "58%",
          width: "800px", height: "440px",
          transform: "translate(-50%, -50%)",
          background: `
            radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,200,80,0.55) 0%, rgba(220,150,30,0.22) 35%, rgba(160,90,15,0.08) 65%, transparent 80%)
          `,
          opacity: landFade,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}/>

        {/* ── ATMOSPHERIC HAZE ─────────────────────────── */}
        <div style={{
          position: "absolute", left: 0, right: 0,
          top: "40%", height: "35%",
          background: "linear-gradient(to bottom, transparent 0%, rgba(180,130,50,0.14) 50%, transparent 100%)",
          opacity: landFade * 0.85,
          filter: "blur(22px)",
          pointerEvents: "none",
        }}/>

        {/* ── FAR MOUNTAINS ────────────────────────────── */}
        <svg
          style={{ position: "absolute", bottom: "27%", width: "100%", opacity: landFade * 0.5 }}
          viewBox="0 0 1440 220" preserveAspectRatio="none"
        >
          <path d="M0,220 L0,150 L80,128 L160,105 L240,118 L340,72 L440,55 L520,82 L600,44 L680,60 L760,32 L840,58 L920,78 L1000,48 L1100,66 L1200,52 L1300,74 L1440,85 L1440,220 Z"
            fill="#222E50" opacity="0.7"/>
        </svg>

        {/* ── MID MOUNTAINS ────────────────────────────── */}
        <svg
          style={{ position: "absolute", bottom: "20%", width: "100%", opacity: landFade * 0.75 }}
          viewBox="0 0 1440 260" preserveAspectRatio="none"
        >
          <path d="M0,260 L0,205 L90,162 L180,145 L260,168 L350,112 L440,78 L530,98 L610,62 L700,35 L780,55 L860,42 L950,68 L1040,48 L1140,80 L1230,60 L1320,88 L1440,72 L1440,260 Z"
            fill="#182215" opacity="0.88"/>
        </svg>

        {/* ── NEAR MOUNTAINS ───────────────────────────── */}
        <svg
          style={{ position: "absolute", bottom: "14%", width: "100%", opacity: landFade }}
          viewBox="0 0 1440 200" preserveAspectRatio="none"
        >
          <path d="M0,200 L0,165 L110,125 L220,140 L310,105 L390,128 L470,92 L530,112 L595,80 L660,96 L740,58 L810,78 L890,52 L970,72 L1055,48 L1140,68 L1220,88 L1300,65 L1380,84 L1440,110 L1440,200 Z"
            fill="#0E1A0A" opacity="0.96"/>
        </svg>

        {/* ── GROUND ───────────────────────────────────── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "16%",
          background: "linear-gradient(to bottom, #0C1008 0%, #060508 100%)",
          opacity: landFade,
        }}/>

        {/* ── GROUND FOG ───────────────────────────────── */}
        <div style={{
          position: "absolute", bottom: "11%", left: 0, right: 0, height: "20%",
          background: "linear-gradient(to top, rgba(180,155,90,0.22) 0%, rgba(120,100,55,0.08) 50%, transparent 100%)",
          opacity: landFade,
          filter: "blur(10px)",
          pointerEvents: "none",
        }}/>

        {/* ── FLOATING DUST MOTES ──────────────────────── */}
        {landFade > 0.3 && [
          { x:12, y:45, delay:0,   dur:4.5 },
          { x:25, y:38, delay:0.8, dur:5.2 },
          { x:55, y:52, delay:1.4, dur:3.8 },
          { x:68, y:42, delay:0.3, dur:6.1 },
          { x:80, y:48, delay:1.9, dur:4.2 },
          { x:35, y:55, delay:2.4, dur:5.5 },
          { x:88, y:35, delay:0.6, dur:4.8 },
          { x:44, y:40, delay:1.1, dur:3.5 },
        ].map((d, i) => (
          <DustMote key={i} {...d}/>
        ))}

        {/* ── LIGHT RAYS FROM ABOVE ────────────────────── */}
        {rayT > 0.01 && (
          <>
            <div style={{
              position: "absolute", left: "42%", top: 0,
              transform: "translateX(-50%)",
              width: "300px", height: "72vh",
              background: "linear-gradient(to bottom, rgba(255,205,80,0.20) 0%, rgba(200,155,50,0.07) 55%, transparent 100%)",
              clipPath: "polygon(36% 0%, 64% 0%, 88% 100%, 12% 100%)",
              opacity: rayT * landFade,
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}/>
            <div style={{
              position: "absolute", left: "55%", top: 0,
              transform: "translateX(-50%)",
              width: "180px", height: "60vh",
              background: "linear-gradient(to bottom, rgba(255,205,80,0.12) 0%, transparent 80%)",
              clipPath: "polygon(28% 0%, 72% 0%, 82% 100%, 18% 100%)",
              opacity: rayT * landFade * 0.65,
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}/>
          </>
        )}

        {/* ── WIND STREAKS (during fall) ────────────────── */}
        {windActive && [
          { y:22, delay:0,    width:130, opacity:0.18 },
          { y:35, delay:0.22, width:90,  opacity:0.14 },
          { y:48, delay:0.45, width:170, opacity:0.22 },
          { y:58, delay:0.10, width:110, opacity:0.16 },
          { y:70, delay:0.65, width:80,  opacity:0.12 },
        ].map((s, i) => (
          <WindStreak key={i} {...s}/>
        ))}

        {/* ── THE BOOK ─────────────────────────────────── */}
        {bookFallT > 0 && (
          <div style={{
            position: "absolute",
            left: "50%",
            top: `${bookTopPct}%`,
            transform: `
              translateX(-50%)
              rotateZ(${bookRotateZ}deg)
              rotateX(${bookRotateX}deg)
              scale(${bookScale * (1 + impactPulse)})
            `,
            width: "clamp(180px, 24vw, 340px)",
            aspectRatio: "0.70",
            transformOrigin: "50% 85%",
            zIndex: 10,
            perspective: "600px",
            filter: settledGlow > 0.1
              ? `drop-shadow(0 0 ${32 * settledGlow}px rgba(201,168,76,0.75))
                 drop-shadow(0 ${30 * bookScale}px ${55 * bookScale}px rgba(0,0,0,0.92))`
              : `drop-shadow(0 ${30 * bookScale}px ${55 * bookScale}px rgba(0,0,0,0.92))`,
          }}>
            {/* Leather cover */}
            <div style={{
              width: "100%", height: "100%",
              background: LEATHER,
              borderRadius: "2px 10px 10px 2px",
              border: `1px solid rgba(201,168,76,${0.32 + settledGlow * 0.28})`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              position: "relative", overflow: "hidden",
            }}>
              {/* Inner borders */}
              <div style={{ position: "absolute", inset: "9%", border: "1px solid rgba(201,168,76,0.22)", borderRadius: "1px", pointerEvents: "none" }}/>
              <div style={{ position: "absolute", inset: "13%", border: "1px solid rgba(201,168,76,0.10)", borderRadius: "1px", pointerEvents: "none" }}/>

              {/* Diagonal light sheen */}
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(135deg,
                  rgba(201,168,76,${0.09 + settledGlow * 0.10}) 0%,
                  transparent 50%,
                  rgba(0,0,0,0.12) 100%)`,
                pointerEvents: "none",
              }}/>

              {/* Corner decorations */}
              {[["tl","2%","2%"],["tr","2%","auto"],["bl","auto","2%"],["br","auto","auto"]].map(([,t,l], i) => (
                <div key={i} style={{
                  position: "absolute",
                  top: i < 2 ? "2%" : "auto",
                  bottom: i >= 2 ? "2%" : "auto",
                  left: i % 2 === 0 ? "2%" : "auto",
                  right: i % 2 === 1 ? "2%" : "auto",
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d={i === 0 ? "M2 12 V2 H12" : i === 1 ? "M18 12 V2 H8" : i === 2 ? "M2 8 V18 H12" : "M18 8 V18 H8"}
                      stroke={GOLD} strokeWidth="0.8" fill="none" opacity="0.5"
                    />
                    <circle cx={i===0||i===2?2:18} cy={i===0||i===1?2:18} r="1.5" fill={GOLD} opacity="0.4"/>
                  </svg>
                </div>
              ))}

              {/* NOORVA title */}
              <div style={{
                fontSize: "clamp(14px, 2.8vw, 28px)",
                fontFamily: "var(--font-playfair), serif",
                fontWeight: 800, letterSpacing: "0.18em",
                color: GOLD,
                textShadow: `0 0 18px rgba(201,168,76,${0.55 + settledGlow * 0.5}), 0 2px 4px rgba(0,0,0,0.9)`,
                marginBottom: "5px",
              }}>NOORVA</div>

              <div style={{
                width: "40px", height: "1px",
                background: `linear-gradient(90deg, transparent, rgba(201,168,76,0.55), transparent)`,
                marginBottom: "5px",
              }}/>

              <div style={{
                fontSize: "clamp(4.5px, 0.75vw, 7px)",
                letterSpacing: "0.25em", textTransform: "uppercase",
                color: `rgba(201,168,76,0.65)`,
                fontFamily: "var(--font-inter)",
                textAlign: "center",
              }}>The Book of Intelligence</div>

              {/* Right-edge page stack */}
              <div style={{
                position: "absolute", top: "2%", bottom: "2%", right: "-5px",
                width: "5px",
                background: "linear-gradient(90deg, #2a1206, #4a2810, #3a1808)",
                borderRadius: "0 2px 2px 0",
              }}/>
            </div>
          </div>
        )}

        {/* ── IMPACT RINGS ─────────────────────────────── */}
        {showImpact && (
          <div style={{
            position: "absolute",
            left: "50%", top: `calc(${bookTopPct}% + 80%)`,
            pointerEvents: "none",
          }}>
            <ImpactRing delay={0}    size={80}/>
            <ImpactRing delay={0.12} size={140}/>
            <ImpactRing delay={0.26} size={210}/>
          </div>
        )}

        {/* ── GROUND DUST CLOUD ────────────────────────── */}
        {dustCloudT > 0 && (
          <div style={{
            position: "absolute",
            left: "50%", bottom: "16%",
            transform: `translateX(-50%)`,
            width:   `${180 + dustCloudT * 500}px`,
            height:  `${25  + dustCloudT * 55}px`,
            background: "radial-gradient(ellipse, rgba(180,145,60,0.38) 0%, rgba(130,100,40,0.14) 45%, transparent 70%)",
            opacity: Math.max(0, 1 - dustCloudT) * landFade,
            filter: "blur(10px)",
            pointerEvents: "none",
          }}/>
        )}

        {/* ── GOLDEN GROUND GLOW under settled book ────── */}
        {settledGlow > 0 && (
          <div style={{
            position: "absolute",
            left: "50%", bottom: "14%",
            transform: "translateX(-50%)",
            width: "520px", height: "110px",
            background: `radial-gradient(ellipse, rgba(201,168,76,${0.38 * settledGlow}) 0%, rgba(160,120,35,${0.16 * settledGlow}) 40%, transparent 70%)`,
            filter: "blur(16px)",
            pointerEvents: "none",
          }}/>
        )}

        {/* ── FINAL DARK FADE ───────────────────────────── */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundColor: "#06050F",
          opacity: darkFade,
          pointerEvents: "none",
          zIndex: 20,
        }}/>
      </div>
    </div>
  );
}
