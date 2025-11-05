import axios from "axios";
import { Cookies } from "react-cookie";

const cookies = new Cookies();

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 5000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (error.response?.status === 401) {
      cookies.remove("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);
export default axiosInstance;
