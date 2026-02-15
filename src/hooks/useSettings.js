import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

let settingsCache = null;

export function useSettings() {
    const [settings, setSettings] = useState(settingsCache || {});
    const [loading, setLoading] = useState(!settingsCache);
    const [error, setError] = useState(null);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('system_config')
                .select('key, value');

            if (error) throw error;

            const configMap = (data || []).reduce((acc, item) => {
                acc[item.key] = item.value;
                return acc;
            }, {});

            settingsCache = configMap;
            setSettings(configMap);
        } catch (err) {
            console.error('Error fetching system settings:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!settingsCache) {
            fetchSettings();
        } else {
            setLoading(false);
        }
    }, []);

    const getSetting = (key, defaultValue) => {
        return settings[key] !== undefined ? settings[key] : defaultValue;
    };

    return {
        settings,
        getSetting,
        loading,
        error,
        refreshSettings: fetchSettings
    };
}
