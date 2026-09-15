import type { ReactNode } from "react";
import type { Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import { Header } from "./header";
import { Footer } from "./footer";

type SiteLayoutProps = {
  locale: Locale;
  path: string;
  children: ReactNode;
  className?: string;
};

export function SiteLayout({
  locale,
  path,
  children,
  className,
}: SiteLayoutProps) {
  return (
    <div className={cn("site-page", className)}>
      <Header locale={locale} path={path} />
      {children}
      <Footer locale={locale} />
    </div>
  );
}
