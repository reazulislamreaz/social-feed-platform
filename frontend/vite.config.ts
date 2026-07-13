import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4175,
    proxy: {
      "/api": {
        target: "https://reaz.sellx.no",
        changeOrigin: true,
      },
      "/uploads": {
        target: "https://reaz.sellx.no",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4175,
    allowedHosts: ["frontend.sellx.no"],
  },
});
