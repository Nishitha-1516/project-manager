import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5001/api', // backend base URL
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get the user object from local storage
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.token) {
      // If the token exists, add it to the Authorization header
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;