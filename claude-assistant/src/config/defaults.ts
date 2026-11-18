import type { UserSettings } from "@/core/types";

export const APP_NAME = "Claude";

/** Sprache für Spracheingabe und -ausgabe (BCP-47). */
export const LANG = "de-DE";

/** Zürich – used until the user picks a location in Settings. */
export const DEFAULT_LOCATION = { label: "Zürich", latitude: 47.3769, longitude: 8.5417 };

export const DEFAULT_SETTINGS: UserSettings = {
  name: "Louis",
  location: null,
  bridgeUrl: "",
  voiceRate: 1,
  destinations: [
    // Fill in real addresses here. Used by the navigation module.
    // { key: "home", label: "Home", query: "Bahnhofstrasse 1, 8001 Zürich" },
  ],
};

/** Navigation is architected end-to-end but disabled until you flip this. */
export const NAVIGATION_ENABLED = false;

/** How often data refreshes while the app is open. */
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const SETTINGS_STORAGE_KEY = "claude-assistant:settings:v1";
