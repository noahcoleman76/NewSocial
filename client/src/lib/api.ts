import axios from 'axios';

let accessToken: string | null = null;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
});

const apiOrigin = new URL(api.defaults.baseURL ?? 'http://localhost:4000/api').origin;

export const assetUrl = (url: string | null | undefined) => {
  if (!url) {
    return null;
  }

  if (/^(https?:|blob:|data:)/i.test(url)) {
    return url;
  }

  return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
};

export const setAccessToken = (nextAccessToken: string | null) => {
  accessToken = nextAccessToken;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
