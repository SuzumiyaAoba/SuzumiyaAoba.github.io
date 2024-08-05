const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  assetPrefix: isProd ? "https://suzumiyaaoba.github.io" : undefined,
};

export default nextConfig;
