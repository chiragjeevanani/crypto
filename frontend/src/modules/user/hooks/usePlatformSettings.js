import { useEffect, useState } from 'react';
import { DEFAULT_PLATFORM_SETTINGS, getPlatformSettingsFromCookie } from '../../../shared/platformSettings';

export function usePlatformSettings() {
    const [settings, setSettings] = useState(() => getPlatformSettingsFromCookie());

    useEffect(() => {
        const sync = () => setSettings(getPlatformSettingsFromCookie());
        sync();
        window.addEventListener('platform-settings-updated', sync);
        window.addEventListener('focus', sync);
        return () => {
            window.removeEventListener('platform-settings-updated', sync);
            window.removeEventListener('focus', sync);
        };
    }, []);

    return {
        ...DEFAULT_PLATFORM_SETTINGS,
        ...settings,
    };
}

