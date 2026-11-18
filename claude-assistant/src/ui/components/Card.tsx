import type { ReactNode } from "react";
import type { SourceState } from "@/core/types";

export function Card({
  title,
  icon,
  children,
  className = "",
  delay = 0,
  demo = false,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
  demo?: boolean;
}) {
  return (
    <section className={`glass rise p-5 ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-mist">
          <span className="text-accent/90">{icon}</span>
          <h2 className="eyebrow">{title}</h2>
        </div>
        {demo && <span className="rounded-full border border-line px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-mist">Demo</span>}
      </header>
      {children}
    </section>
  );
}

/** Gemeinsamer Lade-/Fehler-Platzhalter, damit jede Karte nur den Normalfall rendert. */
export function Gate<T>({ source, children }: { source: SourceState<T>; children: (data: T) => ReactNode }) {
  if (source.snapshot) return <>{children(source.snapshot.data)}</>;
  if (source.status === "error") return <p className="text-sm text-mist">Gerade nicht verfügbar.</p>;
  return (
    <div className="space-y-2" aria-busy>
      <div className="h-8 w-24 animate-pulse rounded-lg bg-white/5" />
      <div className="h-3 w-32 animate-pulse rounded bg-white/5" />
    </div>
  );
}

export const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;
