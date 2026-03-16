import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/how-it-works',
        permanent: true,
      },
      {
        source: '/voice/about',
        destination: '/how-it-works#voice',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
