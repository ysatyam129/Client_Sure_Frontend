// import axios from "axios";

// const Axios = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
//   withCredentials: true,
//   timeout: 30000, // 30 seconds timeout
//   headers: {
//     'Content-Type': 'application/json',
//   }
// });

// // Request interceptor for error handling
// Axios.interceptors.request.use(
//   (config) => {
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor for error handling
// Axios.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     if (error.code === 'ECONNABORTED') {
//       console.error('Request timeout');
//     }
//     return Promise.reject(error);
//   }
// );

// export default Axios;
import axios from "axios";

// const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const baseURL =  "https://client-sure-backend.vercel.app/api";
// const baseURL =  "http://localhost:5000/api";
const Axios = axios.create({
  baseURL: baseURL,
  withCredentials: false,
  timeout: 10000,
});

// Add connection test
const testConnection = async () => {
  try {
    await Axios.get('/health');
    console.log('✅ Backend connection successful');
  } catch (error) {
    console.warn('⚠️ Backend connection failed:', baseURL);
  }
};

// Test connection on load
if (typeof window !== 'undefined') {
  testConnection();
}

// Request interceptor to add auth token
Axios.interceptors.request.use(
  (config) => {
    // Check for admin token first, then regular user token
    const adminToken = localStorage.getItem("adminToken");
    const userToken = localStorage.getItem("userToken");
    

    const token = adminToken  || userToken;

    if (token) {
      // Remove quotes if token is stored as JSON string
      const cleanToken = token.replace(/^"|"$/g, '');
      config.headers.authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
Axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired, clear localStorage and redirect to login
      localStorage.removeItem('userToken');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on a login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default Axios;