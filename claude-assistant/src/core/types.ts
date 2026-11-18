/**
 * Domain types. Pure data – no React, no browser APIs.
 * Every UI card, voice answer and briefing is derived from these.
 */

export type RainPeriod = "morning" | "afternoon" | "evening" | "night";

export interface WeatherSnapshot {
  temperatureC: number;
  highC: number;
  lowC: number;
  /** 0–100 */
  rainChance: number;
  condition: string;
  /** Daypart in which rain is most likely, if any. */
  rainPeriod: RainPeriod | null;
  locationLabel: string;
}

export interface ReminderItem {
  id: string;
  title: string;
}

export interface RemindersSnapshot {
  openTasks: ReminderItem[];
}

export interface CountSnapshot {
  unread: number;
}

/** Placeholder – shape will be defined when the fitness app is connected. */
export interface FitnessSnapshot {
  connected: false;
}

export interface Snapshot<T> {
  data: T;
  /** ISO timestamp the provider produced the data. */
  updatedAt: string;
  /** True when the data is built-in sample data rather than live. */
  isDemo: boolean;
}

export type SourceStatus = "loading" | "ready" | "error";

export interface SourceState<T> {
  status: SourceStatus;
  snapshot: Snapshot<T> | null;
  error?: string;
}

export interface AssistantData {
  weather: SourceState<WeatherSnapshot>;
  reminders: SourceState<RemindersSnapshot>;
  email: SourceState<CountSnapshot>;
  whatsapp: SourceState<CountSnapshot>;
}

/** Plain-values view used by briefing & intents (null = unavailable). */
export interface DataView {
  weather: WeatherSnapshot | null;
  reminders: RemindersSnapshot | null;
  email: CountSnapshot | null;
  whatsapp: CountSnapshot | null;
}

export interface Destination {
  /** Spoken key, lowercase: "home", "work", "gym" … */
  key: string;
  label: string;
  /** Address or "lat,lon". */
  query: string;
}

export interface UserSettings {
  name: string;
  /** Used for weather. `null` → default location. */
  location: { label: string; latitude: number; longitude: number } | null;
  /** Optional JSON endpoint that supplies reminders & counts. Empty → demo data. */
  bridgeUrl: string;
  voiceRate: number;
  destinations: Destination[];
}
