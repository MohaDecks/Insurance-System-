import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  /** Avoid infinite “Signing in…” when API is down or wrong port */
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.code === "ECONNABORTED") {
      return Promise.reject(
        new Error(
          "Server ma jawaabin (timeout). Hubi in backend uu socdo (server folder: npm run dev) iyo in PORT-ka uu la mid yahay Vite proxy."
        )
      );
    }
    if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
      return Promise.reject(
        new Error(
          "Lama xiriirin serverka. Hubi in API uu furan yahay (tusaale PORT=5003) iyo in Vite proxy uu isla PORT-kaas u jeedo."
        )
      );
    }
    const msg = err.response?.data?.message || err.message || "Request failed";
    return Promise.reject(new Error(msg));
  }
);
