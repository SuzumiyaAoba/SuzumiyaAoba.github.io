import type { Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";

export function AiNavigation({
  active,
  locale = "ja",
}: {
  active: "models" | "benchmarks";
  locale?: Locale;
}) {
  const en = locale === "en";
  return (
    <nav
      aria-label={en ? "AI resources" : "AI の資料"}
      className="flex flex-wrap gap-x-6 border-b"
    >
      {[
        {
          id: "models",
          href: "/ai/models/",
          label: en ? "Model releases" : "モデルのリリース",
        },
        {
          id: "benchmarks",
          href: "/ai/benchmarks/",
          label: en ? "Benchmarks" : "ベンチマーク",
        },
      ].map((item) => (
        <a
          key={item.id}
          href={item.href}
          aria-current={active === item.id ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center border-b-2 text-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
            active === item.id
              ? "border-brand font-medium text-foreground"
              : "border-transparent text-muted-foreground"
          )}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
