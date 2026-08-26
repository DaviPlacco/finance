/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/finance",
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
