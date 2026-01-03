import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 600000, // 10 minutes
});

// Token getter function - will be set by AuthProvider
let getAuthToken: (() => Promise<string | null>) | null = null;

// Called by AuthProvider to inject the getToken function
export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  getAuthToken = getter;
};

axiosInstance.interceptors.request.use(
  async (config) => {
    // Get fresh token for each request
    if (getAuthToken) {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axiosInstance;
