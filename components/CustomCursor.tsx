"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
    };

    let af: number;
    const followRing = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.1;
      ring.current.y += (pos.current.y - ring.current.y) * 0.1;
      if (ringRef.current) {
        ringRef.current.style.left = `${ring.current.x}px`;
        ringRef.current.style.top = `${ring.current.y}px`;
      }
      af = requestAnimationFrame(followRing);
    };

    window.addEventListener("mousemove", onMove);
    af = requestAnimationFrame(followRing);

    const enterHover = () => {
      if (ringRef.current) {
        ringRef.current.style.transform = "translate(-50%, -50%) scale(1.8)";
        ringRef.current.style.borderColor = "rgba(77,124,255,0.7)";
      }
    };
    const leaveHover = () => {
      if (ringRef.current) {
        ringRef.current.style.transform = "translate(-50%, -50%) scale(1)";
        ringRef.current.style.borderColor = "rgba(77,124,255,0.4)";
      }
    };

    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", enterHover);
      el.addEventListener("mouseleave", leaveHover);
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(af);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="cursor-dot hidden md:block"
        style={{ position: "fixed", pointerEvents: "none", zIndex: 9999, transform: "translate(-50%, -50%)" }}
      />
      <div
        ref={ringRef}
        className="cursor-ring hidden md:block"
        style={{ position: "fixed", pointerEvents: "none", zIndex: 9998, transform: "translate(-50%, -50%)", transition: "transform 0.3s, border-color 0.3s" }}
      />
    </>
  );
}
