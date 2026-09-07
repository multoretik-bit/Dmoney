import withPWAInit from "next-pwa";
import defaultRuntimeCaching from "next-pwa/cache.js";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/(api\.exchangerate\.fun|open\.er-api\.com)\//i,
      handler: 'NetworkOnly',
      method: 'GET',
    },
    ...defaultRuntimeCaching,
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
