/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/finance",
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
