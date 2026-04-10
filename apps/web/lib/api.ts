import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

const shouldSkipRefresh = (url?: string) => {
    if (!url) return false;
    return url.includes('/auth/refresh') || url.includes('/auth/logout');
};

// Response interceptor for automatic token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl: string | undefined = originalRequest?.url;

        // If we get a 401 and haven't tried refreshing yet, except for refresh/logout endpoints
        if (
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            !shouldSkipRefresh(requestUrl)
        ) {
            originalRequest._retry = true;

            try {
                // Call the refresh endpoint
                // Cookies (access & refresh) are sent automatically because withCredentials is true
                await axios.post(
                    `${api.defaults.baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                // If refresh succeeds, retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, the user is truly unauthorized (e.g., refresh token expired)
                // You might want to redirect to login here or clear app state
                if (typeof window !== 'undefined') {
                    // window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
