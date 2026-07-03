/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      // beforeFiles runs before app routes, so "/" serves the static clone
      beforeFiles: [{ source: "/", destination: "/index.html" }],
    };
  },
};

module.exports = nextConfig;
