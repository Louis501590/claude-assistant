import type { DataView, RainPeriod } from "./types";

/** "Guten Morgen" / "Guten Tag" / "Guten Abend" */
export function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return "Guten Abend";
  if (h < 12) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const round = (n: number) => Math.round(n);

const PERIOD: Record<RainPeriod, string> = {
  morning: "Am Vormittag",
  afternoon: "Am Nachmittag",
  evening: "Am Abend",
  night: "In der Nacht",
};

export function describeWeather(w: NonNullable<DataView["weather"]>): string {
  return [
    `Die aktuelle Temperatur beträgt ${round(w.temperatureC)} Grad.`,
    `Das Tageshoch liegt bei ${round(w.highC)} Grad, das Tief bei ${round(w.lowC)} Grad.`,
    describeRain(w),
  ].join(" ");
}

export function describeRain(w: NonNullable<DataView["weather"]>): string {
  if (w.rainChance >= 50) {
    return w.rainPeriod
      ? `${PERIOD[w.rainPeriod]} wird Regen erwartet, mit einer Wahrscheinlichkeit von ${w.rainChance} Prozent.`
      : `Es wird mit Regen gerechnet, die Wahrscheinlichkeit beträgt ${w.rainChance} Prozent.`;
  }
  if (w.rainChance >= 20) return `Die Regenwahrscheinlichkeit beträgt ${w.rainChance} Prozent.`;
  return "Es wird kein Regen erwartet.";
}

export function describeTasks(r: NonNullable<DataView["reminders"]>): string {
  const n = r.openTasks.length;
  if (n === 0) return "Du hast keine offenen Aufgaben in der Apple-Erinnerungen-App. Gut gemacht.";
  const list = r.openTasks.map((t) => t.title).join(", ");
  return `In der Apple-Erinnerungen-App hast du aktuell ${n} offene ${plural(n, "Aufgabe", "Aufgaben")}: ${list}.`;
}

const emailPhrase = (n: number) => (n === 0 ? "keine ungelesenen E-Mails" : `${n} ungelesene ${plural(n, "E-Mail", "E-Mails")}`);
const whatsappPhrase = (n: number) =>
  n === 0 ? "keine WhatsApp-Benachrichtigungen" : `${n} WhatsApp-${plural(n, "Benachrichtigung", "Benachrichtigungen")}`;

export function describeEmail(e: NonNullable<DataView["email"]>): string {
  if (e.unread === 0) return "Dein Posteingang ist leer. Du hast keine ungelesenen E-Mails.";
  return `Du hast ${emailPhrase(e.unread)}.`;
}

export function describeWhatsapp(w: NonNullable<DataView["whatsapp"]>): string {
  return `Du hast ${whatsappPhrase(w.unread)}.`;
}

/**
 * Vorlagenbasierte Tagesübersicht. Keine KI – sie entsteht ausschließlich aus
 * den gerade verfügbaren Daten; fehlende Quellen werden übersprungen.
 */
export function buildBriefing(data: DataView, name: string, now: Date = new Date()): string {
  const lines: string[] = [`${greetingFor(now)} ${name}.`];

  if (data.weather) lines.push(describeWeather(data.weather));
  if (data.reminders) lines.push(describeTasks(data.reminders));

  const inbox: string[] = [];
  if (data.email) inbox.push(emailPhrase(data.email.unread));
  if (data.whatsapp) inbox.push(whatsappPhrase(data.whatsapp.unread));
  if (inbox.length) lines.push(`Zusätzlich hast du ${inbox.join(" und ")}.`);

  if (lines.length === 1) lines.push("Ich kann gerade keine Daten laden. Bitte prüfe deine Verbindung.");
  return lines.join(" ");
}
