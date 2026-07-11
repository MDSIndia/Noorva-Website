"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Apple, Check, PlayCircle } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function ClosingSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    // TODO: wire to real waitlist backend/email service
    await new Promise((resolve) => setTimeout(resolve, 600));
    setStatus("success");
  }

  return (
    <section id="closing" className="relative w-full overflow-hidden bg-[color:var(--bg)]/70 pt-40 pb-28 md:pt-48 md:pb-36">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px]">
        <div className="h-full w-full rounded-full bg-[color:var(--accent-warm)]/10 blur-[120px] animate-float-slow" />
      </div>
      <div className="pointer-events-none absolute -bottom-56 left-1/2 -translate-x-1/2 h-[560px] w-[560px]">
        <div className="h-full w-full rounded-full bg-[color:var(--accent-1)]/10 blur-[140px]" />
      </div>
      <div className="pointer-events-none absolute top-1/3 -left-32 h-[420px] w-[420px]">
        <div className="h-full w-full rounded-full bg-[color:var(--accent-2)]/10 blur-[130px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 vignette-edge" />

      <motion.div
        className="relative z-10 mx-auto max-w-2xl px-8 text-center"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        transition={{ staggerChildren: 0.12 }}
      >
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative mx-auto mb-8 flex h-16 w-16 items-center justify-center"
        >
          <div
            className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-70 blur-lg"
            style={{ background: "radial-gradient(circle, rgba(124,92,252,0.55), transparent 70%)" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-dashed"
            style={{ borderColor: "rgba(124,92,252,0.4)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          />
          <div
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/70 backdrop-blur-xl"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.09), 0 8px 24px -6px rgba(0,0,0,0.6)" }}
          >
            <Image src="/NoorvaLogo.png" alt="Noorva" width={22} height={22} className="opacity-95" />
          </div>
        </motion.div>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-6 text-[10px] md:text-xs tracking-[0.5em] uppercase text-[color:var(--accent-warm)]/80 font-light"
        >
          09 / The Story Continues
        </motion.p>

        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-balance font-playfair text-4xl md:text-6xl font-light text-white/95 leading-[1.15] mb-6"
        >
          Every leap in human progress was a new way to connect.
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #3965e5 0%, #7c5cfc 50%, #db45d7 100%)",
              filter: "drop-shadow(0 0 24px rgba(124,92,252,0.35))",
            }}
          >
            Noorva is the next one.
          </span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto max-w-lg text-base md:text-lg text-white/60 font-light mb-12"
        >
          Noorva is a human-interactive AI companion — not another assistant, but a guide,
          mentor, planner, and companion that grows with you. The next chapter is still being written.
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto w-full max-w-xl rounded-[28px] p-[1.5px]"
          style={{
            background: "linear-gradient(135deg, rgba(57,101,229,0.5), rgba(124,92,252,0.55), rgba(219,69,215,0.5))",
            boxShadow: "0 0 50px -10px rgba(124,92,252,0.35)",
          }}
        >
          <div
            className="rounded-[27px] bg-black/85 px-6 py-8 backdrop-blur-xl sm:px-8"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
          >
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-4"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--accent-warm)]/40"
                  style={{ background: "color-mix(in srgb, var(--accent-warm) 15%, transparent)" }}
                >
                  <Check className="h-5 w-5 text-[color:var(--accent-warm)]" strokeWidth={2} />
                </div>
                <p className="text-white/80 text-base md:text-lg font-light">
                  You&rsquo;re on the list — we&rsquo;ll be in touch.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mx-auto flex w-full flex-col gap-3 sm:flex-row sm:items-stretch"
                noValidate
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="Enter your email"
                  aria-label="Email address"
                  className="flex-1 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-xl transition focus:border-[color:var(--accent-warm)]/60 focus:bg-white/[0.06] focus:ring-1 focus:ring-[color:var(--accent-warm)]/40"
                />
                <motion.button
                  type="submit"
                  disabled={status === "submitting"}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="group relative shrink-0 self-stretch rounded-full p-[1.5px] transition-transform duration-300 disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #e8b478, #db45d7, #7c5cfc)",
                    boxShadow: "0 0 28px rgba(232,180,120,0.35)",
                  }}
                >
                  <span className="btn-glow flex h-full w-full items-center justify-center rounded-full bg-black/85 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition-colors duration-300 group-hover:bg-black/70">
                    {status === "submitting" ? "Joining…" : "Join the waitlist"}
                  </span>
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {status === "error" && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="mt-3 text-sm text-red-300/80"
              >
                Enter a valid email.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <a
            href="#"
            className="group flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 backdrop-blur-xl transition-colors duration-300 hover:border-white/30 hover:bg-white/[0.07]"
          >
            <Apple className="h-6 w-6 text-white/85" strokeWidth={1.5} />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[9px] tracking-[0.2em] text-white/45 uppercase">Download on the</span>
              <span className="text-sm font-medium text-white/90">App Store</span>
            </span>
          </a>
          <a
            href="#"
            className="group flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 backdrop-blur-xl transition-colors duration-300 hover:border-white/30 hover:bg-white/[0.07]"
          >
            <PlayCircle className="h-6 w-6 text-white/85" strokeWidth={1.5} />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[9px] tracking-[0.2em] text-white/45 uppercase">Get it on</span>
              <span className="text-sm font-medium text-white/90">Google Play</span>
            </span>
          </a>
        </motion.div>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto mt-16 flex flex-col items-center gap-4 opacity-70"
        >
          <div className="h-px w-10 bg-white/15" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/35">
            Noorva &middot; {new Date().getFullYear()}
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
