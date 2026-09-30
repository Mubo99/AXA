/** @type {import('next').NextConfig} */
const nextConfig = {
  // Хуучин React апп public/app/ дотор статик хэвээр, "/" дээр нээгдэнэ.
  async rewrites() {
    return [{ source: "/", destination: "/app/index.html" }];
  },
  serverExternalPackages: ["postgres", "@electric-sql/pglite"],
};

export default nextConfig;
