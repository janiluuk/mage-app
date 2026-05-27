import { fileURLToPath, URL } from "node:url";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from 'path'
import vue from "@vitejs/plugin-vue";
import dotenv from "dotenv";
import { defineConfig, loadEnv } from "vite";

dotenv.config(); // load env vars from .env

// https://vitejs.dev/config/
export default ({ mode }) => {
  // export default defineConfig(() => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const env = loadEnv(mode, process.cwd(), "");

  return defineConfig({
    plugins: [
      vue(),
      viteStaticCopy({
        targets: [
          {
            src: path.join(
              __dirname,
              "node_modules",
              "mediainfo.js",
              "dist",
              "MediaInfoModule.wasm"
            ),
            dest: "",
          },
        ],
      }),
    ],
    define: {
      "process.env": env,
      __VALUE__: `"${process.env.VALUE}"`, // wrapping in "" since it's a string
    },
    
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        // Proxy API requests to local Laravel backend for development
        // Start the backend with: cd ../mage-api && php artisan serve --port=8001
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:8001',
          changeOrigin: true,
          secure: false,
        },
      },
      cors: { origin: "*" },

      headers: {
        // Required for freecut (WebGPU + SharedArrayBuffer)
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Access-Control-Allow-Origin": "*",
      },
    },
  });
};
