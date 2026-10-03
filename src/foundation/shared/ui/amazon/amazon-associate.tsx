import { Icon } from "@/shared/ui/icon";

import { cn } from "@/shared/lib/utils";

export type AmazonAssociateProps = {
  className?: string;
};

export function AmazonAssociate({ className }: AmazonAssociateProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface px-4 py-3 text-sm text-muted-foreground",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Icon
          icon="lucide:info"
          className="mt-0.5 size-3.5 shrink-0 text-subtle-foreground"
        />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Amazon アソシエイトについて
          </p>
          <p className="text-xs leading-5">
            この記事には Amazon
            アソシエイトのリンクが含まれています。Amazonのアソシエイトとして、SuzumiyaAoba
            は適格販売により収入を得ています。
          </p>
        </div>
      </div>
    </div>
  );
}
