"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

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
    <section id="closing" className="relative w-full min-h-screen overflow-hidden bg-[color:var(--bg)]/70 flex items-center">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px]">
        <div className="h-full w-full rounded-full bg-[color:var(--accent-warm)]/10 blur-[120px] animate-float-slow" />
      </div>

      <motion.div
        className="relative z-10 mx-auto max-w-2xl px-8 py-32 text-center"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        transition={{ staggerChildren: 0.12 }}
      >
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
          className="font-playfair text-4xl md:text-6xl font-light text-white/95 leading-[1.15] mb-6"
        >
          Every leap in human progress was a new way to connect.
          <br />
          Noorva is the next one.
        </motion.h2>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto max-w-lg text-base md:text-lg text-white/60 font-light mb-12"
        >
          Noorva is a human-interactive AI companion — not another assistant, but a guide,
          mentor, planner, and companion that grows with you. The next chapter is still being written.
        </motion.p>

        <motion.div variants={fadeUp} transition={{ duration: 0.8, ease: "easeOut" }}>
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.p
                key="success"
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5 }}
                className="text-white/80 text-base md:text-lg font-light"
              >
                You&rsquo;re on the list — we&rsquo;ll be in touch.
              </motion.p>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row"
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
                  className="flex-1 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[color:var(--accent-warm)]/60 focus:ring-1 focus:ring-[color:var(--accent-warm)]/40"
                />
                <motion.button
                  type="submit"
                  disabled={status === "submitting"}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn-glow shrink-0 rounded-full border border-white/15 bg-white/10 px-8 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-60"
                >
                  {status === "submitting" ? "Joining…" : "Join the waitlist"}
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
        </motion.div>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mt-24 flex flex-col items-center gap-3 opacity-70"
        >
          <Image src="/NoorvaLogo.png" alt="Noorva" width={28} height={28} className="opacity-80" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/35">
            Noorva &middot; {new Date().getFullYear()}
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
