import { AlertTriangle } from "lucide-react";

export default function AmazonAssociate() {
  return (
    <div className="px-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="!my-2 font-bold">Amazon アソシエイトについて</p>
        </div>
        <div>
          <p className="!mt-0 mb-1 text-sm text-amber-800 dark:text-amber-200">
            この記事には Amazon アソシエイトのリンクが含まれています。
            リンクをクリックして商品を購入していただくと、サイト運営のための手数料が支払われます。
            商品の価格や詳細は変更される可能性があります。
          </p>
        </div>
      </div>
    </div>
  );
}
