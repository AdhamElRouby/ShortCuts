import axios from 'axios';

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: '/api',              // Base URL for all requests (proxied to http://localhost:3000 in dev)
  withCredentials: true,       // Include credentials (cookies) in cross-origin requests
});

export default axiosInstance;