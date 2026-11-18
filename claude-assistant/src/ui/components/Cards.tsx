import type { AssistantData } from "@/core/types";
import { Card, Gate, iconProps } from "./Card";

const Big = ({ children, unit }: { children: React.ReactNode; unit?: string }) => (
  <span className="text-[52px] font-extralight leading-none tracking-tight">
    {children}
    {unit && <span className="ml-0.5 align-top text-2xl text-mist">{unit}</span>}
  </span>
);

export function WeatherCard({ source }: { source: AssistantData["weather"] }) {
  return (
    <Card
      title="Wetter"
      delay={80}
      demo={source.snapshot?.isDemo}
      icon={<svg {...iconProps}><path d="M7 18a4 4 0 1 1 .6-7.96A5.5 5.5 0 0 1 18 11a3.5 3.5 0 0 1-.5 7H7z" /></svg>}
    >
      <Gate source={source}>
        {(w) => (
          <div className="flex items-end justify-between gap-4">
            <div>
              <Big unit="°C">{Math.round(w.temperatureC)}</Big>
              <p className="mt-2 text-sm text-mist">{w.condition}</p>
            </div>
            <dl className="space-y-1 text-right text-sm">
              <div className="flex justify-end gap-2"><dt className="text-mist">Hoch</dt><dd>{Math.round(w.highC)}°C</dd></div>
              <div className="flex justify-end gap-2"><dt className="text-mist">Tief</dt><dd>{Math.round(w.lowC)}°C</dd></div>
              <div className="flex justify-end gap-2"><dt className="text-mist">Regen</dt><dd className="text-accent">{w.rainChance}%</dd></div>
            </dl>
          </div>
        )}
      </Gate>
    </Card>
  );
}

export function TasksCard({ source }: { source: AssistantData["reminders"] }) {
  return (
    <Card
      title="Offene Aufgaben"
      delay={140}
      className="sm:col-span-2"
      demo={source.snapshot?.isDemo}
      icon={<svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.2 2.4 2.4 4.6-5" /></svg>}
    >
      <Gate source={source}>
        {(r) => (
          <>
            <p className="mb-3 text-sm text-mist">
              <span className="mr-1.5 text-xl font-light text-white">{r.openTasks.length}</span>
              {r.openTasks.length === 1 ? "Aufgabe" : "Aufgaben"} in Apple Erinnerungen
            </p>
            {r.openTasks.length === 0 ? (
              <p className="text-sm text-mist">Alles erledigt.</p>
            ) : (
              <ul className="divide-y divide-line">
                {r.openTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2.5 text-[15px]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent/80" />
                    {t.title}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Gate>
    </Card>
  );
}

function CountCard({
  title, label, source, delay, icon,
}: {
  title: string; label: string; source: AssistantData["email"]; delay: number; icon: React.ReactNode;
}) {
  return (
    <Card title={title} delay={delay} demo={source.snapshot?.isDemo} icon={icon}>
      <Gate source={source}>
        {(c) => (
          <>
            <Big>{c.unread}</Big>
            <p className="mt-2 text-sm text-mist">{label}</p>
          </>
        )}
      </Gate>
    </Card>
  );
}

export const EmailCard = ({ source }: { source: AssistantData["email"] }) => (
  <CountCard title="E-Mail" label="ungelesene E-Mails" source={source} delay={200}
    icon={<svg {...iconProps}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7.5 8 6 8-6" /></svg>} />
);

export const WhatsappCard = ({ source }: { source: AssistantData["whatsapp"] }) => (
  <CountCard title="WhatsApp" label="ungelesene Benachrichtigungen" source={source} delay={260}
    icon={<svg {...iconProps}><path d="M5 19l1.2-3.6A8 8 0 1 1 9 18l-4 1z" /></svg>} />
);

export function FitnessCard() {
  return (
    <Card
      title="Fitness"
      delay={320}
      className="border-dashed sm:col-span-2"
      icon={<svg {...iconProps}><path d="M3 12h3l2-5 4 10 3-7 2 2h4" /></svg>}
    >
      <p className="text-[15px]">Fitness-Integration</p>
      <p className="mt-1 text-sm text-mist">Demnächst verfügbar</p>
    </Card>
  );
}
