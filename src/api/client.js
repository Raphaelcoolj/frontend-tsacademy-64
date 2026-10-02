import axios from "axios";
import { clearSession, getToken } from "../lib/session";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 anywhere except login/register means the token is missing, invalid or
// expired: drop it and go to the login screen (README §14.8).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? "";
    const isCredentialCall = url.includes("/auth/login") || url.includes("/auth/register");

    if (error.response?.status === 401 && !isCredentialCall) {
      clearSession();
      const path = window.location.pathname;
      if (path !== "/" && path !== "/login" && path !== "/register") {
        window.location.assign("/");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
