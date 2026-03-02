import { useEffect, useState, useCallback } from 'react';
import { useAdminStore } from '../store/useAdminStore';

// custom hook to drive the platform settings form state and actions
export function useSettingsForm() {
    const { settings, loadSettings, updatePlatformSettings, isLoading } = useAdminStore();
    const [formData, setFormData] = useState({});

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const handleChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleCommit = useCallback(() => {
        updatePlatformSettings(formData);
    }, [formData, updatePlatformSettings]);

    const reset = useCallback(() => {
        setFormData(settings);
        alert('Resetting local changes to kernel state...');
    }, [settings]);

    return { formData, handleChange, handleCommit, reset, isLoading };
}
