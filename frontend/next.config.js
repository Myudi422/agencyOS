/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'file.legalpilar.id',
      },
      {
        protocol: 'https',
        hostname: 's3.us-east-005.backblazeb2.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
};

module.exports = nextConfig;
