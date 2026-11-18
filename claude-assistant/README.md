# Claude Assistant

Ein sprachgesteuerter, persönlicher KI-Assistent als PWA – nur für Louis. 70 % Tesla-UI, 30 % Jarvis.
Next.js 16 · React 19 · TypeScript · Tailwind 3. **Kein Backend, kein Login, keine KI-API nötig.** Das Build-Ergebnis sind reine statische Dateien.
Die App spricht und versteht **Deutsch** (`LANG = "de-DE"` in `src/config/defaults.ts`).

## 1. Architektur (Schichten, Abhängigkeiten zeigen nach innen)

```
UI (src/ui)  ──►  Voice (src/voice)  ──►  Core (src/core)  ◄──  Providers (src/providers)
                                              ▲                        │ implementiert
                                              └── Integrations (src/integrations)
```

| Schicht | Aufgabe | Kennt |
|---|---|---|
| `core/` | Domänentypen, Absichtserkennung, Antwortvorlagen, Tagesübersicht. Reines TS, getestet. | nichts |
| `providers/` | `DataProvider<T>`-Implementierungen (Wetter, Bridge, Demo). Zusammenbau: `registry.ts`. | Core-Typen |
| `voice/` | Spracherkennung, Sprachausgabe, Zustandsautomat (`idle → listening → processing → speaking`). | nur `AssistantReply` |
| `integrations/` | Künftige Aktionen nach außen. Navigation (Apple-Karten-Link) ist vorbereitet. | Core-Typen |
| `ui/`, `app/` | React-Komponenten, Orb-Animation, Karten, Einstellungen. | alles oben |
| `lib/` | Hooks für Einstellungen (localStorage) und Datenladen. | Providers |

### Ordnerstruktur
```
src/
  app/            Layout, Seite, globals.css (Design-Tokens + Orb-Animationen)
  core/           types.ts  intents.ts  commands.ts  briefing.ts
  providers/      types.ts  weather.ts  bridge.ts  demo.ts  registry.ts
  voice/          recognition.ts  synthesis.ts  useVoiceAssistant.ts
  integrations/   navigation/navigation.ts
  config/         defaults.ts  (Name, Standardstadt, Sprache, Feature-Flags)
  lib/            useSettings.ts  useAssistantData.ts
  ui/             Assistant.tsx  components/{VoiceOrb,Cards,Card,Conversation,SettingsSheet}.tsx
public/           manifest.webmanifest  sw.js  icons/
integrations/cloudflare-worker/worker.js   optionale kostenlose Daten-Bridge
docs/IOS_SHORTCUT.md
tests/            vitest
```

## 2. UI / UX
- **Sprache zuerst**: Der Orb ist das Zentrum. Ein Button, der je nach Zustand das Richtige tut (tippen = zuhören, nochmal = stoppen, während der Antwort = unterbrechen).
- **Zustände**: Ruhe = langsam drehender Punktering. Zuhören = Wellen + hellerer Schein. Denken = ein Akzentbogen + drei Punkte. Sprechen = Wellenform.
- **Tesla**: flaches Fast-Schwarz, dünne Schrift, große leichte Ziffern, viel Raum, feine Linien, eine Akzentfarbe. **Jarvis**: konzentrische Ringe, Scanner-Bogen, zurückhaltendes Leuchten.
- Farben: `#050816` / `#00D4FF` / `#FFFFFF` / `#A8B2D1`. Nur Dark Mode. `prefers-reduced-motion` wird respektiert. Safe-Area-Abstände sind berücksichtigt.
- Karten zeigen ein kleines **Demo**-Label, solange Beispieldaten angezeigt werden.
- Tippen als Alternative („Stattdessen tippen“), automatisch aktiv, wenn Spracherkennung fehlt.

## 3. Technische Entscheidungen
- **Kostenloses Gehirn**: `parseIntent` (Regeln) → `respondTo` (Vorlagen). Wetter, Aufgaben, E-Mail, WhatsApp und Tagesübersicht brauchen nie eine KI. `handleTranscript` nimmt optional einen `FallbackResolver` für eine spätere KI, die nur unverstandene Sätze sieht.
- **Wetter**: Open-Meteo (kostenlos, ohne Schlüssel) direkt aus dem Browser.
- **Apple Erinnerungen / E-Mail / WhatsApp**: Eine Webseite kann diese auf iOS nicht lesen. Ein **Bridge**-JSON (siehe `docs/IOS_SHORTCUT.md`) wird von einem iOS-Kurzbefehl geschrieben und von der App gelesen. Ohne Bridge-URL zeigt die App Demodaten. Bei WhatsApp wird nur die Anzahl übertragen, nie Inhalte.
- **E-Mail-Anbieter offen**: Die App braucht nur eine Zahl; `DataProvider<CountSnapshot>` kann später Gmail, Graph, IMAP usw. sein.
- **Navigation** (nur vorbereitet): „navigiere mich nach Hause“ → `resolveDestination` → Apple-Karten-URL → `AssistantAction`. Per `NAVIGATION_ENABLED = false` ausgeschaltet; durch Tests abgedeckt.
- **Robustheit**: Provider laden unabhängig, Fehler behalten den letzten guten Wert; Aktualisierung beim Zurückkehren und alle 5 Minuten.
- **PWA**: statischer Export, Manifest, Service Worker (eigene Dateien stale-while-revalidate, API-Aufrufe nie gecacht), iOS-Meta-Tags, generierte Icons.

### iOS-Hinweise (ehrlich)
- Spracherkennung in Safari funktioniert, braucht aber Internet und Mikrofonerlaubnis; in der **Home-Bildschirm-App** war die Unterstützung je nach iOS-Version uneinheitlich. Bei Problemen „Stattdessen tippen“ oder in Safari öffnen. Früh auf dem eigenen iPhone testen.
- Sprachausgabe läuft auf dem Gerät; die App schaltet das Audio beim Tippen frei, damit auch asynchrone Antworten gesprochen werden.
- iOS erlaubt PWAs kein stilles Starten von Karten/Kurzbefehlen; Navigation öffnet sich nach der gesprochenen Antwort per Link.
- Safari und die Home-Bildschirm-App haben **getrennten Speicher**: Einstellungen in der installierten App vornehmen.

## 4. Umsetzungsplan
1. ✅ Gerüst, Design-Tokens, PWA-Hülle  2. ✅ Core + Tests  3. ✅ Provider  4. ✅ Sprach-Pipeline  5. ✅ Orb + Karten + Einstellungen
6. ⏭ Deployen, aufs iPhone installieren, Sprache testen  7. ⏭ Kurzbefehl-Bridge einrichten  8. ⏭ Roadmap

## 5. Installation (Windows / macOS / Linux, Node 20+)
```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Unit-Tests
npm run lint       # Typprüfung
npm run build      # statische Seite in ./out
```
Mikrofon-APIs brauchen HTTPS (oder localhost). Sprache also auf dem iPhone über die deployte URL testen.

## 6. Deployment (kostenlos, statisch)
**Cloudflare Pages / Netlify / Vercel**: Repo verbinden, Build-Befehl `npm run build`, Ausgabeverzeichnis `out`. Fertig – du bekommst eine HTTPS-URL.
**GitHub Pages** (Projektseite): beim Build `NEXT_PUBLIC_BASE_PATH=/repo-name` setzen und `out/` veröffentlichen.
Da es keinen Login gibt, die URL optional schützen (Cloudflare Access / Netlify-Passwort).

## 7. Zum iPhone-Home-Bildschirm hinzufügen
1. Die HTTPS-URL in **Safari** öffnen. 2. Teilen → **Zum Home-Bildschirm** → Hinzufügen. 3. Über das Icon starten (Vollbild, ohne Browserleiste). 4. Mikrofon erlauben. 5. Einstellungen öffnen: Stadt, Bridge-URL, Adressen.
Icons neu erzeugen mit `npm run icons` (`scripts/generate-icons.mjs`). Nach einem Release `VERSION` in `public/sw.js` erhöhen.

## 8. Roadmap
- **Apple-Karten-Navigation** einschalten (Flag und Ziele sind vorhanden)
- **Fitness**-Provider hinter `DataProvider<FitnessSnapshot>`
- Echte E-Mail-Zahlen (Gmail/Graph/IMAP) über eine kleine Serverless-Funktion
- Optionaler **KI-Fallback** (`FallbackResolver`) mit Kostenlimit; Claude für freie Fragen
- Schweizerdeutsch/Englisch als Zusatzsprache mit Umschalter, kontinuierliches Weckwort, wo die Plattform es zulässt
- Kalender-Karte, „nächster Termin“, Push-Briefing zu fester Uhrzeit (braucht Push-Dienst)
- Optionale Spracherkennung auf dem Gerät (Whisper WASM) für mehr Zuverlässigkeit in der installierten App
