"use client";

import Image from "next/image";

const NAV_LINKS = [
  { label: "Vision", href: "#vision" },
  { label: "Technology", href: "#companion" },
  { label: "Features", href: "#features" },
  { label: "Future", href: "#future" },
  { label: "Contact", href: "#contact" },
];

const LEGAL = ["Privacy Policy", "Terms of Service", "Cookie Policy"];

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.733-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

const SOCIAL = [
  { label: "X (Twitter)", href: "#", Icon: XIcon },
  { label: "LinkedIn", href: "#", Icon: LinkedInIcon },
  { label: "Instagram", href: "#", Icon: InstagramIcon },
];

export default function Footer() {
  return (
    <footer style={{ background: "#1A1610", position: "relative", overflow: "hidden" }}>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "56px 24px 40px" }}>

        {/* Top row */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr auto", gap: "48px", alignItems: "start", marginBottom: "48px" }}>

          {/* Brand column */}
          <div>
            {/* Logo */}
            <div style={{ marginBottom: "14px" }}>
              <Image
                src="/NoorvaLogo.png"
                alt="Noorva"
                width={120}
                height={36}
                style={{ objectFit: "contain", height: "36px", width: "auto" }}
              />
            </div>

            <p style={{ fontSize: "13px", color: "#6A5E48", lineHeight: "1.7", maxWidth: "210px", marginBottom: "20px" }}>
              The future of Human-AI Companionship. A guide, mentor and companion that grows with you.
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", gap: "10px" }}>
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{ width: "34px", height: "34px", borderRadius: "9px", background: "#1A1610", border: "1px solid rgba(17,24,39,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6A5E48", textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = "rgba(201,168,56,0.08)"; el.style.color = "#D4853A"; el.style.borderColor = "rgba(201,168,56,0.22)"; el.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = "#1A1610"; el.style.color = "#6A5E48"; el.style.borderColor = "rgba(17,24,39,0.08)"; el.style.transform = ""; }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Nav links — 2 columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6A5E48", marginBottom: "16px" }}>Product</div>
              <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{ fontSize: "13px", fontWeight: 500, color: "#8A7B5C", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#F5EDD6")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#8A7B5C")}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6A5E48", marginBottom: "16px" }}>Company</div>
              <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {["About", "Blog", "Careers", "Press Kit"].map((l) => (
                  <a
                    key={l}
                    href="#"
                    style={{ fontSize: "13px", fontWeight: 500, color: "#8A7B5C", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#F5EDD6")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#8A7B5C")}
                  >
                    {l}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Status + CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-end" }}>
            {/* Status badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 16px", background: "rgba(34,197,94,0.07)", borderRadius: "3px", border: "1px solid rgba(34,197,94,0.18)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", animation: "glowPulse 2s infinite" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#22C55E", letterSpacing: "0.04em" }}>All systems go</span>
            </div>

            {/* Mini CTA */}
            <button
              className="btn-primary"
              onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
              style={{ padding: "11px 22px", fontSize: "13px" }}
            >
              Get Early Access
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>


        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <p style={{ fontSize: "12px", color: "#6A5E48" }}>
            © 2026 Noorva, Inc. All rights reserved. · Human Interactive AI · Built for the Future.
          </p>
          <div style={{ display: "flex", gap: "20px" }}>
            {LEGAL.map((l) => (
              <a
                key={l}
                href="#"
                style={{ fontSize: "12px", color: "#6A5E48", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#8A7B5C")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6A5E48")}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
