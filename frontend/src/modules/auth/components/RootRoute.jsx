import { Navigate } from 'react-router-dom';
import { useUserStore } from '../../user/store/useUserStore';
import SignInPage from '../../user/pages/SignInPage';

/**
 * Handles "/" as the User module entry point only (never redirects to admin):
 * - Logged-in User → redirect to /home (user home page)
 * - Not logged in (or any other role e.g. admin) → show user SignIn page
 * Admins must use /admin or /admin/login directly; "/" stays safe for users.
 */
export default function RootRoute() {
    const authChecked = useUserStore(state => state.authChecked);
    const authLoading = useUserStore(state => state.authLoading);
    const isAuthenticated = useUserStore(state => state.isAuthenticated);
    const user = useUserStore(state => state.user);
    const role = user?.role;

    if (!authChecked || authLoading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center text-muted text-sm">
                Checking session...
            </div>
        );
    }

    // Only redirect to user home when logged in as a regular User
    if (isAuthenticated && role === 'User') {
        return <Navigate to="/home" replace />;
    }

    // Not logged in, or admin/other role: show user sign-in (never send to admin from "/")
    return <SignInPage />;
}
