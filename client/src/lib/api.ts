import axios from 'axios';

let accessToken: string | null = null;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
});

export const setAccessToken = (nextAccessToken: string | null) => {
  accessToken = nextAccessToken;
};

export const clearAccessToken = () => {
  accessToken = null;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
