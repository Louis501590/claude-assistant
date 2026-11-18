import { LANG } from "@/config/defaults";

/**
 * Text-to-speech via the Web Speech API (free, on-device, works offline on iOS).
 */

export const isSynthesisSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

const PREFERRED = ["Anna", "Petra", "Helena", "Markus", "Yannick", "Viktor", "Google Deutsch"];

let voiceCache: SpeechSynthesisVoice | null = null;

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (voiceCache) return voiceCache;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  if (!voices.length) return null;
  const score = (v: SpeechSynthesisVoice) => {
    const i = PREFERRED.findIndex((n) => v.name.includes(n));
    return (/premium|enhanced/i.test(v.name) ? 100 : 0) + (i >= 0 ? 50 - i : 0) + (v.lang === lang ? 5 : 0);
  };
  voiceCache = [...voices].sort((a, b) => score(b) - score(a))[0];
  return voiceCache;
}

/**
 * iOS only allows speech that was triggered (directly or indirectly) by a user
 * gesture. Call this synchronously inside the tap handler to unlock audio for
 * the asynchronous answer that follows.
 */
export function unlockSpeech() {
  if (!isSynthesisSupported()) return;
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

/** Split into sentence-sized chunks (avoids engine cut-offs on long text). */
export function chunk(text: string): string[] {
  return text.match(/[^.!?:\n]+[.!?:]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  onStart?: () => void;
  onEnd: () => void;
}

export function speak(text: string, opts: SpeakOptions): () => void {
  if (!isSynthesisSupported()) {
    opts.onEnd();
    return () => {};
  }
  const synth = window.speechSynthesis;
  const lang = opts.lang ?? LANG;
  synth.cancel();

  const parts = chunk(text);
  let cancelled = false;
  let finished = false;
  let watchdog: ReturnType<typeof setTimeout> | undefined;

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(watchdog);
    opts.onEnd();
  };

  // iOS occasionally never fires `end`. Fall back to an estimate (~14 chars/s).
  const estimate = (text.length / (14 * (opts.rate ?? 1))) * 1000 + 4000;
  watchdog = setTimeout(finish, estimate);

  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = lang;
    u.rate = opts.rate ?? 1;
    u.pitch = 1;
    const v = pickVoice(lang);
    if (v) u.voice = v;
    if (i === 0) u.onstart = () => opts.onStart?.();
    if (i === parts.length - 1) {
      u.onend = finish;
      u.onerror = finish;
    }
    synth.speak(u);
  });

  return () => {
    if (cancelled) return;
    cancelled = true;
    synth.cancel();
    finish();
  };
}

if (typeof window !== "undefined" && isSynthesisSupported()) {
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    voiceCache = null;
  });
}
