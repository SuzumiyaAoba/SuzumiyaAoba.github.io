import withExportImages from "next-export-optimize-images";

const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SSG
  output: "export",
  assetPrefix: isProd ? "https://suzumiyaaoba.github.io" : undefined,
  trailingSlash: true,
};

export default withExportImages(nextConfig);
