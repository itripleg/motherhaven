/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "market-data-images.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Exclude debug pages from builds
  async rewrites() {
    if (process.env.NODE_ENV === "production") {
      return [
        {
          source: "/debug/:path*",
          destination: "/404",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
