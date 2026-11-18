import type { Destination } from "@/core/types";

export interface ResolvedDestination extends Destination {
  mapsUrl: string;
}

/**
 * Apple Maps deep link. On iPhone `maps.apple.com` URLs open the Maps app directly.
 * https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html
 */
export function buildAppleMapsUrl(query: string, mode: "d" | "w" | "r" = "d"): string {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(query)}&dirflg=${mode}`;
}

/** Gesprochene Varianten → interner Schlüssel. */
const ALIASES: Record<string, string> = {
  hause: "home", haus: "home", zuhause: "home", daheim: "home", wohnung: "home",
  arbeit: "work", büro: "work", firma: "work", arbeitsplatz: "work",
  fitnessstudio: "gym", gym: "gym",
};

export function resolveDestination(spoken: string, destinations: Destination[]): ResolvedDestination | null {
  const key = spoken.toLowerCase().replace(/^(dem|der|die|das|den|meinem|meiner|mein|meine)\s+/, "").trim();
  const wanted = ALIASES[key] ?? key;
  const match = destinations.find((d) => d.key === wanted || d.label.toLowerCase() === wanted);
  if (!match) return null;
  return { ...match, mapsUrl: buildAppleMapsUrl(match.query) };
}
