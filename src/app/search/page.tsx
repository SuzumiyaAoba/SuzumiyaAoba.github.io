import React, { Suspense } from "react";
import SearchComponent from "@/components/Search/SearchComponent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "検索 | SuzumiyaAoba Blog",
  description: "サイト内検索",
};

// ローディング表示用のコンポーネント
function SearchLoading() {
  return (
    <div className="py-4 text-center">
      <p>検索機能を読み込み中...</p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">サイト内検索</h1>
      <Suspense fallback={<SearchLoading />}>
        <SearchComponent />
      </Suspense>
    </div>
  );
}
