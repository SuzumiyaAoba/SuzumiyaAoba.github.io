import { AlertTriangle } from "lucide-react";

export default function AmazonAssociate() {
  return (
    <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-200">
          <p className="font-medium mb-1">Amazon アソシエイトについて</p>
          <p>
            この記事には Amazon アソシエイトのリンクが含まれています。
            リンクをクリックして商品を購入していただくと、サイト運営のための手数料が支払われます。
            商品の価格や詳細は変更される可能性があります。
          </p>
        </div>
      </div>
    </div>
  );
}
