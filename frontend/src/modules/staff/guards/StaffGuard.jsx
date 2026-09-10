import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStaffStore } from '../store/useStaffStore';

/**
 * Protects all /staff/* routes.
 * Redirects to /staff/login if not authenticated or wrong role.
 */
export default function StaffGuard({ children }) {
    const { token, staff } = useStaffStore();

    if (!token || !staff) {
        return <Navigate to="/staff/login" replace />;
    }

    if (!['staff', 'team_leader'].includes(staff.role)) {
        return <Navigate to="/staff/login" replace />;
    }

    return children;
}
