"use client";

import { useState } from "react";
import type { UserSettings } from "@/core/types";
import { searchPlace } from "@/providers/weather";

interface Props {
  settings: UserSettings;
  onChange: (patch: Partial<UserSettings>) => void;
  onClose: () => void;
}

const field =
  "w-full rounded-2xl border border-line bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-mist/50 focus:border-accent/60 focus:outline-none";

const addressOf = (s: UserSettings, key: string) => s.destinations.find((d) => d.key === key)?.query ?? "";

export function SettingsSheet({ settings, onChange, onClose }: Props) {
  const [place, setPlace] = useState(settings.location?.label ?? "");
  const [placeMsg, setPlaceMsg] = useState("");

  const setAddress = (key: "home" | "work", label: string, query: string) => {
    const others = settings.destinations.filter((d) => d.key !== key);
    onChange({ destinations: query.trim() ? [...others, { key, label, query }] : others });
  };

  const findPlace = async () => {
    if (!place.trim()) return;
    setPlaceMsg("Suche…");
    try {
      const r = await searchPlace(place.trim());
      if (r) {
        onChange({ location: r });
        setPlace(r.label);
        setPlaceMsg(`Wetterstandort gesetzt: ${r.label}.`);
      } else setPlaceMsg("Nichts gefunden.");
    } catch {
      setPlaceMsg("Suche fehlgeschlagen. Prüfe deine Verbindung.");
    }
  };

  const useGps = () => {
    setPlaceMsg("Standort wird ermittelt…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        onChange({ location: { label: "Aktueller Standort", latitude: p.coords.latitude, longitude: p.coords.longitude } });
        setPlace("Aktueller Standort");
        setPlaceMsg("Aktueller Standort wird verwendet.");
      },
      () => setPlaceMsg("Standortzugriff verweigert."),
      { timeout: 10000 },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal aria-label="Einstellungen">
      <div
        className="sheet mx-auto max-h-[88svh] w-full max-w-md overflow-y-auto rounded-t-[32px] border border-line bg-[#080d22] p-6"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-light tracking-wide">Einstellungen</h2>
          <button onClick={onClose} className="rounded-full border border-line px-4 py-1.5 text-sm text-accent">Fertig</button>
        </div>

        <div className="space-y-6">
          <label className="block">
            <span className="eyebrow mb-2 block">Name</span>
            <input className={field} value={settings.name} onChange={(e) => onChange({ name: e.target.value })} />
          </label>

          <div>
            <span className="eyebrow mb-2 block">Wetterstandort</span>
            <div className="flex gap-2">
              <input className={field} value={place} placeholder="Stadt" onChange={(e) => setPlace(e.target.value)} onKeyDown={(e) => e.key === "Enter" && findPlace()} />
              <button onClick={findPlace} className="rounded-2xl border border-accent/40 px-4 text-sm text-accent">Setzen</button>
            </div>
            <button onClick={useGps} className="mt-2 text-xs text-mist underline underline-offset-4">Meinen aktuellen Standort verwenden</button>
            {placeMsg && <p className="mt-2 text-xs text-mist">{placeMsg}</p>}
          </div>

          <label className="block">
            <span className="eyebrow mb-2 block">Daten-Bridge-URL</span>
            <input className={field} inputMode="url" autoCapitalize="off" autoCorrect="off" placeholder="https://… (leer = Demodaten)" value={settings.bridgeUrl} onChange={(e) => onChange({ bridgeUrl: e.target.value.trim() })} />
            <span className="mt-2 block text-xs text-mist">Liefert Erinnerungen sowie E-Mail- und WhatsApp-Anzahl. Siehe docs/IOS_SHORTCUT.md.</span>
          </label>

          <div>
            <span className="eyebrow mb-2 block">Navigationsziele</span>
            <div className="space-y-2">
              <input className={field} placeholder="Adresse Zuhause" value={addressOf(settings, "home")} onChange={(e) => setAddress("home", "Zuhause", e.target.value)} />
              <input className={field} placeholder="Adresse Arbeit" value={addressOf(settings, "work")} onChange={(e) => setAddress("work", "Arbeit", e.target.value)} />
            </div>
            <span className="mt-2 block text-xs text-mist">Gespeichert für die kommende Apple-Karten-Integration.</span>
          </div>

          <label className="block">
            <span className="eyebrow mb-2 block">Sprechtempo · {settings.voiceRate.toFixed(2)}×</span>
            <input type="range" min={0.8} max={1.3} step={0.05} value={settings.voiceRate} onChange={(e) => onChange({ voiceRate: Number(e.target.value) })} className="w-full accent-[#00D4FF]" />
          </label>
        </div>
      </div>
    </div>
  );
}
