"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NAVIGATION_ENABLED } from "@/config/defaults";
import { greetingFor } from "@/core/briefing";
import { handleTranscript, type AssistantAction } from "@/core/commands";
import { useAssistantData } from "@/lib/useAssistantData";
import { useSettings } from "@/lib/useSettings";
import { useVoiceAssistant } from "@/voice/useVoiceAssistant";
import { EmailCard, FitnessCard, TasksCard, WeatherCard, WhatsappCard } from "./components/Cards";
import { Conversation } from "./components/Conversation";
import { SettingsSheet } from "./components/SettingsSheet";
import { VoiceOrb } from "./components/VoiceOrb";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

export function Assistant() {
  const { settings, update, ready } = useSettings();
  const { data, view, refresh, refreshing } = useAssistantData(settings, ready);
  const [showSettings, setShowSettings] = useState(false);
  const [greeting, setGreeting] = useState("Willkommen");

  useEffect(() => {
    setGreeting(greetingFor(new Date()));
  }, []);

  // Die Sprach-Pipeline muss immer die aktuellsten Daten/Einstellungen sehen, ohne Callbacks neu zu erzeugen.
  const live = useRef({ view, settings });
  live.current = { view, settings };

  const respond = useCallback(
    (transcript: string) =>
      handleTranscript(transcript, {
        data: live.current.view,
        settings: live.current.settings,
        navigationEnabled: NAVIGATION_ENABLED,
      }),
    [],
  );

  const onAction = useCallback((a: AssistantAction) => {
    if (a.type === "open-url") window.location.href = a.url;
  }, []);

  const voice = useVoiceAssistant({ respond, rate: settings.voiceRate, onAction });

  return (
    <main
      className="mx-auto flex w-full max-w-md flex-col px-5 sm:max-w-2xl"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}
    >
      <ServiceWorkerRegister />

      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-light uppercase tracking-wordmark">Claude</h1>
          <p className="eyebrow mt-1.5 !tracking-[0.3em]">Persönlicher KI-Assistent</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={refresh} aria-label="Daten aktualisieren" className="grid h-10 w-10 place-items-center rounded-full text-mist active:bg-white/5">
            <svg className={refreshing ? "animate-spin" : ""} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" /></svg>
          </button>
          <button onClick={() => setShowSettings(true)} aria-label="Einstellungen" className="grid h-10 w-10 place-items-center rounded-full text-mist active:bg-white/5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
          </button>
        </div>
      </header>

      <section className="mt-10 text-center">
        <h2 className="text-[30px] font-extralight leading-tight tracking-tight">
          {greeting} <span className="text-accent">{settings.name}</span>
        </h2>
      </section>

      <section className="mt-8 flex flex-col items-center">
        <VoiceOrb state={voice.state} onPress={voice.toggle} />
        <Conversation
          state={voice.state}
          transcript={voice.transcript}
          reply={voice.reply}
          error={voice.error}
          voiceSupported={voice.supported}
          onSubmit={voice.submitText}
        />
      </section>

      <div className="mt-12 grid gap-3 sm:grid-cols-2">
        <WeatherCard source={data.weather} />
        <TasksCard source={data.reminders} />
        <EmailCard source={data.email} />
        <WhatsappCard source={data.whatsapp} />
        <FitnessCard />
      </div>

      {showSettings && <SettingsSheet settings={settings} onChange={update} onClose={() => setShowSettings(false)} />}
    </main>
  );
}
