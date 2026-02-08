/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@google-cloud/tasks", "@google-cloud/firestore"],
};
export default nextConfig;
