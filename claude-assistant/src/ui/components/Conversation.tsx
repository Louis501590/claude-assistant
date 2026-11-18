"use client";

import { useState } from "react";
import type { VoiceState } from "@/voice/useVoiceAssistant";
import { STATE_LABEL } from "./VoiceOrb";

interface Props {
  state: VoiceState;
  transcript: string;
  reply: string;
  error: string | null;
  voiceSupported: boolean;
  onSubmit: (text: string) => void;
}

/** Statuszeile, Live-Transkript, gesprochene Antwort und eine Tipp-Alternative. */
export function Conversation({ state, transcript, reply, error, voiceSupported, onSubmit }: Props) {
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const showInput = typing || !voiceSupported;

  return (
    <div className="mx-auto mt-6 w-full max-w-sm px-1 text-center" aria-live="polite">
      <p className="eyebrow !text-accent">{STATE_LABEL[state]}</p>

      <div className="mt-3 min-h-[84px] space-y-2">
        {error && <p className="text-sm text-mist">{error}</p>}
        {transcript && !error && <p className="text-[15px] text-mist">„{transcript}“</p>}
        {reply && <p className="text-[17px] font-light leading-snug">{reply}</p>}
        {!transcript && !reply && !error && (
          <p className="text-sm text-mist/80">Versuche „Claude, gib mir meine Tagesübersicht“.</p>
        )}
      </div>

      {showInput ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(text);
            setText("");
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Befehl eingeben…"
            enterKeyHint="send"
            className="min-w-0 flex-1 rounded-full border border-line bg-white/[0.04] px-4 py-2.5 text-base text-white placeholder:text-mist/60 focus:border-accent/60 focus:outline-none"
          />
          <button className="rounded-full border border-accent/40 px-4 text-sm text-accent active:bg-accent/10" type="submit">
            Senden
          </button>
        </form>
      ) : (
        <button onClick={() => setTyping(true)} className="mt-2 text-xs text-mist/70 underline-offset-4 active:underline">
          Stattdessen tippen
        </button>
      )}
    </div>
  );
}
