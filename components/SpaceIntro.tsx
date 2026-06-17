"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { SPACE_INTRO_VH } from "@/lib/constants";

const TEXT_PHASES = [
  { id: 1, text: "Every Great Discovery",   sub: "Begins with a Journey",   sp: 0.03, ep: 0.15 },
  { id: 2, text: "Knowledge Lives",          sub: "Beyond the Stars",         sp: 0.18, ep: 0.31 },
  { id: 3, text: "The Future Awaits",        sub: null,                       sp: 0.35, ep: 0.48 },
  { id: 4, text: "Connecting Humanity",      sub: "Through Intelligence",     sp: 0.57, ep: 0.72 },
] as const;

export default function SpaceIntro() {
  const mountRef    = useRef<HTMLDivElement>(null);
  const [phase,     setPhase]     = useState<number | null>(null);
  const [overlay,   setOverlay]   = useState(0);
  const [inIntro,   setInIntro]   = useState(true);
  const [showHint,  setShowHint]  = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const isMobile  = window.innerWidth < 768;

    // ── Renderer ─────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    container.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────────────
    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0x050816);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 100);

    // ── Lighting ──────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x203060, 4));
    const sun = new THREE.DirectionalLight(0xffeedd, 4.5);
    sun.position.set(80, 50, 100);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x4466ff, 1.5);
    rim.position.set(-50, -20, -100);
    scene.add(rim);

    // ── Star sprite ───────────────────────────────────────────────
    const sc = document.createElement("canvas");
    sc.width = 64; sc.height = 64;
    const sctx = sc.getContext("2d")!;
    const sg = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sg.addColorStop(0,    "rgba(255,255,255,1)");
    sg.addColorStop(0.12, "rgba(210,225,255,0.88)");
    sg.addColorStop(0.40, "rgba(150,175,255,0.28)");
    sg.addColorStop(1,    "rgba(0,0,0,0)");
    sctx.fillStyle = sg; sctx.fillRect(0, 0, 64, 64);
    const starSprite = new THREE.CanvasTexture(sc);

    function makeStars(n: number, spread: number, sz: number, op: number): THREE.Points {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r  = spread * (0.2 + Math.random() * 0.8);
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
        pos[i*3+1] = r * Math.sin(ph) * Math.sin(th) * 0.55;
        pos[i*3+2] = r * Math.cos(ph);
        const v = Math.random();
        if      (v < 0.12) { col[i*3]=0.7;  col[i*3+1]=0.85; col[i*3+2]=1.0; }
        else if (v < 0.22) { col[i*3]=1.0;  col[i*3+1]=0.9;  col[i*3+2]=0.7; }
        else               { col[i*3]=0.97; col[i*3+1]=0.97; col[i*3+2]=1.0; }
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color",    new THREE.BufferAttribute(col, 3));
      return new THREE.Points(geo, new THREE.PointsMaterial({
        size: sz, map: starSprite, vertexColors: true,
        transparent: true, opacity: op,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      }));
    }

    const baseCount = isMobile ? 0.5 : 1;
    const star1 = makeStars(Math.floor(12000 * baseCount), 600, 0.7,  0.9);
    const star2 = makeStars(Math.floor(5000  * baseCount), 280, 1.1,  0.85);
    const star3 = makeStars(Math.floor(1000  * baseCount), 140, 1.9,  0.80);
    scene.add(star1, star2, star3);

    // ── Nebulae ───────────────────────────────────────────────────
    function makeNeb(hex: number, x: number, y: number, z: number, r: number, op: number): THREE.Mesh {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(r, 16, 16),
        new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: op, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      m.position.set(x, y, z);
      return m;
    }

    const nebulae = [
      makeNeb(0x4F46E5, -40,  15,  -55,  50, 0.07),
      makeNeb(0x7C3AED,  36, -18,  -95,  60, 0.065),
      makeNeb(0x0891B2, -22,  28, -140,  72, 0.06),
      makeNeb(0x8B5CF6,  48, -12, -180,  85, 0.065),
      makeNeb(0x4338CA, -30,  22, -225,  95, 0.07),
      makeNeb(0x1D4ED8,  18, -28, -272, 108, 0.08),
      // bright cores
      makeNeb(0x818CF8, -40,  15,  -55,  14, 0.17),
      makeNeb(0xA78BFA,  36, -18,  -95,  17, 0.14),
      makeNeb(0x22D3EE, -22,  28, -140,  19, 0.12),
      makeNeb(0x818CF8,  48, -12, -180,  22, 0.12),
    ];
    nebulae.forEach(n => scene.add(n));

    // ── Cosmic dust ───────────────────────────────────────────────
    function makeDust(n: number, z1: number, z2: number): THREE.Points {
      const geo  = new THREE.BufferGeometry();
      const pos  = new Float32Array(n * 3);
      const col  = new Float32Array(n * 3);
      const PAL  = [[0.31,0.27,0.9],[0.49,0.24,0.93],[0.02,0.71,0.83],[0.55,0.36,0.96]];
      for (let i = 0; i < n; i++) {
        pos[i*3]   = (Math.random()-0.5)*200;
        pos[i*3+1] = (Math.random()-0.5)*130;
        pos[i*3+2] = z1 + Math.random()*(z2-z1);
        const c = PAL[Math.floor(Math.random()*4)];
        col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color",    new THREE.BufferAttribute(col, 3));
      return new THREE.Points(geo, new THREE.PointsMaterial({
        size: 1.6, vertexColors: true, transparent: true, opacity: 0.45,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      }));
    }

    const dust1 = makeDust(Math.floor(1200*baseCount), -40,  -200);
    const dust2 = makeDust(Math.floor(800 *baseCount), -200, -320);
    scene.add(dust1, dust2);

    // ── Earth ─────────────────────────────────────────────────────
    const EARTH_Z = -280;

    // Earth canvas texture
    const ec = document.createElement("canvas");
    ec.width = 1024; ec.height = 512;
    const ectx = ec.getContext("2d")!;
    const og = ectx.createLinearGradient(0, 0, 0, 512);
    og.addColorStop(0,   "#071d42");
    og.addColorStop(0.3, "#0b3d78");
    og.addColorStop(0.5, "#0e4f9a");
    og.addColorStop(0.7, "#0b3d78");
    og.addColorStop(1,   "#071d42");
    ectx.fillStyle = og; ectx.fillRect(0, 0, 1024, 512);

    const lands = [
      { x:215, y:155, rx:88,  ry:67,  rot:-0.05, c:"#1d5c10" },
      { x:285, y:295, rx:46,  ry:88,  rot: 0.20, c:"#277318" },
      { x:490, y:148, rx:54,  ry:50,  rot:-0.10, c:"#4a7a25" },
      { x:510, y:272, rx:64,  ry:98,  rot: 0.10, c:"#3d6e1e" },
      { x:688, y:132, rx:148, ry:80,  rot:-0.05, c:"#3a6818" },
      { x:772, y:338, rx:54,  ry:40,  rot: 0.15, c:"#7a6228" },
    ];
    lands.forEach(l => {
      ectx.save();
      ectx.translate(l.x, l.y); ectx.rotate(l.rot);
      ectx.beginPath();
      ectx.ellipse(0, 0, l.rx, l.ry, 0, 0, Math.PI*2);
      ectx.fillStyle = l.c; ectx.fill();
      ectx.restore();
    });

    const ice1 = ectx.createLinearGradient(0,0,0,60);
    ice1.addColorStop(0,"rgba(220,235,255,0.95)"); ice1.addColorStop(1,"rgba(220,235,255,0)");
    ectx.fillStyle=ice1; ectx.fillRect(0,0,1024,60);
    const ice2 = ectx.createLinearGradient(0,452,0,512);
    ice2.addColorStop(0,"rgba(220,235,255,0)"); ice2.addColorStop(1,"rgba(220,235,255,0.9)");
    ectx.fillStyle=ice2; ectx.fillRect(0,452,1024,60);
    const earthTex = new THREE.CanvasTexture(ec);

    // Cloud canvas texture
    const cc = document.createElement("canvas");
    cc.width = 512; cc.height = 256;
    const cctx = cc.getContext("2d")!;
    cctx.clearRect(0, 0, 512, 256);
    for (let i = 0; i < 60; i++) {
      const x = Math.random()*512, y = Math.random()*256;
      const r = 14 + Math.random()*32;
      const g = cctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,`rgba(255,255,255,${0.45+Math.random()*0.40})`);
      g.addColorStop(1,"rgba(255,255,255,0)");
      cctx.fillStyle=g;
      cctx.beginPath();
      cctx.ellipse(x,y,r*2,r*0.55,Math.random()*Math.PI,0,Math.PI*2);
      cctx.fill();
    }
    const cloudTex = new THREE.CanvasTexture(cc);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(14, 64, 64),
      new THREE.MeshPhongMaterial({ map: earthTex, specular: new THREE.Color(0x112244), shininess: 28, emissive: new THREE.Color(0x001533), emissiveIntensity: 0.35 })
    );
    earth.position.set(0, -4, EARTH_Z);
    scene.add(earth);

    const cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(14.45, 64, 64),
      new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.50, depthWrite: false })
    );
    cloudMesh.position.copy(earth.position);
    scene.add(cloudMesh);

    const atmo1 = new THREE.Mesh(
      new THREE.SphereGeometry(15.9, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x1a7fff, transparent: true, opacity: 0.17, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    atmo1.position.copy(earth.position); scene.add(atmo1);

    const atmo2 = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.07, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    atmo2.position.copy(earth.position); scene.add(atmo2);

    const atmo3 = new THREE.Mesh(
      new THREE.SphereGeometry(24, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.025, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    atmo3.position.copy(earth.position); scene.add(atmo3);

    // ── Helpers ───────────────────────────────────────────────────
    const lerp  = (a: number, b: number, t: number) => a + (b-a)*t;
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const ss    = (a: number, b: number, t: number) => { const x=clamp((t-a)/(b-a),0,1); return x*x*(3-2*x); };
    const eio   = (t: number) => t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
    const getP  = () => clamp(window.scrollY / ((SPACE_INTRO_VH/100)*window.innerHeight), 0, 1);

    // ── Render loop ───────────────────────────────────────────────
    let animId = 0;
    let T = 0;
    let prevPhase: number | null = -1;
    let prevOverlay = -1;
    let prevInIntro = true;
    let prevHint = true;

    function tick() {
      animId = requestAnimationFrame(tick);
      T += 0.005;
      const p = getP();

      // Camera
      if (p < 0.15) {
        camera.position.set(Math.sin(T*0.25)*2.5, Math.cos(T*0.18)*1.5, 100);
        camera.lookAt(0, 0, 0);
      } else if (p < 0.70) {
        const progress  = eio((p-0.15)/0.55);
        const cz        = lerp(100, EARTH_Z+20, progress);
        const pathFade  = 1 - eio(clamp((p-0.38)/0.22, 0, 1));
        const cx        = Math.sin(p*8)*7*pathFade;
        const cy        = Math.cos(p*6)*4*pathFade;
        camera.position.set(cx, cy, cz);
        const lt = ss(0.40, 0.66, p);
        camera.lookAt(lerp(cx,0,lt), lerp(cy,earth.position.y,lt), lerp(cz-80,EARTH_Z,lt));
      } else if (p < 0.85) {
        const t2 = (p-0.70)/0.15;
        camera.position.set(0, lerp(2,7,t2), lerp(EARTH_Z+20, EARTH_Z-14, eio(t2)));
        camera.lookAt(0, earth.position.y, EARTH_Z);
      } else {
        const t3 = (p-0.85)/0.15;
        camera.position.set(0, lerp(7,0,t3), lerp(EARTH_Z-14, EARTH_Z-44, t3));
        camera.lookAt(0, earth.position.y, EARTH_Z);
      }

      // Slow rotations
      star1.rotation.y = T*0.016; star1.rotation.x = T*0.007;
      star2.rotation.y = -T*0.011;
      star3.rotation.y = T*0.021;
      earth.rotation.y     = T*0.11;
      cloudMesh.rotation.y = T*0.135;
      nebulae.slice(0,6).forEach((n,i) => {
        n.rotation.y = T*(0.008+i*0.003);
        n.rotation.z = T*(0.005+i*0.002);
      });

      // Only render when visible — saves GPU when user is browsing the Noorva site
      if (p < 1.01) renderer.render(scene, camera);

      // React state — throttled by diffing
      let nextPhase: number | null = null;
      for (const tp of TEXT_PHASES) {
        if (p >= tp.sp && p <= tp.ep) { nextPhase = tp.id; break; }
      }
      if (nextPhase !== prevPhase) { prevPhase = nextPhase; setPhase(nextPhase); }

      const nextOverlay = p > 0.80 ? clamp(ss(0.80, 1.0, p), 0, 1) : 0;
      if (Math.abs(nextOverlay - prevOverlay) > 0.008) { prevOverlay = nextOverlay; setOverlay(nextOverlay); }

      // Hide overlay (CSS display:none) when past intro; show again on scroll back
      const nextInIntro = p < 0.995;
      if (nextInIntro !== prevInIntro) { prevInIntro = nextInIntro; setInIntro(nextInIntro); }

      const nextHint = p < 0.025;
      if (nextHint !== prevHint) { prevHint = nextHint; setShowHint(nextHint); }
    }

    tick();

    // Backup scroll listener so inIntro updates without waiting for RAF
    // (needed for fast-scroll cases and programmatic scroll in automated tests)
    function onScrollFast() {
      const p = clamp(window.scrollY / ((SPACE_INTRO_VH/100)*window.innerHeight), 0, 1);
      if (p >= 0.995 && prevInIntro) { prevInIntro = false; setInIntro(false); }
      if (p < 0.995 && !prevInIntro) { prevInIntro = true; setInIntro(true); }
    }
    window.addEventListener("scroll", onScrollFast, { passive: true });

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("scroll", onScrollFast);
      window.removeEventListener("resize", onResize);
      [star1, star2, star3, dust1, dust2].forEach(p => {
        p.geometry.dispose();
        (p.material as THREE.Material).dispose();
      });
      nebulae.forEach(n => { n.geometry.dispose(); (n.material as THREE.Material).dispose(); });
      [earth, cloudMesh, atmo1, atmo2, atmo3].forEach(m => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      earthTex.dispose(); cloudTex.dispose(); starSprite.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  const activePhase  = TEXT_PHASES.find(tp => tp.id === phase);
  const logoOpacity  = Math.max(0, (overlay - 0.62) / 0.38);

  return (
    <div style={{ height: `${SPACE_INTRO_VH}vh` }}>
      {/*
        Wrapper uses display:none (not unmount) so the Three.js canvas stays alive.
        display:none propagates to position:fixed children, hiding them completely.
        When the user scrolls back up, inIntro flips to true and everything resumes.
      */}
      <div style={{ display: inIntro ? "block" : "none" }}>
          {/* Three.js canvas mount */}
          <div
            ref={mountRef}
            style={{ position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none" }}
          />

          {/* Text overlays */}
          <div style={{
            position: "fixed", inset: 0, zIndex: 51,
            pointerEvents: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AnimatePresence mode="wait">
              {activePhase && (
                <motion.div
                  key={activePhase.id}
                  initial={{ opacity: 0, y: 44, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -18, scale: 1.01, transition: { duration: 0.38, ease: "easeIn" } }}
                  transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
                  style={{ textAlign: "center", padding: "0 32px", maxWidth: "900px" }}
                >
                  <div style={{
                    fontSize: "clamp(2.4rem, 6.5vw, 8rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.05,
                    fontFamily: "var(--font-playfair), var(--font-jakarta), serif",
                    background: activePhase.id <= 3
                      ? "linear-gradient(160deg, #FFF8E8 0%, rgba(240,220,160,0.90) 100%)"
                      : "linear-gradient(160deg, #F5DFA0 0%, #E8C86A 45%, #FFF8E8 85%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 2px 28px rgba(0,0,0,0.7))",
                  }}>
                    {activePhase.text}
                  </div>
                  {activePhase.sub && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45, duration: 0.7 }}
                      style={{
                        marginTop: "18px",
                        fontSize: "clamp(0.75rem, 1.6vw, 1.25rem)",
                        color: "rgba(240,218,150,0.78)",
                        fontWeight: 400,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        fontFamily: "var(--font-inter)",
                        textShadow: "0 2px 20px rgba(0,0,0,0.9)",
                      }}
                    >
                      {activePhase.sub}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scroll hint */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.8 } }}
                  transition={{ duration: 1.4, delay: 2.0 }}
                  style={{
                    position: "absolute", bottom: "52px",
                    left: "50%", transform: "translateX(-50%)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", gap: "10px",
                  }}
                >
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ color: "rgba(255,255,255,0.26)" }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                  <span style={{
                    fontSize: "9px", letterSpacing: "0.30em",
                    color: "rgba(255,255,255,0.18)",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-inter)", fontWeight: 500,
                  }}>
                    scroll to begin
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fade to dark — LandingScene takes over from here */}
          {overlay > 0 && (
            <div style={{
              position: "fixed", inset: 0, zIndex: 52,
              background: "#06050F",
              opacity: overlay,
              pointerEvents: "none",
            }} />
          )}
      </div>
    </div>
  );
}
