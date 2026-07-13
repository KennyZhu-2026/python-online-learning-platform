import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "ecs",
  base: "/python-online/",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../dist-ecs",
    emptyOutDir: true,
  },
});
