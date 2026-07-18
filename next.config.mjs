/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/davi-finance",
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
