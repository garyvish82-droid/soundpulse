"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/icons";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-4 transition-all duration-300 sm:px-8 ${
        scrolled ? "border-b border-white/5 bg-bg/95 backdrop-blur-md" : "border-b border-transparent bg-transparent"
      }`}
    >
      <a href="#" className="flex items-center gap-2.5" aria-label="SoundPulse home">
        <Logo size={28} />
        <span className="text-sm font-medium tracking-tight text-text">SoundPulse</span>
      </a>
      <div className="flex items-center gap-4">
        <a href="#story" className="hidden text-sm text-text-faint transition-colors hover:text-text sm:inline">
          Story
        </a>
        <a href="#how" className="hidden text-sm text-text-faint transition-colors hover:text-text sm:inline">
          How it works
        </a>
        <a
          href="/dashboard"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-brand-strong hover:shadow-[0_8px_30px_rgba(59,130,246,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Try it →
        </a>
      </div>
    </nav>
  );
}
