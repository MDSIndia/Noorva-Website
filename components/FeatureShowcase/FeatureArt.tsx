"use client";

// Static, on-brand illustrations standing in for the old flying-phone mockup —
// one abstract vector scene per feature, each themed to its accent color.

// Server/client Math.sin/cos can differ in their last float digit across
// environments — rounding before it hits a JSX attribute keeps SSR and
// hydration output byte-identical instead of triggering a mismatch warning.
const r2 = (n: number) => Math.round(n * 100) / 100;

function ArtPanel({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
      <div
        className="pointer-events-none absolute inset-0 opacity-50 blur-[60px]"
        style={{ background: `radial-gradient(circle at 50% 42%, ${accent}, transparent 70%)` }}
      />
      <div className="pointer-events-none absolute inset-0 vignette-edge" />
      <div className="relative flex h-full w-full items-center justify-center p-8">{children}</div>
    </div>
  );
}

export function GuideArt() {
  return (
    <ArtPanel accent="var(--accent-2)">
      <svg viewBox="0 0 200 200" className="h-[68%] w-[68%]" fill="none">
        <circle cx="100" cy="100" r="70" stroke="var(--accent-2)" strokeOpacity="0.35" />
        <circle cx="100" cy="100" r="52" stroke="var(--accent-2)" strokeOpacity="0.55" strokeDasharray="2 7" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={r2(100 + Math.cos(a) * 70)}
              y1={r2(100 + Math.sin(a) * 70)}
              x2={r2(100 + Math.cos(a) * 63)}
              y2={r2(100 + Math.sin(a) * 63)}
              stroke="white"
              strokeOpacity="0.25"
            />
          );
        })}
        <g transform="rotate(35 100 100)">
          <polygon points="100,44 107,100 100,110 93,100" fill="var(--accent-2)" fillOpacity="0.9" />
          <polygon points="100,156 107,100 100,90 93,100" fill="white" fillOpacity="0.25" />
        </g>
        <circle cx="100" cy="100" r="6" fill="white" fillOpacity="0.85" />
        <path
          d="M38 166 C 70 150, 58 118, 90 108 S 138 70, 150 38"
          stroke="var(--accent-2)"
          strokeOpacity="0.5"
          strokeWidth="1.5"
          strokeDasharray="1 7"
          strokeLinecap="round"
        />
        <path
          d="M150 30 l2.4 6.6 L159 39 l-6.6 2.4 L150 48 l-2.4-6.6L141 39l6.6-2.4Z"
          fill="var(--accent-2)"
        />
      </svg>
    </ArtPanel>
  );
}

export function MentorArt() {
  return (
    <ArtPanel accent="var(--accent-1)">
      <svg viewBox="0 0 200 200" className="h-[68%] w-[68%]" fill="none">
        <rect x="28" y="54" width="112" height="70" rx="18" fill="white" fillOpacity="0.04" stroke="var(--accent-1)" strokeOpacity="0.4" />
        <path d="M53 124 L40 142 V124" fill="white" fillOpacity="0.04" stroke="var(--accent-1)" strokeOpacity="0.4" />
        <g>
          <rect x="44" y="94" width="9" height="20" rx="2.5" fill="var(--accent-1)" fillOpacity="0.45" />
          <rect x="59" y="82" width="9" height="32" rx="2.5" fill="var(--accent-1)" fillOpacity="0.65" />
          <rect x="74" y="68" width="9" height="46" rx="2.5" fill="var(--accent-1)" fillOpacity="0.9" />
        </g>
        <rect x="82" y="92" width="92" height="56" rx="16" fill="white" fillOpacity="0.07" stroke="var(--accent-1)" strokeOpacity="0.65" />
        <path d="M152 148 L166 163 V147" fill="white" fillOpacity="0.07" stroke="var(--accent-1)" strokeOpacity="0.65" />
        <g fill="white" fillOpacity="0.6">
          <circle cx="110" cy="120" r="3.6" />
          <circle cx="124" cy="120" r="3.6" />
          <circle cx="138" cy="120" r="3.6" />
        </g>
      </svg>
    </ArtPanel>
  );
}

export function PlannerArt() {
  const done = new Set([2, 7, 9, 12]);
  const today = 12;
  return (
    <ArtPanel accent="var(--accent-warm)">
      <svg viewBox="0 0 200 200" className="h-[68%] w-[68%]" fill="none">
        <rect x="34" y="46" width="132" height="116" rx="14" fill="white" fillOpacity="0.04" stroke="var(--accent-warm)" strokeOpacity="0.45" />
        <line x1="34" y1="74" x2="166" y2="74" stroke="var(--accent-warm)" strokeOpacity="0.3" />
        <line x1="68" y1="46" x2="68" y2="33" stroke="var(--accent-warm)" strokeOpacity="0.65" strokeWidth="3" strokeLinecap="round" />
        <line x1="132" y1="46" x2="132" y2="33" stroke="var(--accent-warm)" strokeOpacity="0.65" strokeWidth="3" strokeLinecap="round" />
        {Array.from({ length: 20 }).map((_, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const x = 54 + col * 24;
          const y = 94 + row * 18;
          const isToday = i === today;
          const isDone = done.has(i);
          return (
            <g key={i}>
              <rect
                x={x - 8}
                y={y - 8}
                width="16"
                height="16"
                rx="4"
                fill={isToday ? "var(--accent-warm)" : "white"}
                fillOpacity={isToday ? 0.9 : isDone ? 0.14 : 0.045}
              />
              {isDone && !isToday && (
                <path d={`M${x - 4} ${y} l3 3 l5 -6`} stroke="var(--accent-warm)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </g>
          );
        })}
      </svg>
    </ArtPanel>
  );
}

export function CompanionArt() {
  return (
    <ArtPanel accent="var(--accent-warm)">
      <svg viewBox="0 0 200 200" className="h-[68%] w-[68%]" fill="none">
        <circle cx="83" cy="100" r="44" stroke="var(--accent-warm)" strokeOpacity="0.3" strokeWidth="1.5" />
        <circle cx="117" cy="100" r="44" stroke="var(--accent-warm)" strokeOpacity="0.55" strokeWidth="1.5" />
        <path
          d="M100 86 C 91 73, 69 76, 69 95 C 69 113, 100 135, 100 135 C 100 135, 131 113, 131 95 C 131 76, 109 73, 100 86 Z"
          fill="var(--accent-warm)"
          fillOpacity="0.8"
        />
        <path
          d="M48 100 h16 l6 -13 l8 22 l6 -11 l5 6 h20"
          stroke="white"
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </ArtPanel>
  );
}
