import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useUserStore } from '../../user/store/useUserStore';
import LogoutConfirmationModal from '../../user/components/shared/LogoutConfirmationModal';

export default function LogoutPage() {
    const logout = useUserStore(state => state.logout);
    const { logout: privyLogout } = usePrivy();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(true);

    const handleConfirm = async () => {
        logout();
        try {
            await privyLogout();
        } catch (e) {
            console.error("Privy logout error", e);
        }
        navigate('/signin', { replace: true });
    };

    const handleCancel = () => {
        setIsOpen(false);
        navigate(-1); // Go back to previous page
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
            <LogoutConfirmationModal 
                isOpen={isOpen} 
                onClose={handleCancel} 
                onConfirm={handleConfirm} 
            />
        </div>
    );
}
