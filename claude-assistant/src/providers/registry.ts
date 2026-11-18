import type { CountSnapshot, RemindersSnapshot, UserSettings, WeatherSnapshot } from "@/core/types";
import { emailProvider, remindersProvider, whatsappProvider } from "./bridge";
import type { DataProvider } from "./types";
import { weatherProvider } from "./weather";

export interface ProviderSet {
  weather: DataProvider<WeatherSnapshot>;
  reminders: DataProvider<RemindersSnapshot>;
  email: DataProvider<CountSnapshot>;
  whatsapp: DataProvider<CountSnapshot>;
}

/**
 * Composition root for data. To add Gmail / Outlook / IMAP / a fitness API,
 * implement `DataProvider<…>` and return it here – nothing else changes.
 */
export function createProviders(settings: UserSettings): ProviderSet {
  return {
    weather: weatherProvider(settings.location),
    reminders: remindersProvider(settings.bridgeUrl),
    email: emailProvider(settings.bridgeUrl),
    whatsapp: whatsappProvider(settings.bridgeUrl),
  };
}
