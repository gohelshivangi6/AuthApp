import axios from "axios";
import { getSessionToken, clearSessionToken } from "../utils/sessionToken";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const token = await getSessionToken();
  if (token) {
    config.headers["X-Session-Token"] = token;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearSessionToken();
      localStorage.removeItem("persist:root");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
