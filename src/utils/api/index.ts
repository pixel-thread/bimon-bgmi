import { AUTH_TOKEN_KEY } from "@/src/lib/constant/jwt-key";
import axios from "axios";
import { Cookies } from "react-cookie";

const cookies = new Cookies();

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 70000, // 20 seconds
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = cookies.get(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (error.response?.status === 401) {
      cookies.remove(AUTH_TOKEN_KEY);
      window.location.reload();
    }
    return Promise.reject(error);
  },
);
export default axiosInstance;
