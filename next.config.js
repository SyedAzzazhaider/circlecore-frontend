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
    NEXT_PUBLIC_API_URL:    "",
    NEXT_PUBLIC_SOCKET_URL: "http://15.207.144.166:5000"
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://15.207.144.166:5000/api/:path*"
      }
    ];
  }
};
module.exports = nextConfig;