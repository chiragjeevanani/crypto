import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '../../user/store/useUserStore';

export default function ProtectedRoute() {
    const isAuthenticated = useUserStore(state => state.isAuthenticated);
    const user = useUserStore(state => state.user);
    const isAdminSession = ['SuperNode', 'Admin', 'super_admin'].includes(user?.role);

    if (!isAuthenticated) {
        // if user is admin, send to admin login; else send to user signin (for now assume admin route when under /admin)
        const dest = location.pathname.startsWith('/admin') ? '/admin/login' : '/signin';
        return <Navigate to={dest} replace />;
    }

    if (location.pathname.startsWith('/admin') && !isAdminSession) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
}
