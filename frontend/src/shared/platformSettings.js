const COOKIE_KEY = 'platform_settings';

export const DEFAULT_PLATFORM_SETTINGS = {
    commission: 15,
    minWithdrawal: 100,
    maintenanceMode: false,
    kycMandatory: true,
    maxVotesPerDay: 50,
    maxGiftsPerMinute: 200,
};

function parseCookies() {
    return document.cookie
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce((acc, part) => {
            const idx = part.indexOf('=');
            if (idx === -1) return acc;
            const key = decodeURIComponent(part.slice(0, idx));
            const value = decodeURIComponent(part.slice(idx + 1));
            acc[key] = value;
            return acc;
        }, {});
}

export function getPlatformSettingsFromCookie() {
    try {
        const cookies = parseCookies();
        if (!cookies[COOKIE_KEY]) return { ...DEFAULT_PLATFORM_SETTINGS };
        const parsed = JSON.parse(cookies[COOKIE_KEY]);
        return { ...DEFAULT_PLATFORM_SETTINGS, ...parsed };
    } catch {
        return { ...DEFAULT_PLATFORM_SETTINGS };
    }
}

export function savePlatformSettingsToCookie(settings) {
    const payload = {
        ...DEFAULT_PLATFORM_SETTINGS,
        ...settings,
    };
    const encoded = encodeURIComponent(JSON.stringify(payload));
    document.cookie = `${COOKIE_KEY}=${encoded}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.dispatchEvent(new CustomEvent('platform-settings-updated', { detail: payload }));
    return payload;
}

