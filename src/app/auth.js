// auth.js
'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';

const AuthContext = createContext();

// Function to set up Axios instance with token
const axiosWithAuth = (token) => {
    const instance = axios.create({
        baseURL: 'https://api.ektesad.com',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return instance;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = Cookies.get('jwt');
        if (token) {
            setUser(token);
            axiosWithAuth(token); // Set up Axios instance with token
        }
        setLoading(false);
    }, []);

    const login = async (identifier, password) => {
        try {
            const response = await axios.post('https://api.ektesad.com/auth/local', { identifier, password });
            const token = response.data.jwt;
            if (!token) {
                throw new Error('JWT token not found in response');
            }
            setUser(token);
            Cookies.set('jwt', token, { expires: 7 });
            axiosWithAuth(token); // Set up Axios instance with token
            router.push('/dashboard/posts');
        } catch (error) {
            console.error('Login failed:', error);
            throw new Error('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        }
    };

    const logout = () => {
        setUser(null);
        Cookies.remove('jwt');
        router.push('/login');
    };

    const getToken = () => user;

    return (
        <AuthContext.Provider value={{ login, logout, getToken, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
