import type { CountSnapshot, RemindersSnapshot, Snapshot } from "@/core/types";
import type { DataProvider } from "./types";
import { demoEmail, demoReminders, demoWhatsapp } from "./demo";

/**
 * "Bridge" = one tiny JSON document that something *you own* keeps up to date
 * (typically an iOS Shortcut running automatically, see docs/IOS_SHORTCUT.md).
 * A browser cannot read Apple Reminders or WhatsApp directly, so iOS has to hand
 * the numbers over. Any URL that serves this JSON works.
 *
 *   { "reminders": ["Finish OnePager", "Call Customer"],
 *     "emailUnread": 14,
 *     "whatsappUnread": 7,
 *     "updatedAt": "2026-11-18T07:30:00Z" }
 */
export interface BridgePayload {
  reminders?: string[];
  emailUnread?: number;
  whatsappUnread?: number;
  updatedAt?: string;
}

const titleOf = (r: unknown): string =>
  typeof r === "string" ? r : typeof r === "object" && r && typeof (r as { title?: unknown }).title === "string" ? (r as { title: string }).title : "";

/** Validates & normalises untrusted JSON. Exported for tests. */
export function parseBridge(raw: unknown): BridgePayload {
  if (typeof raw !== "object" || raw === null) throw new Error("Bridge response is not an object");
  const o = raw as Record<string, unknown>;
  const count = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : undefined);
  return {
    reminders: Array.isArray(o.reminders) ? o.reminders.map(titleOf).map((s) => s.trim()).filter(Boolean) : undefined,
    emailUnread: count(o.emailUnread),
    whatsappUnread: count(o.whatsappUnread),
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
  };
}

/** One shared in-flight request so three providers cause one network call. */
const inflight = new Map<string, Promise<BridgePayload>>();

function loadBridge(url: string): Promise<BridgePayload> {
  const existing = inflight.get(url);
  if (existing) return existing;
  const p = fetch(url, { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(`Bridge returned ${r.status}`);
      return r.json();
    })
    .then(parseBridge)
    .finally(() => setTimeout(() => inflight.delete(url), 1000));
  inflight.set(url, p);
  return p;
}

const snap = <T>(data: T, p: BridgePayload): Snapshot<T> => ({
  data,
  isDemo: false,
  updatedAt: p.updatedAt ?? new Date().toISOString(),
});

export function remindersProvider(bridgeUrl: string): DataProvider<RemindersSnapshot> {
  return {
    id: bridgeUrl ? "bridge-reminders" : "demo-reminders",
    label: "Apple Reminders",
    async fetch() {
      if (!bridgeUrl) return demoReminders();
      const p = await loadBridge(bridgeUrl);
      if (!p.reminders) throw new Error("Bridge has no reminders");
      return snap({ openTasks: p.reminders.map((title, i) => ({ id: String(i), title })) }, p);
    },
  };
}

function countProvider(
  id: string,
  label: string,
  bridgeUrl: string,
  demo: () => Snapshot<CountSnapshot>,
  pick: (p: BridgePayload) => number | undefined,
): DataProvider<CountSnapshot> {
  return {
    id: bridgeUrl ? `bridge-${id}` : `demo-${id}`,
    label,
    async fetch() {
      if (!bridgeUrl) return demo();
      const p = await loadBridge(bridgeUrl);
      const n = pick(p);
      if (n === undefined) throw new Error(`Bridge has no ${label} count`);
      return snap({ unread: n }, p);
    },
  };
}

export const emailProvider = (url: string) => countProvider("email", "Email", url, demoEmail, (p) => p.emailUnread);
export const whatsappProvider = (url: string) => countProvider("whatsapp", "WhatsApp", url, demoWhatsapp, (p) => p.whatsappUnread);
