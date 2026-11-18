import { describe, expect, it } from "vitest";
import { buildBriefing, greetingFor } from "@/core/briefing";
import { handleTranscript, type CommandContext } from "@/core/commands";
import { normalize, parseIntent } from "@/core/intents";
import { buildAppleMapsUrl } from "@/integrations/navigation/navigation";
import { parseBridge } from "@/providers/bridge";
import { peakRainPeriod } from "@/providers/weather";
import type { DataView } from "@/core/types";

const data: DataView = {
  weather: { temperatureC: 12.2, highC: 18, lowC: 8, rainChance: 60, condition: "Rain", rainPeriod: "afternoon", locationLabel: "X" },
  reminders: { openTasks: [{ id: "1", title: "Finish OnePager" }, { id: "2", title: "Call Customer" }] },
  email: { unread: 14 },
  whatsapp: { unread: 7 },
};
const ctx = (over: Partial<CommandContext> = {}): CommandContext => ({
  data,
  settings: { name: "Louis", destinations: [{ key: "home", label: "Zuhause", query: "Bahnhofstrasse 1, Zürich" }] },
  navigationEnabled: false,
  now: new Date("2026-11-18T08:00:00"),
  ...over,
});

describe("intents", () => {
  it.each([
    ["Claude, gib mir meine Tagesübersicht", "briefing"],
    ["Claude, wie ist das Wetter heute", "weather"],
    ["Claude, welche offenen Aufgaben habe ich in der Apple Erinnerungen App", "tasks"],
    ["Claude, wie viele ungelesene E-Mails habe ich", "email"],
    ["wie viele WhatsApp Benachrichtigungen habe ich", "whatsapp"],
    ["Claude, navigiere mich nach Hause", "navigate"],
    ["Hey Claude, hallo", "greeting"],
    ["blorp", "unknown"],
  ])("%s → %s", (text, type) => expect(parseIntent(text).type).toBe(type));

  it("extracts the navigation destination", () => {
    expect(parseIntent("Claude, navigiere mich nach Hause")).toEqual({ type: "navigate", destination: "hause" });
    expect(parseIntent("bring mich zur Arbeit")).toEqual({ type: "navigate", destination: "arbeit" });
  });
  it("strips the wake word", () => expect(normalize("Hey Claude, Wetter!")).toBe("wetter"));
});

describe("briefing", () => {
  it("builds from all data", () => {
    const b = buildBriefing(data, "Louis", new Date("2026-11-18T08:00:00"));
    expect(b).toContain("Guten Morgen Louis.");
    expect(b).toContain("aktuelle Temperatur beträgt 12 Grad");
    expect(b).toContain("Am Nachmittag wird Regen erwartet");
    expect(b).toContain("Finish OnePager, Call Customer");
    expect(b).toContain("14 ungelesene E-Mails und 7 WhatsApp-Benachrichtigungen");
  });
  it("degrades gracefully with partial data", () => {
    const b = buildBriefing({ ...data, weather: null, reminders: null }, "Louis");
    expect(b).not.toContain("Temperatur");
    expect(b).toContain("14 ungelesene E-Mails");
  });
  it("handles no data", () => expect(buildBriefing({ weather: null, reminders: null, email: null, whatsapp: null }, "Louis")).toContain("keine Daten laden"));
  it("singular forms", () => expect(buildBriefing({ ...data, email: { unread: 1 } }, "L")).toContain("1 ungelesene E-Mail "));
  it("greets by time", () => {
    expect(greetingFor(new Date("2026-01-01T09:00"))).toBe("Guten Morgen");
    expect(greetingFor(new Date("2026-01-01T15:00"))).toBe("Guten Tag");
    expect(greetingFor(new Date("2026-01-01T20:00"))).toBe("Guten Abend");
  });
});

describe("commands", () => {
  it("answers without AI", async () => {
    const r = await handleTranscript("wie viele ungelesene E-Mails", ctx());
    expect(r.speech).toBe("Du hast 14 ungelesene E-Mails.");
  });
  it("navigation is gated by the feature flag", async () => {
    expect((await handleTranscript("navigiere mich nach Hause", ctx())).action).toBeUndefined();
    const on = await handleTranscript("navigiere mich nach Hause", ctx({ navigationEnabled: true }));
    expect(on.action).toEqual({ type: "open-url", url: buildAppleMapsUrl("Bahnhofstrasse 1, Zürich") });
  });
  it("unknown destination", async () => expect((await handleTranscript("navigiere mich nach mars", ctx())).speech).toContain("mars"));
  it("uses optional AI fallback only for unknown input", async () => {
    const fb = async () => "AI says hi";
    expect((await handleTranscript("blorp", ctx(), fb)).speech).toBe("AI says hi");
    expect((await handleTranscript("Wetter", ctx(), fb)).speech).not.toBe("AI says hi");
  });
});

describe("providers", () => {
  it("parseBridge sanitises input", () => {
    expect(parseBridge({ reminders: ["A", { title: " B " }, 5, ""], emailUnread: 3.7, whatsappUnread: -1 })).toMatchObject({
      reminders: ["A", "B"], emailUnread: 3, whatsappUnread: undefined,
    });
    expect(() => parseBridge("nope")).toThrow();
  });
  it("peakRainPeriod", () => {
    const times = ["2026-11-18T09:00", "2026-11-18T14:00", "2026-11-18T20:00"];
    expect(peakRainPeriod(times, [10, 80, 50], "2026-11-18")).toBe("afternoon");
    expect(peakRainPeriod(times, [10, 20, 30], "2026-11-18")).toBeNull();
  });
});
