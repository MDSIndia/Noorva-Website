"use client";

// "Notify me" box for product launch updates. No backend/email service
// exists in this repo, so submitting builds a mailto: link (prefilled
// subject/body with the entered address) and hands off to the visitor's
// own mail app — a real action rather than a form that quietly submits
// nowhere, matching the mailto convention already used elsewhere on this
// page (doc §26/§27 — official contact details pending confirmation).

import { useState, type FormEvent } from "react";
import { Bell, Check, ArrowRight } from "lucide-react";
import Card from "./ui/Card";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOTIFY_EMAIL = "info@noorva.ai";

export default function NotifyForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "sent">("idle");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setStatus("error");
      return;
    }
    const subject = encodeURIComponent("Notify me — Noorva updates");
    const body = encodeURIComponent(
      `Please add ${email} to the list for Noorva product updates and launch news.`
    );
    window.location.href = `mailto:${NOTIFY_EMAIL}?subject=${subject}&body=${body}`;
    setStatus("sent");
  }

  return (
    <Card>
      <div className="p-8 text-center md:p-12">
        <div
          className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundImage: "var(--accent-gradient)" }}
        >
          <Bell className="h-5 w-5 text-white" strokeWidth={1.5} />
        </div>

        <h3 className="font-display mb-3 text-2xl font-normal text-[color:var(--ink)] md:text-3xl">
          Get notified
        </h3>
        <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-[color:var(--ink-soft)] md:text-base">
          Be the first to know when Noorva Companion and the wider ecosystem are ready. No spam — just launch news.
        </p>

        {status === "sent" ? (
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundImage: "var(--accent-gradient)" }}
            >
              <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-sm text-[color:var(--ink-soft)]">
              Your email app should be opening now — send it and you&rsquo;re on the list.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              placeholder="you@email.com"
              aria-label="Email address"
              className="flex-1 rounded-full glass px-5 py-3 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink-faint)] outline-none transition-colors focus:border-[color:var(--ink)]"
            />
            <button type="submit" className="btn-primary-sm group shrink-0 justify-center">
              Notify Me
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-3 text-sm text-[color:var(--ink-soft)]">Enter a valid email address.</p>
        )}
      </div>
    </Card>
  );
}
