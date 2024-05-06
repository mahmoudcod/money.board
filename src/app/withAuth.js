// ProtectedRoute.js

'use client'
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import useRouter
import { useAuth } from './auth';

const ProtectedRoute = ({ children }) => {
    const pathname = usePathname()
    const { getToken } = useAuth();
    const token = getToken();
    const router = useRouter(); // Initialize useRouter

    useEffect(() => {
        if (!token) {
            router.push('/');
        } else {
            return router.push('')
        }

        return

    }, [token, router]);

    return <>{children}</>;
};

export default ProtectedRoute;
