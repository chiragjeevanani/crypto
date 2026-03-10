import { Navigate } from 'react-router-dom';
import { useUserStore } from '../../user/store/useUserStore';
import SignInPage from '../../user/pages/SignInPage';

const ADMIN_ROLES = ['SuperNode', 'Admin', 'super_admin', 'Developer'];

/**
 * Handles "/" so the user module never shows admin:
 * - Logged-in User → redirect to /home (home page)
 * - Logged-in admin → redirect to /admin (admin area only)
 * - Not logged in → show user SignIn page (no admin login here)
 */
export default function RootRoute() {
    const authChecked = useUserStore(state => state.authChecked);
    const authLoading = useUserStore(state => state.authLoading);
    const isAuthenticated = useUserStore(state => state.isAuthenticated);
    const user = useUserStore(state => state.user);
    const role = user?.role;
    const isAdminSession = ADMIN_ROLES.includes(role);

    if (!authChecked || authLoading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center text-muted text-sm">
                Checking session...
            </div>
        );
    }

    if (isAuthenticated && isAdminSession) {
        return <Navigate to="/admin" replace />;
    }

    if (isAuthenticated && role === 'User') {
        return <Navigate to="/home" replace />;
    }

    return <SignInPage />;
}
