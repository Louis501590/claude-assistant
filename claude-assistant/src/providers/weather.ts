import { DEFAULT_LOCATION } from "@/config/defaults";
import type { RainPeriod, Snapshot, UserSettings, WeatherSnapshot } from "@/core/types";
import type { DataProvider } from "./types";

/**
 * Open-Meteo: free, no API key, CORS-enabled → works straight from the browser
 * with no backend. https://open-meteo.com
 */

const WMO: Record<number, string> = {
  0: "Klarer Himmel", 1: "Überwiegend klar", 2: "Teils bewölkt", 3: "Bedeckt",
  45: "Nebel", 48: "Nebel",
  51: "Leichter Nieselregen", 53: "Nieselregen", 55: "Starker Nieselregen", 56: "Gefrierender Nieselregen", 57: "Gefrierender Nieselregen",
  61: "Leichter Regen", 63: "Regen", 65: "Starker Regen", 66: "Gefrierender Regen", 67: "Gefrierender Regen",
  71: "Leichter Schneefall", 73: "Schneefall", 75: "Starker Schneefall", 77: "Schneegriesel",
  80: "Regenschauer", 81: "Regenschauer", 82: "Starke Schauer",
  85: "Schneeschauer", 86: "Schneeschauer",
  95: "Gewitter", 96: "Gewitter mit Hagel", 99: "Gewitter mit Hagel",
};

interface OpenMeteoResponse {
  current: { temperature_2m: number; weather_code: number };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
  hourly: { time: string[]; precipitation_probability: number[] };
}

const periodOf = (hour: number): RainPeriod =>
  hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : hour < 22 ? "evening" : "night";

/** Daypart with the highest rain probability (for today only). Pure → unit-testable. */
export function peakRainPeriod(times: string[], probs: number[], today: string, threshold = 40): RainPeriod | null {
  let bestP = -1;
  let best: RainPeriod | null = null;
  times.forEach((t, i) => {
    if (!t.startsWith(today)) return;
    const p = probs[i] ?? 0;
    if (p >= threshold && p > bestP) {
      bestP = p;
      best = periodOf(Number(t.slice(11, 13)));
    }
  });
  return best;
}

export function weatherProvider(location: UserSettings["location"]): DataProvider<WeatherSnapshot> {
  const loc = location ?? DEFAULT_LOCATION;
  return {
    id: "open-meteo",
    label: "Open-Meteo",
    async fetch(signal): Promise<Snapshot<WeatherSnapshot>> {
      const url =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${loc.latitude}&longitude=${loc.longitude}` +
        "&current=temperature_2m,weather_code" +
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
        "&hourly=precipitation_probability&forecast_days=1&timezone=auto";
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`Weather service returned ${res.status}`);
      const j = (await res.json()) as OpenMeteoResponse;
      const today = j.hourly.time[0]?.slice(0, 10) ?? "";
      return {
        isDemo: false,
        updatedAt: new Date().toISOString(),
        data: {
          temperatureC: j.current.temperature_2m,
          highC: j.daily.temperature_2m_max[0],
          lowC: j.daily.temperature_2m_min[0],
          rainChance: j.daily.precipitation_probability_max[0] ?? 0,
          condition: WMO[j.current.weather_code] ?? "Unbekannt",
          rainPeriod: peakRainPeriod(j.hourly.time, j.hourly.precipitation_probability, today),
          locationLabel: loc.label,
        },
      };
    },
  };
}

/** Geocoding for the settings screen (also free, no key). */
export async function searchPlace(query: string, signal?: AbortSignal) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=de`,
    { signal },
  );
  if (!res.ok) throw new Error("Place search failed");
  const j = (await res.json()) as { results?: { name: string; latitude: number; longitude: number }[] };
  const r = j.results?.[0];
  return r ? { label: r.name, latitude: r.latitude, longitude: r.longitude } : null;
}
