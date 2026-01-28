import { useState, useEffect, useCallback } from "react";

export interface AppSettings {
  autoPinNewTasks: boolean;
  enableInProgressTime: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoPinNewTasks: true,
  enableInProgressTime: true,
};

const STORAGE_KEY = "task-app-settings";

const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return DEFAULT_SETTINGS;
};

const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return { settings, updateSetting };
};

export const getSettings = (): AppSettings => loadSettings();
