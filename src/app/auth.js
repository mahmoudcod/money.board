'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

// Function to set up Axios instance with token
const axiosWithAuth = (token) => {
    const instance = axios.create({
        baseURL: 'https://money-api.ektesad.com',
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
    let appName = 'ss'

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
            const response = await axios.post('https://money-api.ektesad.com/api/auth/local', { identifier, password });
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
        router.push('/');
    };

    const app = () => appName;
    const getToken = () => user;

    const getCurrentUserId = () => {
        if (user) {
            try {
                const decodedToken = jwtDecode(user);
                return decodedToken.id; // Assuming the user ID is stored in the 'id' field of the token
            } catch (error) {
                console.error('Error decoding token:', error);
                return null;
            }
        }
        return null;
    };
    const isAdmin = () => {
        if (user) {
            try {
                const decodedToken = jwtDecode(user);
                return decodedToken.role === 'admin'; // Adjust this based on how admin status is stored in your token
            } catch (error) {
                console.error('Error decoding token:', error);
                return false;
            }
        }
        return false;
    };


    return (
        <AuthContext.Provider value={{ login, logout, getToken, app, loading, getCurrentUserId, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);