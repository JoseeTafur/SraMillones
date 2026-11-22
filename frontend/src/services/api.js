
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : 'http://localhost:8080/api';

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const apiAuth = axios.create({
    baseURL: `${baseURL}/v2/auth`,
    withCredentials: true,
});

let accessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
    accessToken = token;
};

export const refreshAccessToken = async () => {
    if (!refreshPromise) {
        refreshPromise = apiAuth.post('/refresh')
            .then(response => {
                const token = response.data.body.data.accessToken;
                setAccessToken(token);
                return token;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

api.interceptors.request.use(config => {
    if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/')
        ) {
            originalRequest._retry = true;

            try {
                const token = await refreshAccessToken();

                originalRequest.headers.Authorization = `Bearer ${token}`;

                return api(originalRequest);
            } catch (refreshError) {
                setAccessToken(null);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
