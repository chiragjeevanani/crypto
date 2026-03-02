import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '../../user/store/useUserStore';

export default function LogoutPage() {
    const logout = useUserStore(state => state.logout);

    useEffect(() => {
        logout();
    }, [logout]);

    return <Navigate to="/signin" replace />;
}
