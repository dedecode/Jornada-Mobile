import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { registerSignOutHandler } from '../services/api';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
        registerSignOutHandler(signOut);
    }, []);


    async function loadStorageData() {
        try {
            const storedToken = await AsyncStorage.getItem('@access_token');
            const storedUser = await AsyncStorage.getItem('@user');

            if (storedToken && storedUser) {
                api.defaults.headers.Authorization = `Bearer ${storedToken}`;
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error('Failed to fetch token from storage', e);
        } finally {
            setLoading(false);
        }
    }

    async function signIn(username, password) {
        try {
            const response = await api.post('users/login/', {
                username,
                password,
            });

            const { access, refresh } = response.data;

            // O login da API atual não retorna o objeto do usuário inteiro, 
            // então setamos o username aqui como fallback simulado.
            const userData = { username };

            await AsyncStorage.multiSet([
                ['@access_token', access],
                ['@refresh_token', refresh],
                ['@user', JSON.stringify(userData)],
            ]);

            api.defaults.headers.Authorization = `Bearer ${access}`;
            setUser(userData);
        } catch (error) {
            console.error('SignIn Error:', error);
            throw error;
        }
    }

    async function signOut() {
        await AsyncStorage.clear();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
