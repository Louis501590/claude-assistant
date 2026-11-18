/** @type {import('next').NextConfig} */
// Static export: the whole app is plain files. No server needed, hostable for free.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};
