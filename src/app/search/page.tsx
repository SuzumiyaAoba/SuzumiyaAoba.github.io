import React, { Suspense } from "react";
import SearchComponent from "@/components/Search/SearchComponent";
import { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Search | SuzumiyaAoba Blog",
  description: "Site search",
};

// ローディング表示用のコンポーネント
function SearchLoading() {
  return (
    <div className="py-4 text-center">
      <p>Loading search functionality...</p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <>
      <Script src="/pagefind-adapter.js" strategy="afterInteractive" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Search</h1>
        <Suspense fallback={<SearchLoading />}>
          <SearchComponent />
        </Suspense>
      </div>
    </>
  );
}
