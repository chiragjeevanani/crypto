import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// simple redirect to one of the sub‑pages; the old tab UI has been moved to discrete routes
export default function PlatformSettings() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('financial', { replace: true });
    }, [navigate]);

    return null;
}
