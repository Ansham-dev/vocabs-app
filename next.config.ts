import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The static Paris game lives at public/paris/index.html. Next serves
  // public files only at exact paths, so /paris would 404 — rewrite it.
  // (The game loads its words relative-first, so both /paris and
  // /paris/index.html resolve vocab.json correctly.)
  async rewrites() {
    return [{ source: "/paris", destination: "/paris/index.html" }];
  },
};

export default nextConfig;
