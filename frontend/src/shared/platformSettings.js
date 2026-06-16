const COOKIE_KEY = 'platform_settings';

export const DEFAULT_PLATFORM_SETTINGS = {
    commission: 10,
    minWithdrawal: 10,
    minReferralsForWithdrawal: 5,
    coinRate: 1,
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

let fetchPromise = null;
let lastFetchTime = 0;

export function fetchPlatformSettings() {
    const now = Date.now();
    // Cache the promise for 1 minute to prevent multiple components from making duplicate calls
    if (fetchPromise && now - lastFetchTime < 60000) {
        return fetchPromise;
    }

    fetchPromise = (async () => {
        try {
            const url = `${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/config`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success && data.config) {
                lastFetchTime = Date.now();
                return savePlatformSettingsToCookie({
                    commission: data.config.platformFeePct,
                    minWithdrawal: data.config.minWithdrawalCoins,
                    minReferralsForWithdrawal: data.config.minReferralsForWithdrawal,
                    premiumThreshold: data.config.premiumThreshold,
                    coinRate: data.config.coinRate
                });
            }
        } catch (error) {
            console.error('Failed to fetch platform settings:', error);
        }
        return getPlatformSettingsFromCookie();
    })();

    return fetchPromise;
}

