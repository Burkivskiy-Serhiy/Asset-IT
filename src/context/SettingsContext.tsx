'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  adminName: string;
  adminEmail: string;
  currency: string;
  assetPrefix: string;
  emailNotif: boolean;
  slackNotif: boolean;
  slackWebhook: string;
  maintenanceMode: boolean;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  adminName: 'System Admin',
  adminEmail: 'admin@itasset.com',
  currency: 'UAH',
  assetPrefix: 'ITA-',
  emailNotif: true,
  slackNotif: false,
  slackWebhook: '',
  maintenanceMode: false,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setSettings(data);
        }
      }
    } catch (error) {
      console.error('Помилка завантаження глобальних налаштувань:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);