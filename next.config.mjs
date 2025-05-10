// @ts-check

const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.buymeacoffee.com",
        pathname: "/buttons/v2/default-yellow.png",
      },
      {
        hostname: "suzumiyaaoba.com",
        protocol: "https",
        port: "",
      },
    ],
    // 画像の最適化
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    unoptimized: isProd, // 本番ビルドでは画像最適化を無効化（静的エクスポートのため）
  },
  reactStrictMode: true,
  // SSG設定
  output: isProd ? "export" : undefined,
  trailingSlash: true,
  // SEO対策
  compress: true, // gzip圧縮を有効化
  poweredByHeader: false, // X-Powered-By ヘッダーを無効化

  // リダイレクト設定
  async redirects() {
    return [
      {
        source: "/blog/:slug/",
        destination: "/blog/post/:slug/",
        permanent: true, // 301リダイレクト
      },
    ];
  },
};

export default nextConfig;
