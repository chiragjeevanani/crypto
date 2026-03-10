import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '../../user/store/useUserStore';

export default function ProtectedRoute({ allowedRoles = [] }) {
    const location = useLocation();
    const isAuthenticated = useUserStore(state => state.isAuthenticated);
    const authChecked = useUserStore(state => state.authChecked);
    const authLoading = useUserStore(state => state.authLoading);
    const user = useUserStore(state => state.user);
    const role = user?.role;
    const isAdminSession = ['SuperNode', 'Admin', 'super_admin', 'Developer'].includes(role);

    if (!authChecked || authLoading) {
        return <div className="p-6 text-sm text-muted">Checking session...</div>;
    }

    if (!isAuthenticated) {
        const dest = location.pathname.startsWith('/admin') ? '/admin/login' : '/signin';
        return <Navigate to={dest} replace />;
    }

    // Admin area: only admin roles can access, others go to admin login
    if (location.pathname.startsWith('/admin') && !isAdminSession) {
        return <Navigate to="/admin/login" replace />;
    }

    // Role-based protection:
    // - For admin routes, keep admins in /admin and others at /admin/login
    // - For user routes (like /home), never redirect into /admin; send to /signin instead
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        if (location.pathname.startsWith('/admin')) {
            const fallback = isAdminSession ? '/admin' : '/admin/login';
            return <Navigate to={fallback} replace />;
        }
        // User-area route but role not allowed (e.g. admin hitting /home):
        // treat as unauthenticated for this section and send to user sign-in
        return <Navigate to="/signin" replace />;
    }

    return <Outlet />;
}
