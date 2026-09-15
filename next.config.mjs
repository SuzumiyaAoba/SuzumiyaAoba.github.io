/** @type {import("next").NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {},
  serverExternalPackages: [
    "codehike",
    "@code-hike/lighter",
    "next-mdx-remote",
  ],
  webpack: (/** @type {{ watchOptions?: Record<string, unknown> }} */ config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/node_modules/**", "**/.git/**", "**/out/**", "**/.next/**"],
    };
    return config;
  },
};

export default nextConfig;
