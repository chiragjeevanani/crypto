const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
import { getPlatformSettingsFromCookie, savePlatformSettingsToCookie } from '../../../shared/platformSettings';

let mockSettings = getPlatformSettingsFromCookie();

let mockSettingsLog = [];

export const settingsService = {
    fetchSettings: async () => {
        await delay(500);
        mockSettings = getPlatformSettingsFromCookie();
        return { ...mockSettings };
    },

    updateSettings: async (newSettings, adminRole = 'super_admin') => {
        await delay(1200);

        if (adminRole !== 'super_admin') {
            throw new Error('Permission Denied: Only Super Admin can modify financial parameters.');
        }

        const oldSettings = { ...mockSettings };
        mockSettings = savePlatformSettingsToCookie({ ...mockSettings, ...newSettings });

        // Log changes
        for (const key in newSettings) {
            if (oldSettings[key] !== newSettings[key]) {
                mockSettingsLog.unshift({
                    timestamp: new Date().toISOString(),
                    parameter: key,
                    oldValue: oldSettings[key],
                    newValue: newSettings[key],
                    admin: 'SuperAdmin'
                });
            }
        }

        return { ...mockSettings };
    },

    fetchSettingsLogs: async () => {
        await delay(500);
        return [...mockSettingsLog];
    }
};
