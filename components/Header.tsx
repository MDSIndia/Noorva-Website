"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { lenisRef } from "./store";

// Two kinds of nav item: "anchor" only makes sense while already on "/" (it
// scrolls via Lenis to an in-page section); "route" is a real Next.js page.
// Anchor items clicked from another route first navigate home, then the
// homepage itself (app/page.tsx) picks up `?scrollTo=` on mount and finishes
// the Lenis scroll — see the matching effect there.
const NAV_ITEMS = [
  { label: "Home", type: "anchor", target: "home" },
  { label: "Companion", type: "route", target: "/products/companion" },
  { label: "Products", type: "route", target: "/products" },
  { label: "Ecosystem", type: "route", target: "/ecosystem" },
  { label: "Technology", type: "route", target: "/technology" },
  { label: "About", type: "route", target: "/about" },
  { label: "FAQ", type: "route", target: "/faq" },
  { label: "Contact", type: "route", target: "/contact" },
] as const;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function goTo(target: string) {
    if (pathname !== "/") {
      router.push(`/?scrollTo=${encodeURIComponent(target)}`);
      return;
    }
    if (target === "home") {
      lenisRef.current?.scrollTo(0, { duration: 1.2 });
      return;
    }
    lenisRef.current?.scrollTo(target, { duration: 1.2 });
  }

  function handleAnchorClick(target: string) {
    goTo(target);
    setMobileOpen(false);
  }

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 border-b transition-all duration-300"
        style={{
          borderColor: scrolled ? "var(--line)" : "transparent",
          background: scrolled ? "rgba(2, 2, 8, 0.55)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(150%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(150%)" : "none",
          boxShadow: scrolled ? "0 8px 24px -18px var(--shadow-accent)" : "none",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <button type="button" onClick={() => goTo("home")} className="flex items-center gap-2.5">
            <Image src="/NoorvaLogo.png" alt="" width={28} height={28} className="h-7 w-7" />
            <span className="font-display text-lg tracking-tight text-[color:var(--ink)]">Noorva</span>
          </button>

          <nav className="hidden items-center gap-5 xl:flex">
            {NAV_ITEMS.map((item) => {
              const active = item.type === "route" && pathname === item.target;
              const linkClass = `link-underline pb-0.5 text-[11px] tracking-[0.18em] text-[color:var(--ink)] uppercase transition-opacity duration-300 hover:opacity-70 ${
                active ? "font-semibold [background-size:100%_1px]" : "font-medium"
              }`;
              return item.type === "route" ? (
                <Link key={item.label} href={item.target} className={linkClass}>
                  {item.label}
                </Link>
              ) : (
                <button key={item.label} onClick={() => handleAnchorClick(item.target)} className={linkClass}>
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex h-8 w-8 items-center justify-center text-[color:var(--ink)] xl:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-0 top-[72px] z-40 glass-strong !border-x-0 !border-t-0 xl:hidden"
          >
            <div className="flex flex-col px-6 py-4">
              {NAV_ITEMS.map((item) =>
                item.type === "route" ? (
                  <Link
                    key={item.label}
                    href={item.target}
                    onClick={() => setMobileOpen(false)}
                    className="border-b border-[color:var(--line)] py-4 text-sm font-medium tracking-[0.1em] text-[color:var(--ink)] uppercase last:border-b-0"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    onClick={() => handleAnchorClick(item.target)}
                    className="border-b border-[color:var(--line)] py-4 text-left text-sm font-medium tracking-[0.1em] text-[color:var(--ink)] uppercase"
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
