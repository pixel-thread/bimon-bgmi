import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

import { logger } from '../logger';

import axiosInstance from '../api';
import { MetaT } from '@/types/meta';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null; // 👈 Explicitly allow `null`
  meta?: MetaT;
  token?: string;
  error?: string | Record<string, unknown>;
}

export const handleAxiosError = <T>(error: unknown): ApiResponse<T> => {
  let errorMessage = 'Something went wrong. Please try again.';
  let errorDetails: string | Record<string, unknown> = '';

  if (error instanceof AxiosError) {
    if (error.response) {
      errorMessage = (error.response.data as { message?: string })?.message || errorMessage;
      errorDetails =
        (error.response.data as { error?: string | Record<string, unknown> })?.error ||
        error.response.data ||
        '';
    } else if (error.request) {
      errorMessage = 'No response from server. Please check your connection.';
    } else {
      errorMessage = error.message;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return {
    success: false,
    message: errorMessage,
    error: errorDetails,
    data: null,
  };
};

const handleResponse = <T>(response: AxiosResponse<ApiResponse<T>>): ApiResponse<T> => {
  return {
    success: response.data.success,
    message: response.data.message || 'Request successful',
    data: response.data.data ?? null,
    meta: response?.data?.meta,
    token: response.data.token,
  };
};

const http = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      logger.log({ method: 'GET =>', path: url });
      const response = await axiosInstance.get(url, config);
      return handleResponse<T>(response);
    } catch (error) {
      return handleAxiosError<T>(error);
    }
  },

  post: async <T>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    try {
      logger.log({ method: 'POST =>', path: url, data });
      const response = await axiosInstance.post(url, data, config);
      return handleResponse<T>(response);
    } catch (error) {
      return handleAxiosError<T>(error);
    }
  },

  put: async <T>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    try {
      logger.log({ method: 'PUT =>', path: url });
      const response = await axiosInstance.put(url, data, config);
      return handleResponse<T>(response);
    } catch (error) {
      return handleAxiosError<T>(error);
    }
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      logger.log({ method: 'DELETE =>', path: url });
      const response = await axiosInstance.delete(url, config);
      return handleResponse<T>(response);
    } catch (error) {
      return handleAxiosError<T>(error);
    }
  },
};

export default http;
