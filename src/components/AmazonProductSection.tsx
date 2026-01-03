import { cn } from "@/libs/utils";

type AmazonProduct = {
  title: string;
  imageUrl: string;
  productUrl: string;
};

type Props = {
  products: AmazonProduct[];
  className?: string;
};

export default function AmazonProductSection({
  products,
  className,
}: Props) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className={cn("mt-10", className)}>
      <div className="flex flex-col gap-6">
        {products.map((product) => (
          <a
            key={product.productUrl}
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-4 sm:flex-row sm:items-stretch rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/40 p-4 !text-black !no-underline hover:!no-underline hover:border-neutral-400 dark:hover:border-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            <div className="overflow-hidden rounded-md !bg-transparent !border-0 flex justify-center sm:block sm:flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-auto max-w-[140px] mx-auto sm:mx-0 !bg-transparent !border-0 !p-0 !m-0"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="flex flex-col gap-3 sm:justify-between">
              <div className="font-semibold leading-snug">{product.title}</div>
              <span className="inline-flex items-center justify-center rounded-md !bg-black px-4 py-2 text-sm font-semibold !text-white transition">
                Amazon.co.jp で購入する
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
