// ProtectedRoute.js

'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useAuth } from './auth';

const ProtectedRoute = ({ children }) => {
    const { getToken } = useAuth();
    const token = getToken();
    const router = useRouter(); // Initialize useRouter

    useEffect(() => {
        if (!token) {
            router.push('/login');
        } else {
            return router.push('')
        }
        return

    }, [token, router]);

    return <>{children}</>;
};

export default ProtectedRoute;
