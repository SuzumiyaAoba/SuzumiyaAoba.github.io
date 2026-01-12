import { Icon } from "@iconify/react";

import { cn } from "@/shared/lib/utils";

export type AmazonAssociateProps = {
  className?: string;
};

export function AmazonAssociate({ className }: AmazonAssociateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-sm text-amber-900",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Icon icon="lucide:alert-triangle" className="mt-0.5 size-4 text-amber-600" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Amazon アソシエイトについて</p>
          <p className="text-xs leading-5">
            この記事には Amazon アソシエイトのリンクが含まれています。Amazonのアソシエイトとして、SuzumiyaAoba
            は適格販売により収入を得ています。
          </p>
        </div>
      </div>
    </div>
  );
}
