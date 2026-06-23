export default function MainContent() {
  return (
    <section id="main-content" className="relative z-10 overflow-hidden text-white"
      style={{ background: "linear-gradient(180deg, #020008 0%, #04020e 30%, #060212 100%)" }}
    >
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 80% 50% at 50% 0%,   rgba(79,50,229,0.22), transparent)",
            "radial-gradient(ellipse 60% 40% at 85% 42%,  rgba(8,145,178,0.12), transparent)",
            "radial-gradient(ellipse 50% 35% at 15% 65%,  rgba(120,40,220,0.10), transparent)",
          ].join(", "),
        }}
      />

      {/* Separator top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-32 md:py-52">

        {/* ── HERO STATEMENT ───────────────────────────────────── */}
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-7 text-[9px] md:text-[11px] tracking-[0.55em] uppercase text-cyan-200/50">
            The Noorva Ecosystem
          </p>
          <h2
            className="font-[var(--font-playfair)] text-5xl md:text-8xl leading-[1.04] tracking-[-0.045em]"
          >
            Technology with a
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #b8e0ff 0%, #ffffff 40%, #d4bbff 80%)",
              }}
            >
              human horizon.
            </span>
          </h2>
          <p className="mx-auto mt-9 max-w-2xl text-base md:text-xl leading-8 text-white/48">
            Noorva is a deeply personal intelligence designed to understand your context,
            adapt to your world, and grow alongside you — through every chapter.
          </p>
        </div>

        {/* ── FEATURE CARDS ─────────────────────────────────────── */}
        <div
          className="mt-32 grid gap-px overflow-hidden md:grid-cols-3"
          style={{
            borderRadius: "2rem",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          {[
            {
              num:   "01",
              title: "Guide",
              copy:  "Thoughtful direction for decisions, uncertainty, and every meaningful turn in your journey.",
              accent: "rgba(100,180,255,0.15)",
            },
            {
              num:   "02",
              title: "Planner",
              copy:  "Calm structure for your time, ambitions, and ideas — shaped around the way you actually live.",
              accent: "rgba(140,80,255,0.15)",
            },
            {
              num:   "03",
              title: "Companion",
              copy:  "An intelligence that remembers, listens, and becomes more useful as your story unfolds.",
              accent: "rgba(60,200,160,0.12)",
            },
          ].map(({ num, title, copy, accent }) => (
            <article
              key={title}
              className="group relative min-h-[360px] p-9 md:p-12 transition-all duration-700"
              style={{
                background: "#050510",
                borderRadius: 0,
              }}
            >
              {/* Hover accent glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 30% 30%, ${accent}, transparent 65%)` }}
              />

              <span className="text-[10px] tracking-[0.38em] text-cyan-200/30">{num}</span>
              <div
                className="mt-24 h-px bg-gradient-to-r from-cyan-300/60 to-violet-400/20 transition-all duration-500 group-hover:w-24"
                style={{ width: "2.5rem" }}
              />
              <h3
                className="mt-7 font-[var(--font-playfair)] text-3xl text-white/88 transition-colors duration-500 group-hover:text-white"
              >
                {title}
              </h3>
              <p className="mt-5 text-sm leading-7 text-white/42 group-hover:text-white/60 transition-colors duration-500">
                {copy}
              </p>
            </article>
          ))}
        </div>

        {/* ── CLOSING CTA ───────────────────────────────────────── */}
        <div className="mt-40 flex flex-col items-center text-center">
          <p
            className="text-[9px] md:text-[11px] uppercase tracking-[0.45em] text-white/30"
          >
            The journey has only begun
          </p>
          <div
            className="mt-8 w-px h-24"
            style={{
              background: "linear-gradient(to bottom, rgba(160,120,255,0.6), transparent)",
            }}
          />
          <a
            href="#"
            className="mt-10 group inline-flex items-center gap-3 rounded-full border px-8 py-3 text-sm tracking-[0.18em] uppercase text-white/60 transition-all duration-500 hover:text-white hover:border-white/30 hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.12)" }}
          >
            <span>Discover Noorva</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
