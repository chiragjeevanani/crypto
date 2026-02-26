import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '../../user/store/useUserStore';

export default function ProtectedRoute() {
    const isAuthenticated = useUserStore(state => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
