import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";

import type { AffiliateProduct } from "@/shared/lib/affiliate-products";

export type AmazonProductSectionProps = {
  products: AffiliateProduct[];
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
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 font-noto">
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full justify-center sm:w-36 sm:justify-start"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-auto w-full max-w-[160px] rounded-md"
                loading="lazy"
                decoding="async"
              />
            </a>
            <div className="flex flex-1 flex-col gap-3 sm:min-h-[140px] sm:justify-between">
              <p className="text-sm font-semibold text-foreground">{product.title}</p>
              <div className="flex flex-col gap-2">
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-md bg-foreground px-4 py-2 text-xs font-semibold text-background sm:w-fit font-noto"
                >
                  Amazon.co.jp で購入する
                </a>
                {product.yahooShoppingUrl ? (
                  <a
                    href={product.yahooShoppingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 sm:w-fit font-noto"
                  >
                    Yahoo!ショッピングで購入する
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}
