"use client";

// Static, on-brand illustrations standing in for the old flying-phone mockup —
// one abstract vector scene per feature, each themed to its accent color,
// displayed as the "screen" of a static phone mockup (no animation/rotation —
// that's what looked bad before) matching the rest of the site's premium,
// understated look.

// Server/client Math.sin/cos can differ in their last float digit across
// environments — rounding before it hits a JSX attribute keeps SSR and
// hydration output byte-identical instead of triggering a mismatch warning.
const r2 = (n: number) => Math.round(n * 100) / 100;

function ArtPanel({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <div className="relative mx-auto aspect-[9/19] h-[46vh] max-h-[440px] min-h-[300px]">
      {/* Ambient glow behind the phone */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 scale-125 opacity-50 blur-[70px]"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
      />

      {/* Phone body — sized to fill this bounded wrapper so it never dwarfs
          the row or overflows the viewport regardless of column width. */}
      <div
        className="relative h-full w-full overflow-hidden rounded-[38px] border-[6px] border-neutral-800 bg-black"
        style={{ boxShadow: "0 40px 90px -20px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.06)" }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-black" />

        {/* Screen backdrop */}
        <div
          className="pointer-events-none absolute inset-0 opacity-45 blur-[40px]"
          style={{ background: `radial-gradient(circle at 50% 42%, ${accent}, transparent 70%)` }}
        />
        <div className="pointer-events-none absolute inset-0 vignette-edge" />

        {/* Screen content */}
        <div
          className="relative flex h-full w-full items-center justify-center p-6"
          style={{ filter: `drop-shadow(0 0 14px ${accent})` }}
        >
          {children}
        </div>

        {/* Glass glare */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
      </div>

      {/* Side buttons */}
      <div className="absolute -left-[7px] top-[20%] h-9 w-[6px] rounded-l-sm bg-neutral-800" />
      <div className="absolute -right-[7px] top-[16%] h-14 w-[6px] rounded-r-sm bg-neutral-800" />
    </div>
  );
}

export function GuideArt() {
  return (
    <ArtPanel accent="var(--accent-2)">
      <svg viewBox="0 0 200 200" className="aspect-square w-[72%]" fill="none">
        <defs>
          <linearGradient id="guide-needle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-2)" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="72" stroke="var(--accent-2)" strokeOpacity="0.4" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="54" stroke="var(--accent-2)" strokeOpacity="0.6" strokeDasharray="2 7" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const major = i % 3 === 0;
          return (
            <line
              key={i}
              x1={r2(100 + Math.cos(a) * 72)}
              y1={r2(100 + Math.sin(a) * 72)}
              x2={r2(100 + Math.cos(a) * (major ? 61 : 65))}
              y2={r2(100 + Math.sin(a) * (major ? 61 : 65))}
              stroke="white"
              strokeOpacity={major ? 0.45 : 0.22}
              strokeWidth={major ? 1.5 : 1}
            />
          );
        })}
        <g transform="rotate(35 100 100)">
          <polygon points="100,40 108,100 100,112 92,100" fill="url(#guide-needle)" />
          <polygon points="100,160 108,100 100,88 92,100" fill="white" fillOpacity="0.3" />
        </g>
        <circle cx="100" cy="100" r="7" fill="white" />
        <circle cx="100" cy="100" r="7" fill="none" stroke="var(--accent-2)" strokeWidth="1.5" />
        <path
          d="M34 168 C 68 152, 56 118, 90 108 S 140 68, 152 34"
          stroke="var(--accent-2)"
          strokeOpacity="0.6"
          strokeWidth="1.75"
          strokeDasharray="1 7"
          strokeLinecap="round"
        />
        <path d="M152 26 l2.8 7.6 L163 37 l-7.6 2.8 L152 47 l-2.8-7.6L142 37l7.6-2.8Z" fill="var(--accent-2)" />
      </svg>
    </ArtPanel>
  );
}

export function MentorArt() {
  return (
    <ArtPanel accent="var(--accent-1)">
      <svg viewBox="0 0 200 200" className="aspect-square w-[72%]" fill="none">
        <defs>
          <linearGradient id="mentor-bar" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="var(--accent-1)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent-1)" />
          </linearGradient>
        </defs>
        <rect x="26" y="52" width="114" height="72" rx="18" fill="white" fillOpacity="0.05" stroke="var(--accent-1)" strokeOpacity="0.5" strokeWidth="1.5" />
        <path d="M52 124 L38 144 V124" fill="white" fillOpacity="0.05" stroke="var(--accent-1)" strokeOpacity="0.5" strokeWidth="1.5" />
        <g>
          <rect x="42" y="92" width="10" height="22" rx="2.5" fill="url(#mentor-bar)" />
          <rect x="58" y="78" width="10" height="36" rx="2.5" fill="url(#mentor-bar)" />
          <rect x="74" y="62" width="10" height="52" rx="2.5" fill="url(#mentor-bar)" />
        </g>
        <path d="M42 116 L58 100 L68 106 L84 84" stroke="white" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="80" y="90" width="94" height="58" rx="16" fill="white" fillOpacity="0.08" stroke="var(--accent-1)" strokeOpacity="0.75" strokeWidth="1.5" />
        <path d="M150 148 L165 164 V147" fill="white" fillOpacity="0.08" stroke="var(--accent-1)" strokeOpacity="0.75" strokeWidth="1.5" />
        <g fill="white" fillOpacity="0.7">
          <circle cx="108" cy="119" r="4" />
          <circle cx="123" cy="119" r="4" />
          <circle cx="138" cy="119" r="4" />
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
      <svg viewBox="0 0 200 200" className="aspect-square w-[72%]" fill="none">
        <defs>
          <linearGradient id="planner-today" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-warm)" />
            <stop offset="100%" stopColor="#fff7e6" />
          </linearGradient>
        </defs>
        <rect x="32" y="44" width="136" height="120" rx="14" fill="white" fillOpacity="0.05" stroke="var(--accent-warm)" strokeOpacity="0.55" strokeWidth="1.5" />
        <line x1="32" y1="73" x2="168" y2="73" stroke="var(--accent-warm)" strokeOpacity="0.4" />
        <line x1="66" y1="44" x2="66" y2="30" stroke="var(--accent-warm)" strokeOpacity="0.75" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="134" y1="44" x2="134" y2="30" stroke="var(--accent-warm)" strokeOpacity="0.75" strokeWidth="3.5" strokeLinecap="round" />
        {Array.from({ length: 20 }).map((_, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const x = 53 + col * 24.5;
          const y = 93 + row * 18.5;
          const isToday = i === today;
          const isDone = done.has(i);
          return (
            <g key={i}>
              <rect
                x={x - 8.5}
                y={y - 8.5}
                width="17"
                height="17"
                rx="4.5"
                fill={isToday ? "url(#planner-today)" : "white"}
                fillOpacity={isToday ? 1 : isDone ? 0.16 : 0.05}
              />
              {isToday && <rect x={x - 8.5} y={y - 8.5} width="17" height="17" rx="4.5" fill="none" stroke="var(--accent-warm)" strokeWidth="1" style={{ filter: "drop-shadow(0 0 6px var(--accent-warm))" }} />}
              {isDone && !isToday && (
                <path d={`M${x - 4} ${y} l3 3 l5 -6`} stroke="var(--accent-warm)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
      <svg viewBox="0 0 200 200" className="aspect-square w-[72%]" fill="none">
        <defs>
          <linearGradient id="companion-heart" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff7e6" />
            <stop offset="100%" stopColor="var(--accent-warm)" />
          </linearGradient>
        </defs>
        <circle cx="81" cy="100" r="46" stroke="var(--accent-warm)" strokeOpacity="0.35" strokeWidth="1.75" />
        <circle cx="119" cy="100" r="46" stroke="var(--accent-warm)" strokeOpacity="0.65" strokeWidth="1.75" />
        <path
          d="M100 84 C 90 70, 66 73, 66 94 C 66 114, 100 138, 100 138 C 100 138, 134 114, 134 94 C 134 73, 110 70, 100 84 Z"
          fill="url(#companion-heart)"
          style={{ filter: "drop-shadow(0 0 10px var(--accent-warm))" }}
        />
        <path
          d="M44 100 h16 l6 -14 l8 24 l6 -12 l5 6 h21"
          stroke="white"
          strokeOpacity="0.55"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </ArtPanel>
  );
}
