import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    // Skann alle klientmoduler ved oppstart. Ellers oppdager Vite avhengigheter
    // (f.eks. platejs) først når en rute lastes, laster siden på nytt, og siden
    // kan bli hengende uhydrert. Det gir ustabile E2E-tester mot kald dev-server.
    entries: [
      "./app/**/*.{ts,tsx}",
      "!./app/**/*.{test,spec}.{ts,tsx}",
      "!./app/**/*.server.{ts,tsx}",
      "!./app/test/**",
    ],
  },
  server: {
    port: 5174,
    hmr: {
      path: "/",
      clientPort: 5174,
      host: "localhost",
    },
  },
});
