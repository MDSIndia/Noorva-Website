"use client";

// The phone's screen, painted onto a 2D canvas and used as the screen texture —
// a real app screen on the 3D glass instead of a DOM overlay that can't follow
// the phone's rotation. "chat" is the Companion chat (same copy as
// CompanionScreen.tsx); "video" is the Noorva Video feed (same copy as
// VideoScreen.tsx).

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { roundedRectShape } from "./geometry";

const MESSAGES = [
  { from: "noorva", text: "Morning. You've got the Kessler review at 2 — want a quick recap first?" },
  { from: "user", text: "yes please" },
  { from: "noorva", text: "Three open items, all yours. I'll remind you at 1:45." },
] as const;

const FONT = "Outfit, system-ui, -apple-system, sans-serif";

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

const VIDEOS = [
  { title: "Why sourdough actually works", source: "Bakehouse Journal", duration: "6:12", verified: true },
  { title: "Kubernetes in 90 seconds", source: "devnotes", duration: "1:30", verified: true },
  { title: "A quieter kind of morning routine", source: "Mara Lin", duration: "4:47", verified: false },
] as const;

function drawVideo(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#080b1a");
  bg.addColorStop(1, "#02030a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const bloom = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.3, W * 0.9);
  bloom.addColorStop(0, "rgba(0, 85, 255, 0.18)");
  bloom.addColorStop(1, "rgba(0, 85, 255, 0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);

  const padX = W * 0.07;
  const headerY = H * 0.115;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = `500 ${W * 0.042}px ${FONT}`;
  ctx.fillText("9:41", padX, headerY);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${W * 0.045}px ${FONT}`;
  ctx.textAlign = "center";
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${W * 0.007}px`;
  ctx.fillText("FOR YOU", W / 2, headerY);
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";

  const cardH = H * 0.1;
  const thumbW = W * 0.34;
  let y = H * 0.19;
  for (const v of VIDEOS) {
    // thumbnail
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    roundRect(ctx, padX, y, thumbW, cardH, W * 0.035);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = W * 0.003;
    ctx.stroke();
    // play glyph
    const px = padX + thumbW / 2;
    const py = y + cardH / 2;
    const ps = cardH * 0.17;
    const pg = ctx.createLinearGradient(px - ps, py - ps, px + ps, py + ps);
    pg.addColorStop(0, "#0055ff");
    pg.addColorStop(1, "#00d4ff");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(px - ps * 0.7, py - ps);
    ctx.lineTo(px + ps * 1.1, py);
    ctx.lineTo(px - ps * 0.7, py + ps);
    ctx.closePath();
    ctx.fill();
    // duration chip
    ctx.font = `500 ${W * 0.028}px ${FONT}`;
    const dw = ctx.measureText(v.duration).width + W * 0.025;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    roundRect(ctx, padX + thumbW - dw - W * 0.012, y + cardH - W * 0.05, dw, W * 0.04, W * 0.01);
    ctx.fill();
    ctx.fillStyle = "#05060d";
    ctx.textAlign = "center";
    ctx.fillText(v.duration, padX + thumbW - dw / 2 - W * 0.012, y + cardH - W * 0.03);
    // text
    ctx.textAlign = "left";
    const tx = padX + thumbW + W * 0.04;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = `500 ${W * 0.043}px ${FONT}`;
    const maxW = W - padX - tx;
    const lines = wrapLines(ctx, v.title, maxW).slice(0, 2);
    lines.forEach((l, i) => ctx.fillText(l, tx, y + cardH * 0.28 + i * W * 0.056));
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `400 ${W * 0.034}px ${FONT}`;
    const sy = y + cardH * 0.28 + lines.length * W * 0.056 + W * 0.012;
    ctx.fillText(v.source, tx, sy);
    if (v.verified) {
      const w = ctx.measureText(v.source).width;
      ctx.fillStyle = "#00d4ff";
      ctx.beginPath();
      ctx.arc(tx + w + W * 0.03, sy, W * 0.014, 0, Math.PI * 2);
      ctx.fill();
    }
    y += cardH + W * 0.05;
  }
}

function drawChat(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#080b1a");
  bg.addColorStop(1, "#02030a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft accent bloom behind the conversation.
  const bloom = ctx.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.35, W * 0.9);
  bloom.addColorStop(0, "rgba(0, 85, 255, 0.18)");
  bloom.addColorStop(1, "rgba(0, 85, 255, 0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);

  // Header — clock left, wordmark centered, below the Dynamic Island.
  const padX = W * 0.07;
  const headerY = H * 0.115;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = `500 ${W * 0.042}px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("9:41", padX, headerY);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${W * 0.045}px ${FONT}`;
  ctx.textAlign = "center";
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${W * 0.007}px`;
  ctx.fillText("NOORVA", W / 2, headerY);
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";

  // Messages.
  const fontPx = W * 0.05;
  const lineH = fontPx * 1.38;
  const bubblePadX = W * 0.05;
  const bubblePadY = W * 0.04;
  const maxBubbleW = W * 0.74;
  ctx.font = `400 ${fontPx}px ${FONT}`;
  ctx.textAlign = "left";

  let y = H * 0.18;
  for (const m of MESSAGES) {
    const lines = wrapLines(ctx, m.text, maxBubbleW - bubblePadX * 2);
    const textW = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const bw = textW + bubblePadX * 2;
    const bh = lines.length * lineH + bubblePadY * 2 - (lineH - fontPx);
    const isUser = m.from === "user";
    const bx = isUser ? W - padX - bw : padX;
    const r = W * 0.06;

    if (isUser) {
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
    }
    roundRect(ctx, bx, y, bw, bh, r);
    ctx.fill();
    if (!isUser) {
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = W * 0.003;
      ctx.stroke();
    }

    ctx.fillStyle = isUser ? "#05060d" : "rgba(255,255,255,0.92)";
    lines.forEach((l, i) => ctx.fillText(l, bx + bubblePadX, y + bubblePadY + fontPx * 0.5 + i * lineH));
    y += bh + W * 0.045;
  }

  // Input bar + mic button.
  const barH = H * 0.052;
  const barY = H - H * 0.075 - barH;
  const micR = barH * 0.62;
  const micCx = W - padX - micR;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = W * 0.003;
  ctx.beginPath();
  ctx.moveTo(0, barY - H * 0.022);
  ctx.lineTo(W, barY - H * 0.022);
  ctx.stroke();

  const barW = micCx - micR - W * 0.035 - padX;
  roundRect(ctx, padX, barY, barW, barH, barH / 2);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = `400 ${W * 0.038}px ${FONT}`;
  ctx.fillText("Ask Noorva anything…", padX + W * 0.05, barY + barH / 2);

  const micGrad = ctx.createLinearGradient(micCx - micR, barY, micCx + micR, barY + barH);
  micGrad.addColorStop(0, "#0055ff");
  micGrad.addColorStop(1, "#00d4ff");
  ctx.fillStyle = micGrad;
  ctx.beginPath();
  ctx.arc(micCx, barY + barH / 2, micR, 0, Math.PI * 2);
  ctx.fill();

  // Mic glyph.
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = W * 0.008;
  ctx.lineCap = "round";
  const cx = micCx;
  const cy = barY + barH / 2;
  const mw = micR * 0.34;
  const mh = micR * 0.7;
  roundRect(ctx, cx - mw, cy - mh * 0.75, mw * 2, mh, mw);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy - mh * 0.05, mw * 1.7, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + mh * 0.5);
  ctx.lineTo(cx, cy + mh * 0.8);
  ctx.stroke();
}

interface ChatScreenProps {
  variant?: "chat" | "video";
  z: number;
  width: number;
  height: number;
  radius: number;
}

export default function ChatScreen({ variant = "chat", z, width, height, radius }: ChatScreenProps) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let made: THREE.CanvasTexture | null = null;

    const build = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = Math.round(720 * (height / width));
      (variant === "video" ? drawVideo : drawChat)(canvas);
      made = new THREE.CanvasTexture(canvas);
      made.colorSpace = THREE.SRGBColorSpace;
      made.anisotropy = 8;
      setTexture(made);
    };

    // Wait for the site font so the canvas doesn't bake in the fallback face.
    if (document.fonts?.ready) document.fonts.ready.then(build, build);
    else build();

    return () => {
      cancelled = true;
      made?.dispose();
    };
  }, [width, height, variant]);

  const geometry = useMemo(() => {
    const geo = new THREE.ShapeGeometry(roundedRectShape(width, height, radius), 24);
    // ShapeGeometry UVs are raw local x/y, not normalized — remap to 0..1
    // across the shape's bounding box (see the same fix in the original
    // ScreenContent.tsx).
    const uv = geo.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) + width / 2) / width, (uv.getY(i) + height / 2) / height);
    }
    uv.needsUpdate = true;
    return geo;
  }, [width, height, radius]);

  if (!texture) return null;

  return (
    <mesh geometry={geometry} position={[0, 0, z]}>
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
