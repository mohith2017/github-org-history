import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import additionBuildPlugin from "./plugins/additionBuildPlugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), additionBuildPlugin()],
  server: {
    host: "0.0.0.0",
    proxy: {
      '/api': {
        target: 'https://api.pepy.tech/api/',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
