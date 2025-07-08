/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost/:path*", // proxy to backend
      },
    ];
  },
};

export default nextConfig;
