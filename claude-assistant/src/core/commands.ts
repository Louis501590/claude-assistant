import { buildBriefing, describeEmail, describeTasks, describeWeather, describeWhatsapp, greetingFor } from "./briefing";
import { parseIntent, type Intent } from "./intents";
import type { DataView, UserSettings } from "./types";
import { resolveDestination } from "@/integrations/navigation/navigation";

/** Aktionen, die die UI nach der Antwort ausführen darf. Hält dieses Modul rein. */
export type AssistantAction = { type: "open-url"; url: string };

export interface AssistantReply {
  intent: Intent;
  speech: string;
  action?: AssistantAction;
}

export interface CommandContext {
  data: DataView;
  settings: Pick<UserSettings, "name" | "destinations">;
  now?: Date;
  /** Feature-Flag: Navigation ist fertig angelegt, aber standardmäßig aus. */
  navigationEnabled: boolean;
}

/**
 * Einstieg für optionale KI: bekommt nur Sätze, die die Regeln nicht verstehen.
 * `null` zurückgeben → normale "nicht verstanden"-Antwort.
 */
export type FallbackResolver = (transcript: string, ctx: CommandContext) => Promise<string | null>;

const unavailable = (what: string) => `Ich komme gerade nicht an ${what} heran. Bitte versuche es gleich noch einmal.`;

export function respondTo(intent: Intent, ctx: CommandContext): AssistantReply {
  const { data, settings } = ctx;
  const now = ctx.now ?? new Date();
  const reply = (speech: string, action?: AssistantAction): AssistantReply => ({ intent, speech, action });

  switch (intent.type) {
    case "briefing":
      return reply(buildBriefing(data, settings.name, now));
    case "weather":
      return reply(data.weather ? describeWeather(data.weather) : unavailable("die Wetterdaten"));
    case "tasks":
      return reply(data.reminders ? describeTasks(data.reminders) : unavailable("deine Erinnerungen"));
    case "email":
      return reply(data.email ? describeEmail(data.email) : unavailable("deine E-Mails"));
    case "whatsapp":
      return reply(data.whatsapp ? describeWhatsapp(data.whatsapp) : unavailable("deine WhatsApp-Benachrichtigungen"));
    case "fitness":
      return reply("Die Fitness-Integration kommt bald. Sobald sie verbunden ist, kann ich dir von deinen Workouts erzählen.");
    case "greeting":
      return reply(`${greetingFor(now)} ${settings.name}. Wie kann ich helfen?`);
    case "help":
      return reply(
        "Du kannst nach deiner Tagesübersicht, dem Wetter, deinen offenen Aufgaben, deinen ungelesenen E-Mails oder deinen WhatsApp-Benachrichtigungen fragen.",
      );
    case "navigate": {
      const dest = resolveDestination(intent.destination, settings.destinations);
      if (!dest) return reply(`Ein Ziel namens ${intent.destination} kenne ich noch nicht.`);
      if (!ctx.navigationEnabled)
        return reply(`Die Navigation nach ${dest.label} ist vorbereitet, aber noch nicht aktiviert. Sie steht auf der Roadmap.`);
      return reply(`Starte die Navigation nach ${dest.label}.`, { type: "open-url", url: dest.mapsUrl });
    }
    case "unknown":
      return reply("Entschuldigung, das habe ich nicht verstanden. Frag zum Beispiel nach deiner Tagesübersicht, oder sage Hilfe.");
  }
}

export async function handleTranscript(
  transcript: string,
  ctx: CommandContext,
  fallback?: FallbackResolver,
): Promise<AssistantReply> {
  const intent = parseIntent(transcript);
  if (intent.type === "unknown" && fallback) {
    const aiAnswer = await fallback(transcript, ctx).catch(() => null);
    if (aiAnswer) return { intent, speech: aiAnswer };
  }
  return respondTo(intent, ctx);
}
