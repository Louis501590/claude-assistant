import { LANG } from "@/config/defaults";

/**
 * Thin wrapper over the Web Speech API (SpeechRecognition).
 * Safari on iPhone exposes it as `webkitSpeechRecognition`.
 */

interface SRAlternative { transcript: string }
interface SRResult { isFinal: boolean; 0: SRAlternative }
interface SREvent { resultIndex: number; results: ArrayLike<SRResult> }
interface SRErrorEvent { error: string }
interface SRInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SRConstructor = new () => SRInstance;

function ctor(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const isRecognitionSupported = () => ctor() !== null;

export type RecognitionError = "denied" | "no-speech" | "no-mic" | "network" | "unsupported" | "unknown";

export interface ListenOptions {
  lang?: string;
  onInterim?: (text: string) => void;
  /** Called exactly once with the final text, or never if nothing was heard. */
  onFinal: (text: string) => void;
  onError: (e: RecognitionError) => void;
  /** Always called last, once. */
  onEnd: () => void;
}

export interface ListenHandle {
  /** Stop listening and deliver what was heard so far. */
  stop(): void;
  /** Stop and discard. */
  abort(): void;
}

const mapError = (code: string): RecognitionError => {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "denied";
    case "no-speech":
      return "no-speech";
    case "audio-capture":
      return "no-mic";
    case "network":
      return "network";
    default:
      return "unknown";
  }
};

export function startListening(opts: ListenOptions): ListenHandle {
  const C = ctor();
  if (!C) {
    queueMicrotask(() => {
      opts.onError("unsupported");
      opts.onEnd();
    });
    return { stop() {}, abort() {} };
  }

  const rec = new C();
  rec.lang = opts.lang ?? LANG;
  rec.continuous = false;
  rec.interimResults = true;

  let heard = "";
  let delivered = false;
  let aborted = false;
  let failed = false;

  const deliver = () => {
    if (delivered || aborted || failed) return;
    delivered = true;
    if (heard.trim()) opts.onFinal(heard.trim());
  };

  rec.onresult = (e) => {
    let text = "";
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
    heard = text;
    opts.onInterim?.(text);
    if (e.results[e.results.length - 1].isFinal) deliver();
  };
  rec.onerror = (e) => {
    if (e.error === "aborted") return;
    failed = true;
    opts.onError(mapError(e.error));
  };
  rec.onend = () => {
    deliver();
    opts.onEnd();
  };

  try {
    rec.start();
  } catch {
    failed = true;
    opts.onError("unknown");
    opts.onEnd();
  }

  return {
    stop: () => rec.stop(),
    abort: () => {
      aborted = true;
      rec.abort();
    },
  };
}
