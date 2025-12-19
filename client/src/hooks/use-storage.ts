import { useState, useEffect } from "react";
import { logger } from '../utils/logger';

interface StorageState<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  loading: boolean;
  error: string | null;
}

export function useLocalStorage<T>(key: string, defaultValue: T): StorageState<T> {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [value, setStoredValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedValue = JSON.parse(item);
        setStoredValue(parsedValue);
      }
    } catch (err) {
      setError("Failed to load from localStorage");
      logger.error("Error reading localStorage key", { key, error: err });
    } finally {
      setLoading(false);
    }
  }, [key]);

  const setValue = (newValue: T | ((prev: T) => T)) => {
    try {
      setError(null);
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      setError("Failed to save to localStorage");
      logger.error("Error setting localStorage key", { key, error: err });
    }
  };

  return { value, setValue, loading, error };
}

export function useSessionStorage<T>(key: string, defaultValue: T): StorageState<T> {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [value, setStoredValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      if (item) {
        const parsedValue = JSON.parse(item);
        setStoredValue(parsedValue);
      }
    } catch (err) {
      setError("Failed to load from sessionStorage");
      logger.error("Error reading sessionStorage key", { key, error: err });
    } finally {
      setLoading(false);
    }
  }, [key]);

  const setValue = (newValue: T | ((prev: T) => T)) => {
    try {
      setError(null);
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      setError("Failed to save to sessionStorage");
      logger.error("Error setting sessionStorage key", { key, error: err });
    }
  };

  return { value, setValue, loading, error };
}

// Utility to clear specific storage items
export const clearStorageItem = (key: string, type: 'local' | 'session' = 'local') => {
  try {
    if (type === 'local') {
      window.localStorage.removeItem(key);
    } else {
      window.sessionStorage.removeItem(key);
    }
  } catch (error) {
    logger.error(`Failed to clear ${type} storage item:`, { key, error });
  }
};

// User preferences hook
export function useUserPreferences() {
  return useLocalStorage('complianceai_preferences', {
    hasSeenOnboarding: false,
    preferredFramework: '',
    theme: 'light',
    autoSave: true,
    notifications: true
  });
}
