import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";

import type { AmazonProduct } from "@/shared/lib/amazon-products";

export type AmazonProductSectionProps = {
  products: AmazonProduct[];
  className?: string;
};

export function AmazonProductSection({ products, className }: AmazonProductSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-4", className)}>
      {products.map((product) => (
        <Card
          key={product.id}
          className="border border-border/60 bg-card/40 shadow-none transition-colors hover:bg-card/60"
        >
          <Link
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 font-noto"
          >
            <div className="flex w-full justify-center sm:w-36 sm:justify-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-auto w-full max-w-[160px] rounded-md"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 sm:min-h-[140px] sm:justify-between">
              <p className="text-sm font-semibold text-foreground">{product.title}</p>
              <span className="inline-flex w-full items-center justify-center rounded-md bg-foreground px-4 py-2 text-xs font-semibold text-background sm:w-fit font-noto">
                Amazon.co.jp で購入する
              </span>
            </div>
          </Link>
        </Card>
      ))}
    </section>
  );
}
