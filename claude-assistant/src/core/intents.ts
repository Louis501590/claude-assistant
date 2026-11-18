/**
 * Regelbasierte Absichtserkennung (Deutsch). Deterministisch, offline, kostenlos.
 * Eine optionale KI kann später als Fallback angeschlossen werden
 * (siehe `FallbackResolver` in commands.ts), ohne diese Datei zu ändern.
 *
 * Hinweis: Wir nutzen bewusst Wortstämme ohne \b – JavaScript behandelt
 * Umlaute in Wortgrenzen nicht als Buchstaben.
 */

export type Intent =
  | { type: "briefing" }
  | { type: "weather" }
  | { type: "tasks" }
  | { type: "email" }
  | { type: "whatsapp" }
  | { type: "navigate"; destination: string }
  | { type: "fitness" }
  | { type: "greeting" }
  | { type: "help" }
  | { type: "unknown"; transcript: string };

/** Kleinbuchstaben, ohne Satzzeichen und ohne optionales Weckwort "Claude". */
export function normalize(transcript: string): string {
  return transcript
    .toLowerCase()
    .replace(/[.,!?;:"„“]/g, " ")
    .replace(/^\s*(hey |hi |hallo |ok |okay )?claude\b[\s,]*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

const any = (t: string, ...patterns: RegExp[]) => patterns.some((p) => p.test(t));

export function parseIntent(transcript: string): Intent {
  const t = normalize(transcript);
  if (!t) return { type: "unknown", transcript };

  // Navigation zuerst: "navigiere mich nach Hause", "bring mich zur Arbeit"
  if (any(t, /navigier|navigation|\broute\b|wegbeschreibung|bring(e)? mich|fahr(e)? mich|führ(e)? mich|zeig mir den weg/)) {
    const m = t.match(/(?:^|\s)(?:nach|zu|zum|zur|ins|in die|in den)\s+(.+)$/);
    return { type: "navigate", destination: m?.[1]?.trim() || "hause" };
  }

  if (any(t, /briefing|übersicht|zusammenfassung|überblick|guten morgen|mein tag|was gibt.s neues|was steht an/))
    return { type: "briefing" };

  if (any(t, /wetter|temperatur|vorhersage|regen|schirm|grad|kalt|warm|heiß/)) return { type: "weather" };

  if (any(t, /aufgabe|erinnerung|reminder|to-?do/)) return { type: "tasks" };

  if (any(t, /whats ?app|watsap/)) return { type: "whatsapp" };

  if (any(t, /e-?mail|posteingang/)) return { type: "email" };

  if (any(t, /fitness|training|workout|schritte|sport/)) return { type: "fitness" };

  if (any(t, /hilfe|was kannst du|befehle/)) return { type: "help" };

  if (/^(hallo|hi|hey|servus|grüezi|moin|guten (tag|abend))/.test(t)) return { type: "greeting" };

  return { type: "unknown", transcript };
}
