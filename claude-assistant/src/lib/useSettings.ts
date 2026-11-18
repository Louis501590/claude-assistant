"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "@/config/defaults";
import type { UserSettings } from "@/core/types";

function load(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<UserSettings>) };
  } catch {
    /* storage unavailable or corrupt → defaults */
  }
  return DEFAULT_SETTINGS;
}

/** Settings live in localStorage – this is a single-user app with no backend. */
export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(load());
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { settings, update, ready };
}
