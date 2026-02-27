const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let mockSettings = {
    commission: 15,
    minWithdrawal: 25,
    maintenanceMode: false,
    kycMandatory: true,
    maxVotesPerDay: 50,
    maxGiftsPerMinute: 200,
};

let mockSettingsLog = [];

export const settingsService = {
    fetchSettings: async () => {
        await delay(500);
        return { ...mockSettings };
    },

    updateSettings: async (newSettings, adminRole = 'super_admin') => {
        await delay(1200);

        if (adminRole !== 'super_admin') {
            throw new Error('Permission Denied: Only Super Admin can modify financial parameters.');
        }

        const oldSettings = { ...mockSettings };
        mockSettings = { ...mockSettings, ...newSettings };

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
