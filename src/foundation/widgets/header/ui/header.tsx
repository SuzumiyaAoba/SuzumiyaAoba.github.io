"use client";

import { useEffect, useState } from "react";


import { Button } from "@/shared/ui/button";

const navItems = [
  { href: "/blog", label: "Blog" },
  { href: "/series", label: "Series" },
  { href: "/tags", label: "Tags" },
  { href: "/tools", label: "Tools" },
];

export function Header() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
      setScrollProgress(progress);
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-1">
          <div
            className="h-full origin-left bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${scrollProgress})` }}
          />
        </div>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 border-b border-border/60 px-6 py-3 md:border-b-0">
          <a href="/" className="flex items-center gap-4">
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-wide text-foreground">NO SEA. I SEE.</p>
            </div>
          </a>

          <nav className="hidden items-center gap-1 rounded-full p-1 text-sm font-medium text-muted-foreground md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-1.5 transition-colors hover:bg-background hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="rounded-none bg-transparent px-0 text-sm font-medium text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
            >
              <a href="/about">About</a>
            </Button>
            <span className="text-border/70">/</span>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="rounded-none bg-transparent px-0 text-sm font-medium text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
            >
              <a href="/search">Search</a>
            </Button>
          </div>

          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors"
              aria-label="メニューを開く"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className="relative block h-4 w-5">
                <span
                  className={`absolute left-0 top-0 h-0.5 w-full rounded-full bg-current transition-transform duration-200 ${
                    isMenuOpen ? "translate-y-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 rounded-full bg-current transition-opacity duration-200 ${
                    isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-current transition-transform duration-200 ${
                    isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </div>
      <div
        id="mobile-nav"
        className={`mx-auto block max-w-6xl overflow-hidden px-6 transition-[max-height,opacity] duration-300 md:hidden ${
          isMenuOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0 pb-0"
        }`}
      >
        <nav className="flex flex-col gap-3 py-4 text-sm font-medium text-muted-foreground">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 transition-colors hover:bg-background hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="h-px bg-border/60" />
          <a
            href="/about"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-background hover:text-foreground"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </a>
          <a
            href="/search"
            className="rounded-lg px-3 py-2 transition-colors hover:bg-background hover:text-foreground"
            onClick={() => setIsMenuOpen(false)}
          >
            Search
          </a>
        </nav>
      </div>
    </header>
  );
}
