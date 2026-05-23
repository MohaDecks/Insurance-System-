import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** Must match server `PORT` in server/.env (dev only). */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_DEV_API_PROXY || "http://127.0.0.1:5003";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
        },
        "/uploads": {
          target,
          changeOrigin: true,
        },
      },
    },
  };
});
