import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/python-online/",
  plugins: [react()],
  build: {
    outDir: "dist-ecs",
    emptyOutDir: true,
  },
});
