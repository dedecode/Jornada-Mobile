import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Alterar para o IP da sua máquina se for rodar no dispositivo físico (ex: 192.168.1.100)

const API_URL = 'http://192.168.0.100:8000/api/';

const api = axios.create({
    baseURL: API_URL,
});

let signOutHandler = null;

export const registerSignOutHandler = (handler) => {
    signOutHandler = handler;
};

api.interceptors.request.use(
    async (config) => {
        // Não anexa o token para rotas públicas de autenticação (login, registro e refresh)
        const isAuthRoute = config.url && (
            config.url.includes('users/login') ||
            config.url.includes('users/register') ||
            config.url.includes('users/token/refresh')
        );

        if (!isAuthRoute) {
            const token = await AsyncStorage.getItem('@access_token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Se o erro for 401 (Unauthorized) e não for uma tentativa de retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await AsyncStorage.getItem('@refresh_token');
                if (!refreshToken) {
                    throw new Error('Refresh token não encontrado');
                }

                // Usamos uma chamada axios limpa para evitar que passe por este interceptor de resposta recursivamente
                const refreshResponse = await axios.post(`${API_URL}users/token/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = refreshResponse.data;
                await AsyncStorage.setItem('@access_token', access);

                api.defaults.headers.Authorization = `Bearer ${access}`;
                originalRequest.headers['Authorization'] = `Bearer ${access}`;

                processQueue(null, access);
                isRefreshing = false;

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;

                // Se falhar a renovação do token, limpamos o storage e deslogamos o usuário
                if (signOutHandler) {
                    await signOutHandler();
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const getImageUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
        return photoPath;
    }
    const origin = api.defaults.baseURL.replace('/api/', '');
    return `${origin}${photoPath}`;
};

export default api;

