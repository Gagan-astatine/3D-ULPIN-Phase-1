import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    viteStaticCopy({
      targets: ["Workers", "ThirdParty", "Assets", "Widgets"].map((folder) => ({
        src: `node_modules/cesium/Build/Cesium/${folder}`,
        dest: "cesium",
      })),
    }),
  ],
  build: {
    chunkSizeWarningLimit: 4500,
    rollupOptions: { output: { manualChunks: { cesium: ["cesium"] } } },
  },
});
