import type { CountSnapshot, RemindersSnapshot, Snapshot } from "@/core/types";

/** Beispieldaten, damit die App schon vor jeder Einrichtung voll nutzbar ist. */
const stamp = <T>(data: T): Snapshot<T> => ({ data, updatedAt: new Date().toISOString(), isDemo: true });

export const demoReminders = (): Snapshot<RemindersSnapshot> =>
  stamp({
    openTasks: [
      { id: "1", title: "OnePager fertigstellen" },
      { id: "2", title: "Kunden anrufen" },
      { id: "3", title: "Arzttermin vereinbaren" },
      { id: "4", title: "Workout dokumentieren" },
    ],
  });

export const demoEmail = (): Snapshot<CountSnapshot> => stamp({ unread: 14 });
export const demoWhatsapp = (): Snapshot<CountSnapshot> => stamp({ unread: 7 });
