"use client";

// Doc §6/§21 Final CTA — "Explore products, get started, contact Noorva or
// join the ecosystem."

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import PageSection from "./ui/PageSection";
import { CircleDoodle } from "./ui/Doodle";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function FinalCTASection() {
  return (
    <PageSection id="final-cta" className="relative pt-32 pb-32 md:pt-40 md:pb-40">
      <span
        aria-hidden
        className="font-display pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 text-[13rem] leading-none text-[color:var(--accent)] opacity-[0.07] select-none md:text-[18rem]"
      >
        ✦
      </span>
      <motion.div
        className="relative z-10 mx-auto max-w-2xl text-center"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-display mb-6 text-4xl leading-[1.12] font-normal text-[color:var(--ink)] md:text-6xl"
        >
          The ecosystem is just getting started.
          <br />
          <span className="relative inline-block italic">
            Come explore it.
            <CircleDoodle className="pointer-events-none absolute -inset-x-6 -inset-y-3 h-[calc(100%+1.5rem)] w-[calc(100%+3rem)]" />
          </span>
        </motion.h2>

        <motion.p variants={fadeUp} transition={{ duration: 0.6, ease: "easeOut" }} className="mx-auto mb-12 max-w-lg text-base text-[color:var(--ink-soft)] md:text-lg">
          Meet the full Noorva product family, or reach out directly — we&rsquo;d love to hear from you.
        </motion.p>

        <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: "easeOut" }} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/products" className="btn-primary group">
            Explore the Ecosystem
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link href="/contact" className="btn-secondary">
            <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
            Contact Noorva
          </Link>
        </motion.div>
      </motion.div>
    </PageSection>
  );
}
