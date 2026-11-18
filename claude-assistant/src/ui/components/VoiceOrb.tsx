import type { VoiceState } from "@/voice/useVoiceAssistant";

const LABEL: Record<VoiceState, string> = {
  idle: "Tippen zum Sprechen",
  listening: "Ich höre zu",
  processing: "Ich denke nach",
  speaking: "Ich spreche",
};

export const STATE_LABEL = LABEL;

/** Das Herzstück. Alle Bewegung ist CSS, gesteuert über `data-state` (see globals.css). */
export function VoiceOrb({ state, onPress }: { state: VoiceState; onPress: () => void }) {
  
  return (
    <div className="orb" data-state={state}>
      <span className="layer halo" />
      <svg className="rings" viewBox="0 0 100 100" aria-hidden>
        <circle className="ring-static" cx="50" cy="50" r="49" />
        <circle className="ring-static" cx="50" cy="50" r="38" />
        <circle className="ring-ticks" cx="50" cy="50" r="44" />
        <circle className="ring-arc" cx="50" cy="50" r="38" />
      </svg>
      <span className="layer pulse" />
      <span className="layer pulse" />
      <span className="layer pulse" />

      <button
        type="button"
        className="core"
        onClick={onPress}
        aria-label={state === "idle" ? "Sprachbefehl starten" : state === "speaking" ? "Sprachausgabe stoppen" : LABEL[state]}
        aria-pressed={state === "listening"}
      >
        <svg className="glyph" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
        </svg>
        <span className="bars" aria-hidden>
          {Array.from({ length: 7 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
        <span className="dots" aria-hidden>
          <i /><i /><i />
        </span>
      </button>
    </div>
  );
}
