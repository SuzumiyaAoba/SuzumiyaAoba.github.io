import withExportImages from "next-export-optimize-images";

const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.buymeacoffee.com",
        pathname: "/buttons/v2/default-yellow.png",
      },
    ],
    // 画像の最適化
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  reactStrictMode: true,
  // SSG
  output: isProd ? "export" : undefined,
  assetPrefix: isProd ? "https://suzumiyaaoba.com" : undefined,
  trailingSlash: true,
  // SEO対策
  compress: true, // gzip圧縮を有効化
  poweredByHeader: false, // X-Powered-By ヘッダーを無効化
};

export default withExportImages(nextConfig);
