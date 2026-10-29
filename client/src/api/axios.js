import axios from 'axios';

export const TOKEN_KEY = 'agritech_token';
export const USER_KEY = 'agritech_user';

/**
 * Shared Axios instance. The request interceptor attaches the JWT and the
 * response interceptor clears the session when the server returns 401.
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('agritech:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  (Array.isArray(error?.response?.data?.errors) && error.response.data.errors[0]?.message) ||
  error?.message ||
  'Something went wrong';

export default api;
