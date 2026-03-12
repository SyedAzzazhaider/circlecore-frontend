const path = require("path");

/** @type {import("next").NextConfig} */
const nextConfig = {
  webpack: function(config) {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "http",  hostname: "15.207.144.166"   }
    ]
  },
  env: {
    NEXT_PUBLIC_API_URL:    process.env.NEXT_PUBLIC_API_URL    || "http://15.207.144.166",
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || "http://15.207.144.166"
  }
};

module.exports = nextConfig;