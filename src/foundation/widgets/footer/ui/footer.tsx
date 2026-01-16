

import { T } from "@/shared/ui/t";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:px-6 md:flex-row md:justify-center">
        <p className="text-xs text-muted-foreground">© {year} SuzumiyaAoba</p>
        <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <a href="/contact" className="hover:text-foreground">
            <T id="footer.contact" />
          </a>
          <a href="/privacy-policy" className="hover:text-foreground">
            <T id="footer.privacy" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
