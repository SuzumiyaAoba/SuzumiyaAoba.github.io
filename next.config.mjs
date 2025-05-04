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
  },
  reactStrictMode: true,
  // SSG
  output: isProd ? "export" : undefined,
  assetPrefix: isProd ? "https://suzumiyaaoba.com" : undefined,
  trailingSlash: true,
};

export default withExportImages(nextConfig);
