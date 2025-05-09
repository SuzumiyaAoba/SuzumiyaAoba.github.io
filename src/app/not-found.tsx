import Link from "next/link";

// 静的生成の設定
export const dynamic = "force-static";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h2 className="text-4xl font-bold mb-4">404</h2>
      <h3 className="text-2xl mb-6">ページが見つかりません</h3>
      <p className="mb-8">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link
        href="/"
        className="px-6 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        ホームに戻る
      </Link>
    </div>
  );
}
