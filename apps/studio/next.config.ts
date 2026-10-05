/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@gooos/db", "@gooos/auth", "@gooos/ui"],
  experimental: {
    serverActions: {},
  },
};

export default nextConfig;
