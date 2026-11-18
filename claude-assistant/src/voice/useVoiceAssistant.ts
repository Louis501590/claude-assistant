"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AssistantReply } from "@/core/commands";
import { isRecognitionSupported, startListening, type ListenHandle, type RecognitionError } from "./recognition";
import { speak, unlockSpeech } from "./synthesis";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

const ERROR_TEXT: Record<RecognitionError, string> = {
  denied: "Der Mikrofonzugriff ist blockiert. Aktiviere ihn unter Einstellungen › Safari › Mikrofon, oder tippe deine Anfrage.",
  "no-speech": "Ich habe nichts gehört. Tippe und versuche es noch einmal.",
  "no-mic": "Kein Mikrofon gefunden.",
  network: "Die Spracherkennung braucht eine Internetverbindung.",
  unsupported: "Spracheingabe ist in diesem Browser nicht verfügbar. Du kannst stattdessen tippen.",
  unknown: "Bei der Spracheingabe ist etwas schiefgelaufen. Bitte versuche es erneut.",
};

interface Options {
  /** Turns a transcript into an answer. Injected so this hook knows nothing about intents. */
  respond: (transcript: string) => Promise<AssistantReply>;
  rate: number;
  onAction?: (action: NonNullable<AssistantReply["action"]>) => void;
}

/** Minimum "thinking" time so the processing state never flickers. */
const MIN_THINK_MS = 500;

export function useVoiceAssistant({ respond, rate, onAction }: Options) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const listenRef = useRef<ListenHandle | null>(null);
  const cancelSpeechRef = useRef<(() => void) | null>(null);
  const runRef = useRef(0); // invalidates in-flight work when the user interrupts
  const latest = useRef({ respond, rate, onAction });
  latest.current = { respond, rate, onAction };

  useEffect(() => setSupported(isRecognitionSupported()), []);

  const run = useCallback(async (text: string) => {
    const id = ++runRef.current;
    setTranscript(text);
    setReply("");
    setError(null);
    setState("processing");
    try {
      const [answer] = await Promise.all([latest.current.respond(text), new Promise((r) => setTimeout(r, MIN_THINK_MS))]);
      if (id !== runRef.current) return;
      setReply(answer.speech);
      setState("speaking");
      cancelSpeechRef.current = speak(answer.speech, {
        rate: latest.current.rate,
        onEnd: () => {
          if (id !== runRef.current) return;
          cancelSpeechRef.current = null;
          setState("idle");
          if (answer.action) latest.current.onAction?.(answer.action);
        },
      });
    } catch {
      if (id !== runRef.current) return;
      setError("Beim Vorbereiten der Antwort ist etwas schiefgelaufen.");
      setState("idle");
    }
  }, []);

  /** Primary interaction: one button that does the right thing for the current state. */
  const toggle = useCallback(() => {
    switch (state) {
      case "idle": {
        unlockSpeech(); // must happen inside the gesture
        setError(null);
        setTranscript("");
        setReply("");
        setState("listening");
        const id = ++runRef.current;
        listenRef.current = startListening({
          onInterim: setTranscript,
          onFinal: (t) => run(t),
          onError: (e) => {
            if (id !== runRef.current) return;
            setError(ERROR_TEXT[e]);
            setState("idle");
          },
          onEnd: () => {
            listenRef.current = null;
            // Ended without a result or error → return to idle.
            setState((s) => (s === "listening" ? "idle" : s));
          },
        });
        break;
      }
      case "listening":
        listenRef.current?.stop();
        break;
      case "speaking":
        runRef.current++;
        cancelSpeechRef.current?.();
        cancelSpeechRef.current = null;
        setState("idle");
        break;
      case "processing":
        break;
    }
  }, [state, run]);

  /** Typed input (fallback when speech recognition is unavailable). */
  const submitText = useCallback(
    (text: string) => {
      if (!text.trim() || state === "processing") return;
      unlockSpeech();
      cancelSpeechRef.current?.();
      void run(text.trim());
    },
    [run, state],
  );

  useEffect(
    () => () => {
      runRef.current++;
      listenRef.current?.abort();
      cancelSpeechRef.current?.();
    },
    [],
  );

  return { state, transcript, reply, error, supported, toggle, submitText };
}
