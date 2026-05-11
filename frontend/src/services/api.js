import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true, // For refresh tokens in cookies if used
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Basic handling: if unauthorized, clear token. 
      // A more robust app might attempt a token refresh here.
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      // Force reload to kick to login screen if unauthorized on protected routes
      if (window.location.pathname !== "/login") {
         window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
