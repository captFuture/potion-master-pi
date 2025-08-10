import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Disable lovable-tagger on ARM (e.g., Raspberry Pi) to avoid native crashes
    mode === 'development' && process.arch === 'x64' && componentTagger(),
  ].filter(Boolean),
  // Avoid esbuild entirely to fix Raspberry Pi "Illegal instruction"
  optimizeDeps: { disabled: true },
  esbuild: false,
  build: {
    target: "es2020",
    minify: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
