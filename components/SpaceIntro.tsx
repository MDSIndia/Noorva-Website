"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { SPACE_INTRO_VH } from "@/lib/constants";

// ─── Module helpers ───────────────────────────────────────────────────────────
const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const ss    = (a: number, b: number, t: number) => { const x = clamp((t-a)/(b-a),0,1); return x*x*(3-2*x); };

function addSoftBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot: number,
  color: string,
  alpha = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
  g.addColorStop(0, color.replace("ALPHA", alpha.toFixed(2)));
  g.addColorStop(0.55, color.replace("ALPHA", (alpha * 0.38).toFixed(2)));
  g.addColorStop(1, color.replace("ALPHA", "0"));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function addFineNoise(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, alpha: number) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 0.4 + Math.random() * 1.8;
    ctx.fillStyle = Math.random() > 0.5
      ? `rgba(255,255,255,${alpha * Math.random()})`
      : `rgba(0,0,0,${alpha * 0.45 * Math.random()})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawIrregularCap(
  ctx: CanvasRenderingContext2D,
  w: number,
  yTop: number,
  h: number,
  direction: 1 | -1
) {
  const grad = ctx.createLinearGradient(0, yTop, 0, yTop + h);
  grad.addColorStop(0, "rgba(235,245,255,0.86)");
  grad.addColorStop(0.55, "rgba(210,225,235,0.46)");
  grad.addColorStop(1, "rgba(210,225,235,0)");
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(0, direction > 0 ? yTop : yTop + h);
  for (let x = 0; x <= w; x += 18) {
    const edge = yTop + (direction > 0
      ? Math.sin(x * 0.035) * 8 + Math.sin(x * 0.011 + 1.8) * 5
      : -Math.sin(x * 0.030) * 8 - Math.sin(x * 0.014 + 0.7) * 5);
    if (direction > 0) ctx.lineTo(x, edge);
    else ctx.lineTo(x, edge);
  }
  ctx.lineTo(w, direction > 0 ? yTop + h : yTop);
  ctx.lineTo(0, direction > 0 ? yTop + h : yTop);
  ctx.closePath();
  ctx.fill();

  addFineNoise(ctx, w, h, 90, 0.05);
}

function drawOrganicBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number,
  fill: string,
  detail = 18,
  wobble = 0.16
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  const seed = Math.random() * Math.PI * 2;
  ctx.beginPath();
  for (let i = 0; i <= detail; i++) {
    const a = (i / detail) * Math.PI * 2;
    const wobbleA = 1 + Math.sin(a * 3 + seed) * wobble + Math.sin(a * 7 + seed * 0.7) * wobble * 0.45;
    const x = Math.cos(a) * rx * wobbleA;
    const y = Math.sin(a) * ry * (1 + Math.sin(a * 2 - seed) * wobble * 0.45);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

// ─── Camera waypoints [progress, x, y, z] ────────────────────────────────────
// Guided fly-through: starts in deep space, passes a natural planetary arc, then locks onto Earth.
type WP = [number, number, number, number];
const WAYPOINTS: WP[] = [
  [0.00,   0,   0,  120],
  [0.18,   0,   0,  104],
  [0.34, -32,   8,  -92],  // outer system arc, Mars visible from left
  [0.48, -10,   5, -162],  // drift past Mars / toward Saturn
  [0.58,  34,  -8, -184],  // pass near gas giant
  [0.68,  -4,  12, -214],  // view Saturn before Earth
  [0.78,   0,   4, -250],  // Earth comes into focus
  [0.88,   0,   2, -282],  // atmospheric approach
  [0.94,   0,   0, -306],  // crossing atmosphere
  [1.00,   0,  -2, -330],  // deep inside
];

const PLANET_ARC = {
  mars:    [-54, 18, -118] as [number, number, number],
  saturn:  [-36, 20, -214] as [number, number, number],
  jupiter: [42, -18, -184] as [number, number, number],
  earth:   [0, -4, -280] as [number, number, number],
};

function wpPos(p: number): [number, number, number] {
  p = clamp(p, 0, 1);
  let segment = 0;
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    if (p >= WAYPOINTS[i][0] && p <= WAYPOINTS[i + 1][0]) { segment = i; break; }
  }
  const lo = WAYPOINTS[segment], hi = WAYPOINTS[segment + 1];
  const t  = lo[0] === hi[0] ? 0 : (p - lo[0]) / (hi[0] - lo[0]);
  const before = WAYPOINTS[Math.max(0, segment - 1)];
  const after  = WAYPOINTS[Math.min(WAYPOINTS.length - 1, segment + 2)];
  const spline = (a: number, b: number, c: number, d: number) => {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  };
  return [
    spline(before[1], lo[1], hi[1], after[1]),
    spline(before[2], lo[2], hi[2], after[2]),
    spline(before[3], lo[3], hi[3], after[3]),
  ];
}

// ─── Atmosphere overlay: dark approach → blue entry → white flash → dark ─────
function overlayForP(p: number): string {
  if (p < 0.78) return "rgba(0,0,0,0)";
  if (p < 0.86) {
    const a = ss(0.78, 0.86, p) * 0.55;
    return `rgba(3,4,10,${a.toFixed(3)})`;
  }
  if (p < 0.91) {
    const t = (p - 0.86) / 0.05;
    return `rgba(${Math.round(lerp(3,18,t))},${Math.round(lerp(4,65,t))},${Math.round(lerp(10,155,t))},${lerp(0.55,0.72,t).toFixed(3)})`;
  }
  if (p < 0.94) {
    const t = (p - 0.91) / 0.03;
    return `rgba(${Math.round(lerp(18,65,t))},${Math.round(lerp(65,145,t))},${Math.round(lerp(155,235,t))},${lerp(0.72,0.90,t).toFixed(3)})`;
  }
  // sky-blue → dark for website hand-off
  const t = clamp((p - 0.94) / 0.06, 0, 1);
  return `rgba(${Math.round(lerp(65,6,t))},${Math.round(lerp(145,5,t))},${Math.round(lerp(235,15,t))},${lerp(0.90,1.0,t).toFixed(3)})`;
}

// ─── Text phases ──────────────────────────────────────────────────────────────
const TEXT_PHASES = [
  { id: 1, text: "Every Great Discovery",  sub: "Begins with a Journey",  sp: 0.03, ep: 0.15 },
  { id: 2, text: "Knowledge Lives",         sub: "Beyond the Stars",        sp: 0.18, ep: 0.31 },
  { id: 3, text: "The Future Awaits",       sub: null,                      sp: 0.35, ep: 0.48 },
  { id: 4, text: "Connecting Humanity",     sub: "Through Intelligence",    sp: 0.57, ep: 0.72 },
] as const;

export default function SpaceIntro() {
  const mountRef   = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [phase,    setPhase]    = useState<number | null>(null);
  const [inIntro,  setInIntro]  = useState(true);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const isMobile  = window.innerWidth < 768;

    // ── Renderer ──────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x01030d, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    container.appendChild(renderer.domElement);

    // ── Scene / Camera ─────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0x01030d);
    scene.fog = new THREE.FogExp2(0x020614, 0.00155);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 120);

    // ── Lighting ───────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1d2945, 1.4));
    const sun = new THREE.DirectionalLight(0xfff1d4, 2.2);
    sun.position.set(90, 55, 115);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x6f9cff, 0.75);
    rim.position.set(-70, -35, -120);
    scene.add(rim);

    // ── Star sprite ────────────────────────────────────────────────────
    const sc   = document.createElement("canvas");
    sc.width   = 96; sc.height = 96;
    const sctx = sc.getContext("2d")!;
    const sg   = sctx.createRadialGradient(48, 48, 0, 48, 48, 48);
    sg.addColorStop(0,    "rgba(255,255,255,1)");
    sg.addColorStop(0.18, "rgba(235,240,255,0.92)");
    sg.addColorStop(0.38, "rgba(190,210,255,0.22)");
    sg.addColorStop(1,    "rgba(0,0,0,0)");
    sctx.fillStyle = sg; sctx.fillRect(0, 0, 96, 96);
    addFineNoise(sctx, 96, 96, 80, 0.08);
    const starSprite = new THREE.CanvasTexture(sc);
    starSprite.colorSpace = THREE.SRGBColorSpace;

    function makeStars(n: number, spread: number, sz: number, op: number, flatness = 0.52): THREE.Points {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r  = spread * (0.12 + Math.pow(Math.random(), 0.72) * 0.88);
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
        pos[i*3+1] = r * Math.sin(ph) * Math.sin(th) * flatness;
        pos[i*3+2] = r * Math.cos(ph);
        const v = Math.random();
        if      (v < 0.10) { col[i*3]=0.72;  col[i*3+1]=0.84; col[i*3+2]=1.0; }
        else if (v < 0.20) { col[i*3]=1.0;  col[i*3+1]=0.92;  col[i*3+2]=0.76; }
        else if (v < 0.27) { col[i*3]=0.82; col[i*3+1]=0.92; col[i*3+2]=1.0; }
        else               { col[i*3]=0.96; col[i*3+1]=0.97; col[i*3+2]=1.0; }
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color",    new THREE.BufferAttribute(col, 3));
      const material = new THREE.PointsMaterial({
        size: sz,
        map: starSprite,
        alphaTest: 0.025,
        transparent: true,
        opacity: op,
        blending: THREE.AdditiveBlending, depthWrite: false,
        vertexColors: true, sizeAttenuation: true,
      });
      return new THREE.Points(geo, material);
    }

    const base  = isMobile ? 0.55 : 1;
    const star1 = makeStars(Math.floor(16000 * base), 720, 0.52,  0.74);
    const star2 = makeStars(Math.floor(6500  * base), 360, 0.78,  0.52, 0.44);
    const star3 = makeStars(Math.floor(1800  * base), 180, 1.18,  0.38, 0.38);
    scene.add(star1, star2, star3);

    // ── Nebulae ────────────────────────────────────────────────────────
    function makeNebulaTexture(): THREE.CanvasTexture {
      const nc = document.createElement("canvas");
      nc.width = 256; nc.height = 256;
      const nctx = nc.getContext("2d")!;
      nctx.clearRect(0, 0, 256, 256);

      const colors = [
        "rgba(79,70,229,ALPHA)",
        "rgba(124,58,237,ALPHA)",
        "rgba(8,145,178,ALPHA)",
        "rgba(139,92,246,ALPHA)",
        "rgba(59,130,246,ALPHA)",
      ];

      addSoftBlob(nctx, 126, 126, 110, 72, -0.2, colors[0], 0.22);
      addSoftBlob(nctx, 94, 118, 74, 52, 0.5, colors[1], 0.18);
      addSoftBlob(nctx, 158, 148, 84, 54, 0.1, colors[2], 0.13);
      addSoftBlob(nctx, 118, 154, 96, 46, -0.6, colors[3], 0.12);
      addSoftBlob(nctx, 180, 82, 48, 38, 0.7, "rgba(129,140,248,ALPHA)", 0.10);
      addFineNoise(nctx, 256, 256, 220, 0.045);

      const tex = new THREE.CanvasTexture(nc);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    const nebulaTexture = makeNebulaTexture();
    function makeNeb(hex: number, x: number, y: number, z: number, r: number, op: number): THREE.Sprite {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: nebulaTexture,
          color: hex,
          transparent: true,
          opacity: op,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      sprite.position.set(x, y, z);
      sprite.scale.set(r, r, 1);
      return sprite;
    }
    const nebulae = [
      makeNeb(0x4F46E5, -40,  15,  -55,  50, 0.035),
      makeNeb(0x7C3AED,  36, -18,  -95,  60, 0.032),
      makeNeb(0x0891B2, -22,  28, -140,  72, 0.030),
      makeNeb(0x8B5CF6,  48, -12, -180,  85, 0.032),
      makeNeb(0x4338CA, -30,  22, -225,  95, 0.035),
      makeNeb(0x1D4ED8,  18, -28, -272, 108, 0.040),
      makeNeb(0x818CF8, -40,  15,  -55,  14, 0.075),
      makeNeb(0xA78BFA,  36, -18,  -95,  17, 0.065),
      makeNeb(0x22D3EE, -22,  28, -140,  19, 0.055),
      makeNeb(0x818CF8,  48, -12, -180,  22, 0.055),
    ];
    nebulae.forEach(n => scene.add(n));

    // ── Cosmic dust ────────────────────────────────────────────────────
    function makeDust(n: number, z1: number, z2: number): THREE.Points {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      const PAL = [[0.78,0.84,1.0],[1.0,0.90,0.68],[0.64,0.82,1.0],[0.88,0.78,1.0]];
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
        size: 0.72,
        map: starSprite,
        alphaTest: 0.035,
        vertexColors: true,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }));
    }
    const dust1 = makeDust(Math.floor(1200*base), -40,  -200);
    const dust2 = makeDust(Math.floor(800 *base), -200, -320);
    scene.add(dust1, dust2);

    // ── MARS ──────────────────────────────────────────────────────────
    const marsC  = document.createElement("canvas");
    marsC.width  = 512; marsC.height = 256;
    const mctx   = marsC.getContext("2d")!;
    const marsGr = mctx.createLinearGradient(0, 0, 0, 256);
    marsGr.addColorStop(0,   "#2b1005"); marsGr.addColorStop(0.22, "#6b240e");
    marsGr.addColorStop(0.48, "#9a3c18"); marsGr.addColorStop(0.66, "#5f200c");
    marsGr.addColorStop(0.82, "#c05a24"); marsGr.addColorStop(1,   "#240b03");
    mctx.fillStyle = marsGr; mctx.fillRect(0, 0, 512, 256);

    // Natural dust fields, canyons, and darker basalt regions
    for (let i = 0; i < 70; i++) {
      const x = Math.random()*512, y = Math.random()*256;
      const rx = 12 + Math.random()*58;
      const ry = 4 + Math.random()*22;
      const pg = mctx.createRadialGradient(x,y,0,x,y,Math.max(rx, ry));
      const warm = Math.random() > 0.45;
      pg.addColorStop(0, warm ? "rgba(210,92,38,0.34)" : "rgba(45,13,5,0.36)");
      pg.addColorStop(0.55, warm ? "rgba(185,70,28,0.18)" : "rgba(75,22,7,0.20)");
      pg.addColorStop(1, "rgba(0,0,0,0)");
      mctx.fillStyle=pg; mctx.beginPath();
      mctx.ellipse(x, y, rx, ry, Math.random()*Math.PI, 0, Math.PI*2); mctx.fill();
    }

    // Low-contrast canyon bands
    for (let i = 0; i < 9; i++) {
      const y = 20 + i * 28 + Math.random() * 18;
      mctx.strokeStyle = `rgba(${120 + Math.random()*60},${45 + Math.random()*20},${18},${0.10 + Math.random()*0.08})`;
      mctx.lineWidth = 1 + Math.random() * 3;
      mctx.beginPath();
      for (let x = 0; x <= 512; x += 18) {
        const yy = y + Math.sin(x * 0.035 + i) * 9 + Math.sin(x * 0.011 + i * 0.7) * 5;
        if (x === 0) mctx.moveTo(x, yy); else mctx.lineTo(x, yy);
      }
      mctx.stroke();
    }

    // polar caps
    drawIrregularCap(mctx, 512, 0, 34, 1);
    drawIrregularCap(mctx, 512, 222, 34, -1);
    addFineNoise(mctx, 512, 256, 180, 0.035);
    const marsTex = new THREE.CanvasTexture(marsC);
    marsTex.colorSpace = THREE.SRGBColorSpace;
    const mars = new THREE.Mesh(
      new THREE.SphereGeometry(4.5, 48, 48),
      new THREE.MeshPhongMaterial({ map:marsTex, specular:new THREE.Color(0x180700), shininess:4, emissive:new THREE.Color(0x100300), emissiveIntensity:0.05 })
    );
    mars.position.set(-54, 18, -118); scene.add(mars);
    const marsAtmo = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 32, 32),
      new THREE.MeshBasicMaterial({ color:0xffb07a, transparent:true, opacity:0.035, side:THREE.BackSide, blending:THREE.AdditiveBlending, depthWrite:false })
    );
    marsAtmo.position.copy(mars.position); scene.add(marsAtmo);

    // ── GAS GIANT (Jupiter-like) ───────────────────────────────────────
    const gasC  = document.createElement("canvas");
    gasC.width  = 512; gasC.height = 256;
    const gctx  = gasC.getContext("2d")!;
    const gasGr = gctx.createLinearGradient(0, 0, 0, 256);
    gasGr.addColorStop(0,    "#3d2110"); gasGr.addColorStop(0.12, "#7d512a");
    gasGr.addColorStop(0.22, "#c59a62"); gasGr.addColorStop(0.34, "#d7b17d");
    gasGr.addColorStop(0.44, "#8c5b36"); gasGr.addColorStop(0.54, "#4a2b18");
    gasGr.addColorStop(0.64, "#9b6a38"); gasGr.addColorStop(0.74, "#7d542d");
    gasGr.addColorStop(0.84, "#5e371f"); gasGr.addColorStop(1,    "#2d180d");
    gctx.fillStyle = gasGr; gctx.fillRect(0, 0, 512, 256);
    // layered atmospheric bands
    ([ [28,10,"rgba(88,45,18,0.58)"],[55,18,"rgba(220,170,92,0.28)"],
       [95,12,"rgba(60,30,12,0.50)"], [132,8,"rgba(185,125,58,0.34)"],
       [158,20,"rgba(92,48,20,0.44)"],[195,10,"rgba(230,185,105,0.22)"],
       [220,14,"rgba(65,32,12,0.42)"] ] as [number,number,string][]).forEach(([y,h,c]) => {
      gctx.fillStyle=c; gctx.fillRect(0,y,512,h);
    });
    // soft turbulent streaks
    for (let i = 0; i < 18; i++) {
      const y = 12 + i * 14 + Math.random() * 8;
      gctx.strokeStyle = `rgba(${180 + Math.random()*55},${125 + Math.random()*40},${65 + Math.random()*25},${0.08 + Math.random()*0.10})`;
      gctx.lineWidth = 1 + Math.random() * 4;
      gctx.beginPath();
      for (let x = 0; x <= 512; x += 14) {
        const yy = y + Math.sin(x * 0.035 + i * 0.9) * 7 + Math.sin(x * 0.011 + i) * 4;
        if (x === 0) gctx.moveTo(x, yy); else gctx.lineTo(x, yy);
      }
      gctx.stroke();
    }
    // great red spot
    const rsg = gctx.createRadialGradient(180,128,0,180,128,34);
    rsg.addColorStop(0,"rgba(170,55,28,0.48)"); rsg.addColorStop(0.45,"rgba(150,45,22,0.30)"); rsg.addColorStop(1,"rgba(0,0,0,0)");
    gctx.fillStyle=rsg; gctx.beginPath(); gctx.ellipse(180,128,36,22,0.08,0,Math.PI*2); gctx.fill();
    // atmospheric swirl lines
    gctx.strokeStyle="rgba(255,220,160,0.12)"; gctx.lineWidth=1.2;
    for (let i=0;i<6;i++) {
      const y=40+i*38; gctx.beginPath(); gctx.moveTo(0,y);
      for (let x=0;x<=512;x+=16) gctx.lineTo(x, y+Math.sin(x*0.04+i)*4);
      gctx.stroke();
    }
    const gasTex = new THREE.CanvasTexture(gasC);
    gasTex.colorSpace = THREE.SRGBColorSpace;
    const gasGiant = new THREE.Mesh(
      new THREE.SphereGeometry(10, 64, 64),
      new THREE.MeshPhongMaterial({ map:gasTex, specular:new THREE.Color(0x2a1a0a), shininess:8, emissive:new THREE.Color(0x080401), emissiveIntensity:0.04 })
    );
    gasGiant.position.set(42, -18, -184); scene.add(gasGiant);
    const gasAtmo = new THREE.Mesh(
      new THREE.SphereGeometry(12, 32, 32),
      new THREE.MeshBasicMaterial({ color:0xffc078, transparent:true, opacity:0.025, side:THREE.BackSide, blending:THREE.AdditiveBlending, depthWrite:false })
    );
    gasAtmo.position.copy(gasGiant.position); scene.add(gasAtmo);

    // ── SATURN ─────────────────────────────────────────────────────────
    const saturnGroup = new THREE.Group();
    saturnGroup.position.set(-36, 20, -214);
    const satC    = document.createElement("canvas");
    satC.width    = 256; satC.height = 128;
    const sctx2   = satC.getContext("2d")!;
    const satGrad = sctx2.createLinearGradient(0,0,0,128);
    satGrad.addColorStop(0,   "#51412f"); satGrad.addColorStop(0.3, "#b89b68");
    satGrad.addColorStop(0.5, "#d7c18e"); satGrad.addColorStop(0.7, "#a98d5c");
    satGrad.addColorStop(1,   "#4a3a2b");
    sctx2.fillStyle=satGrad; sctx2.fillRect(0,0,256,128);
    for (let i=0;i<9;i++) {
      const y = 8 + i * 13 + Math.random() * 4;
      sctx2.fillStyle = i % 3 === 0
        ? `rgba(92,72,42,${0.20 + Math.random()*0.12})`
        : `rgba(${210 + Math.random()*30},${185 + Math.random()*25},${126 + Math.random()*20},${0.12 + Math.random()*0.10})`;
      sctx2.fillRect(0, y, 256, 4 + Math.random() * 5);
    }
    for (let i = 0; i < 10; i++) {
      const y = 10 + i * 12;
      sctx2.strokeStyle = `rgba(255,235,180,${0.06 + Math.random()*0.06})`;
      sctx2.lineWidth = 0.7 + Math.random() * 1.2;
      sctx2.beginPath();
      for (let x = 0; x <= 256; x += 10) {
        const yy = y + Math.sin(x * 0.055 + i * 0.7) * 1.2;
        if (x === 0) sctx2.moveTo(x, yy); else sctx2.lineTo(x, yy);
      }
      sctx2.stroke();
    }
    const satTex    = new THREE.CanvasTexture(satC);
    satTex.colorSpace = THREE.SRGBColorSpace;
    const satPlanet = new THREE.Mesh(
      new THREE.SphereGeometry(7, 48, 48),
      new THREE.MeshPhongMaterial({ map:satTex, specular:new THREE.Color(0x1d160d), shininess:10 })
    );
    saturnGroup.add(satPlanet);

    // Rings — multiple bands for natural layered look
    const addRing = (inner: number, outer: number, color: number, opacity: number) => {
      const r = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 128),
        new THREE.MeshBasicMaterial({ color, side:THREE.DoubleSide, transparent:true, opacity, depthWrite:false })
      );
      r.rotation.x = Math.PI * 0.40;
      saturnGroup.add(r);
    };
    addRing(9.5,  11.2, 0xd6c08a, 0.12);   // inner faint ring
    addRing(11.2, 13.0, 0xf0d79a, 0.24);   // main bright ring
    addRing(13.0, 13.5, 0x201810, 0.10);   // Cassini division
    addRing(13.5, 16.2, 0xc8a860, 0.16);   // outer ring
    addRing(16.2, 18.8, 0x9a7a3c, 0.08);   // faint outer fringe

    scene.add(saturnGroup);

    // ── EARTH ──────────────────────────────────────────────────────────
    const EARTH_Z = -280;

    const ec   = document.createElement("canvas");
    ec.width   = 1024; ec.height = 512;
    const ectx = ec.getContext("2d")!;

    // Natural ocean base with subtle latitude depth variation
    const ocean = ectx.createLinearGradient(0, 0, 0, 512);
    ocean.addColorStop(0,   "#061a35");
    ocean.addColorStop(0.18, "#07305c");
    ocean.addColorStop(0.36, "#075b96");
    ocean.addColorStop(0.50, "#0b6fac");
    ocean.addColorStop(0.64, "#075b96");
    ocean.addColorStop(0.82, "#07305c");
    ocean.addColorStop(1,   "#061a35");
    ectx.fillStyle = ocean;
    ectx.fillRect(0, 0, 1024, 512);

    // Soft ocean micro-currents
    for (let i = 0; i < 34; i++) {
      const y = 20 + Math.random() * 470;
      ectx.strokeStyle = `rgba(${80 + Math.random()*60},${160 + Math.random()*70},${220 + Math.random()*25},${0.035 + Math.random()*0.055})`;
      ectx.lineWidth = 1 + Math.random() * 3;
      ectx.beginPath();
      for (let x = 0; x <= 1024; x += 18) {
        const yy = y + Math.sin(x * 0.025 + i * 0.7) * 8 + Math.sin(x * 0.009 + i) * 5;
        if (x === 0) ectx.moveTo(x, yy); else ectx.lineTo(x, yy);
      }
      ectx.stroke();
    }

    // Organic continent shapes instead of simple ellipses
    const continents = [
      { cx: 230, cy: 170, rx: 112, ry: 92, rot: -0.28, base: "#2d7a35", light: "#5fa85a", dark: "#17451f" },
      { cx: 315, cy: 306, rx: 62,  ry: 108, rot:  0.22, base: "#3b7d2e", light: "#72a95b", dark: "#214b20" },
      { cx: 510, cy: 154, rx: 88,  ry: 70,  rot: -0.16, base: "#5a7f2e", light: "#86a85b", dark: "#31551f" },
      { cx: 535, cy: 284, rx: 78,  ry: 126, rot:  0.12, base: "#2f7130", light: "#6ca45c", dark: "#1f4b24" },
      { cx: 704, cy: 142, rx: 190, ry: 98,  rot: -0.06, base: "#3f7b33", light: "#84a961", dark: "#244c20" },
      { cx: 800, cy: 338, rx: 82,  ry: 58,  rot:  0.18, base: "#6f7d32", light: "#9aa15f", dark: "#45551f" },
      { cx: 880, cy: 230, rx: 62,  ry: 52,  rot:  0.40, base: "#4f8a3b", light: "#7fa961", dark: "#244d22" },
    ];

    continents.forEach((l, idx) => {
      drawOrganicBlob(ectx, l.cx, l.cy, l.rx, l.ry, l.rot, l.dark, 26, 0.14);
      drawOrganicBlob(ectx, l.cx + 18, l.cy - 8, l.rx * 0.74, l.ry * 0.62, l.rot + 0.12, l.base, 24, 0.18);
      drawOrganicBlob(ectx, l.cx - 20, l.cy + 12, l.rx * 0.48, l.ry * 0.42, l.rot - 0.18, l.light, 20, 0.22);

      // Natural coast highlight / shadow
      ectx.save();
      ectx.translate(l.cx, l.cy);
      ectx.rotate(l.rot);
      ectx.scale(1.03, 0.97);
      ectx.beginPath();
      ectx.ellipse(0, 0, l.rx, l.ry, 0, 0, Math.PI * 2);
      ectx.strokeStyle = "rgba(218,235,190,0.08)";
      ectx.lineWidth = 2;
      ectx.stroke();
      ectx.restore();

      // Smaller inland texture patches
      for (let k = 0; k < 7 + idx; k++) {
        const px = l.cx + (Math.random() - 0.5) * l.rx * 1.35;
        const py = l.cy + (Math.random() - 0.5) * l.ry * 1.2;
        const prx = 10 + Math.random() * l.rx * 0.22;
        const pry = 5 + Math.random() * l.ry * 0.16;
        drawOrganicBlob(
          ectx,
          px,
          py,
          prx,
          pry,
          Math.random() * Math.PI,
          Math.random() > 0.45 ? "rgba(32,91,38,0.34)" : "rgba(156,176,86,0.22)",
          18,
          0.20
        );
      }
    });

    // Desert / savanna warmth on larger land masses
    drawOrganicBlob(ectx, 720, 162, 96, 38, -0.18, "rgba(160,132,62,0.34)", 24, 0.18);
    drawOrganicBlob(ectx, 790, 330, 64, 30, 0.18, "rgba(178,145,70,0.30)", 22, 0.20);
    drawOrganicBlob(ectx, 540, 310, 42, 72, 0.08, "rgba(154,126,58,0.22)", 20, 0.22);

    // Polar ice with irregular natural edge
    drawIrregularCap(ectx, 1024, 0, 58, 1);
    drawIrregularCap(ectx, 1024, 454, 58, -1);

    addFineNoise(ectx, 1024, 512, 360, 0.025);
    const earthTex = new THREE.CanvasTexture(ec);
    earthTex.colorSpace = THREE.SRGBColorSpace;

    const ccanv = document.createElement("canvas");
    ccanv.width = 1024; ccanv.height = 512;
    const cctx  = ccanv.getContext("2d")!;
    cctx.clearRect(0,0,1024,512);

    // Large weather systems
    const cloudBands = [
      { x: 120, y: 122, rx: 170, ry: 34, rot: -0.10, a: 0.34 },
      { x: 350, y: 238, rx: 210, ry: 42, rot:  0.08, a: 0.28 },
      { x: 620, y: 168, rx: 190, ry: 38, rot: -0.04, a: 0.30 },
      { x: 810, y: 302, rx: 160, ry: 34, rot:  0.16, a: 0.24 },
    ];
    cloudBands.forEach((b) => {
      addSoftBlob(cctx, b.x, b.y, b.rx, b.ry, b.rot, "rgba(255,255,255,ALPHA)", b.a);
    });

    // Swirling cloud wisps and storm cells
    for (let i = 0; i < 72; i++) {
      const x = Math.random() * 1024;
      const y = 45 + Math.random() * 420;
      const r = 16 + Math.random() * 54;
      addSoftBlob(
        cctx,
        x,
        y,
        r * (1.4 + Math.random() * 1.8),
        r * (0.35 + Math.random() * 0.42),
        Math.random() * Math.PI,
        `rgba(255,255,255,ALPHA)`,
        0.08 + Math.random() * 0.18
      );
    }

    // Fine cloud grain
    addFineNoise(cctx, 1024, 512, 260, 0.035);
    const cloudTex = new THREE.CanvasTexture(ccanv);
    cloudTex.colorSpace = THREE.SRGBColorSpace;

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(14, 64, 64),
      new THREE.MeshPhongMaterial({ map:earthTex, specular:new THREE.Color(0x102038), shininess:16, emissive:new THREE.Color(0x001533), emissiveIntensity:0.16 })
    );
    earth.position.set(0,-4,EARTH_Z); scene.add(earth);

    const cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(14.52, 64, 64),
      new THREE.MeshBasicMaterial({ map:cloudTex, transparent:true, opacity:0.42, depthWrite:false })
    );
    cloudMesh.position.copy(earth.position); scene.add(cloudMesh);

    // Multi-layer atmosphere — last layer is thicker so it glows when camera is inside
    const atmoLayers: THREE.Mesh[] = [];
    ([
      [15.9, 0x1a7fff, 0.17, THREE.BackSide],
      [18.0, 0x60a5fa, 0.07, THREE.BackSide],
      [22.0, 0x93c5fd, 0.03, THREE.BackSide],
      [30.0, 0x7dd3fc, 0.02, THREE.BackSide],
    ] as [number, number, number, THREE.Side][]).forEach(([r,c,op,side]) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 32),
        new THREE.MeshBasicMaterial({ color:c, transparent:true, opacity:op, side, blending:THREE.AdditiveBlending, depthWrite:false })
      );
      m.position.copy(earth.position); scene.add(m); atmoLayers.push(m);
    });

    // ── Render loop ────────────────────────────────────────────────────
    const getP = () => clamp(window.scrollY / ((SPACE_INTRO_VH/100)*window.innerHeight), 0, 1);

    let animId = 0, T = 0;
    let smoothP = getP();
    let lastFrame = performance.now();
    let prevPhase: number | null = -1;
    let prevOverlay = "";
    let prevInIntro = true;
    let prevHint    = true;

    function tick(now = performance.now()) {
      animId = requestAnimationFrame(tick);
      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      T += dt;

      // Smooth stepped wheel and touchpad input consistently at any frame rate.
      const targetP = getP();
      smoothP = lerp(smoothP, targetP, 1 - Math.exp(-dt * 10));
      if (Math.abs(targetP - smoothP) < 0.0001) smoothP = targetP;
      const p = smoothP;

      // ── Camera ──────────────────────────────────────────────────────
      const [cx, cy, cz] = wpPos(p);
      const idleFade = 1 - ss(0.02, 0.20, p);
      camera.position.set(
        cx + Math.sin(T * 0.25) * 2.5 * idleFade,
        cy + Math.sin(T * 0.18) * 1.5 * idleFade,
        cz
      );

      if (p < 0.65) {
        const earthFocus = ss(0.38, 0.68, p);
        camera.lookAt(
          lerp(cx, 0, earthFocus),
          lerp(cy, earth.position.y, earthFocus),
          lerp(cz - 60, EARTH_Z, earthFocus)
        );
      } else {
        camera.lookAt(0, earth.position.y, EARTH_Z);
      }

      // Boost inner atmosphere opacity as camera enters Earth
      const insideT = clamp((p - 0.87) / 0.05, 0, 1);
      (atmoLayers[3].material as THREE.MeshBasicMaterial).opacity = 0.02 + insideT * 0.18;

      // ── Rotations ───────────────────────────────────────────────────
      star1.rotation.y = T*0.016; star1.rotation.x = T*0.007;
      star2.rotation.y = -T*0.011;
      star3.rotation.y = T*0.021;
      earth.rotation.y       = T*0.11;
      cloudMesh.rotation.y   = T*0.135;
      mars.rotation.y        = T*0.095;
      gasGiant.rotation.y    = T*0.145;
      saturnGroup.rotation.y = T*0.065;
      nebulae.slice(0,6).forEach((n,i) => {
        n.rotation.y = T*(0.008+i*0.003);
        n.rotation.z = T*(0.005+i*0.002);
      });

      if (p < 1.01) renderer.render(scene, camera);

      // ── React state (throttled) ──────────────────────────────────────
      let nextPhase: number | null = null;
      for (const tp of TEXT_PHASES) {
        if (p >= tp.sp && p <= tp.ep) { nextPhase = tp.id; break; }
      }
      if (nextPhase !== prevPhase) { prevPhase = nextPhase; setPhase(nextPhase); }

      // Direct DOM update for overlay — avoids React re-render every frame
      const nextOverlay = overlayForP(p);
      if (nextOverlay !== prevOverlay) {
        prevOverlay = nextOverlay;
        if (overlayRef.current) overlayRef.current.style.backgroundColor = nextOverlay;
      }

      const nextInIntro = p < 0.995;
      if (nextInIntro !== prevInIntro) { prevInIntro = nextInIntro; setInIntro(nextInIntro); }

      const nextHint = p < 0.025;
      if (nextHint !== prevHint) { prevHint = nextHint; setShowHint(nextHint); }
    }

    tick();

    function onScrollFast() {
      const p = clamp(window.scrollY / ((SPACE_INTRO_VH/100)*window.innerHeight), 0, 1);
      if (p >= 0.995 && prevInIntro)  { prevInIntro = false; setInIntro(false); }
      if (p  < 0.995 && !prevInIntro) { prevInIntro = true;  setInIntro(true); }
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
      [star1,star2,star3,dust1,dust2].forEach(pt => {
        pt.geometry.dispose(); (pt.material as THREE.Material).dispose();
      });
      nebulae.forEach(n => { n.geometry.dispose(); (n.material as THREE.Material).dispose(); });
      [earth, cloudMesh, mars, marsAtmo, gasGiant, gasAtmo, satPlanet].forEach(m => {
        m.geometry.dispose(); (m.material as THREE.Material).dispose();
      });
      atmoLayers.forEach(m => { m.geometry.dispose(); (m.material as THREE.Material).dispose(); });
      [earthTex, cloudTex, starSprite, marsTex, gasTex, satTex].forEach(t => t.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  const activePhase = TEXT_PHASES.find(tp => tp.id === phase);

  return (
    <div style={{ height: `${SPACE_INTRO_VH}vh` }}>
      <div style={{ display: inIntro ? "block" : "none" }}>

        {/* Three.js canvas */}
        <div ref={mountRef} style={{ position:"fixed", inset:0, zIndex:50, pointerEvents:"none" }} />

        {/* Text overlays */}
        <div style={{
          position:"fixed", inset:0, zIndex:51, pointerEvents:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <AnimatePresence mode="wait">
            {activePhase && (
              <motion.div
                key={activePhase.id}
                initial={{ opacity:0, y:44, scale:0.96 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:-18, scale:1.01, transition:{ duration:0.38, ease:"easeIn" } }}
                transition={{ duration:0.95, ease:[0.22,1,0.36,1] }}
                style={{ textAlign:"center", padding:"0 32px", maxWidth:"900px" }}
              >
                <div style={{
                  fontSize:"clamp(2.4rem, 6.5vw, 8rem)",
                  fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.05,
                  fontFamily:"var(--font-playfair), var(--font-jakarta), serif",
                  background: activePhase.id <= 3
                    ? "linear-gradient(160deg, #FFF8E8 0%, rgba(240,220,160,0.90) 100%)"
                    : "linear-gradient(160deg, #F5DFA0 0%, #E8C86A 45%, #FFF8E8 85%)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
                  filter:"drop-shadow(0 2px 28px rgba(0,0,0,0.7))",
                }}>
                  {activePhase.text}
                </div>
                {activePhase.sub && (
                  <motion.div
                    initial={{ opacity:0, y:10 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ delay:0.45, duration:0.7 }}
                    style={{
                      marginTop:"18px",
                      fontSize:"clamp(0.75rem, 1.6vw, 1.25rem)",
                      color:"rgba(240,218,150,0.78)", fontWeight:400,
                      letterSpacing:"0.28em", textTransform:"uppercase",
                      fontFamily:"var(--font-inter)", textShadow:"0 2px 20px rgba(0,0,0,0.9)",
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
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                exit={{ opacity:0, transition:{ duration:0.8 } }}
                transition={{ duration:1.4, delay:2.0 }}
                style={{
                  position:"absolute", bottom:"52px",
                  left:"50%", transform:"translateX(-50%)",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:"10px",
                }}
              >
                <motion.div
                  animate={{ y:[0,10,0] }}
                  transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
                  style={{ color:"rgba(255,255,255,0.26)" }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                <span style={{
                  fontSize:"9px", letterSpacing:"0.30em", color:"rgba(255,255,255,0.18)",
                  textTransform:"uppercase", fontFamily:"var(--font-inter)", fontWeight:500,
                }}>
                  scroll to begin
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Atmosphere overlay — updated via direct DOM ref to avoid per-frame re-renders */}
        <div ref={overlayRef} style={{
          position:"fixed", inset:0, zIndex:52,
          backgroundColor:"rgba(0,0,0,0)",
          pointerEvents:"none",
        }} />

      </div>
    </div>
  );
}
