"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { REFRESH_INTERVAL_MS } from "@/config/defaults";
import type { AssistantData, DataView, SourceState, UserSettings } from "@/core/types";
import { createProviders } from "@/providers/registry";

const loading = <T,>(): SourceState<T> => ({ status: "loading", snapshot: null });

/**
 * Loads every provider independently (one failing source never blocks the rest),
 * keeps the last good value on refresh errors, and refreshes when the app comes
 * back to the foreground.
 */
export function useAssistantData(settings: UserSettings, enabled: boolean) {
  const [data, setData] = useState<AssistantData>({
    weather: loading(),
    reminders: loading(),
    email: loading(),
    whatsapp: loading(),
  });
  const [refreshing, setRefreshing] = useState(false);

  const providers = useMemo(
    () => createProviders(settings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.location, settings.bridgeUrl],
  );
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRefreshing(true);

    const keys = Object.keys(providers) as (keyof typeof providers)[];
    await Promise.all(
      keys.map(async (key) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const snapshot = await (providers[key] as any).fetch(ctrl.signal);
          if (ctrl.signal.aborted) return;
          setData((d) => ({ ...d, [key]: { status: "ready", snapshot } }));
        } catch (e) {
          if (ctrl.signal.aborted) return;
          const error = e instanceof Error ? e.message : "Unknown error";
          setData((d) => ({ ...d, [key]: { status: "error", snapshot: d[key].snapshot, error } }));
        }
      }),
    );
    if (!ctrl.signal.aborted) setRefreshing(false);
  }, [providers]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    const onVisible = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      abortRef.current?.abort();
    };
  }, [enabled, refresh]);

  /** Plain values for the assistant brain. Stale data beats no data. */
  const view: DataView = useMemo(
    () => ({
      weather: data.weather.snapshot?.data ?? null,
      reminders: data.reminders.snapshot?.data ?? null,
      email: data.email.snapshot?.data ?? null,
      whatsapp: data.whatsapp.snapshot?.data ?? null,
    }),
    [data],
  );

  return { data, view, refresh, refreshing };
}
