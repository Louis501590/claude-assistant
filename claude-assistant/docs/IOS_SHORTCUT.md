# Erinnerungen, E-Mail- und WhatsApp-Zahlen einspeisen („Bridge“)

Die PWA liest ein JSON-Dokument:
```json
{ "reminders": ["OnePager fertigstellen", "Kunden anrufen"], "emailUnread": 14, "whatsappUnread": 7 }
```
Die URL kommt in **Einstellungen → Daten-Bridge-URL**. Leer = Demodaten.

## A. JSON kostenlos hosten (ca. 5 Min., Cloudflare)
1. Cloudflare-Dashboard → Workers & Pages → Worker erstellen → Inhalt von `integrations/cloudflare-worker/worker.js` einfügen.
2. Storage & Datenbanken → KV → Namespace anlegen und als `BRIDGE` an den Worker binden.
3. Worker → Einstellungen → Variablen: Secret `WRITE_KEY` (langer Zufallsstring) hinzufügen.
4. Deployen. Die Bridge-URL ist die `*.workers.dev`-Adresse.

## B. iOS-Kurzbefehl (Kurzbefehle-App)
1. **Erinnerungen suchen**, Filter *Ist abgeschlossen* = *Nein* → Titel als Liste sammeln.
2. E-Mail/WhatsApp: Kurzbefehle können WhatsApp nicht lesen und Mail nur teilweise (**Nachrichten suchen** → *Anzahl*). Nutze, was verfügbar ist, oder trage Werte anfangs über **Nach Eingabe fragen** ein; nicht verfügbare Zahlen einfach weglassen.
3. **Dictionary**: `reminders` (Liste), `emailUnread` (Zahl), `whatsappUnread` (Zahl).
4. **Inhalt von URL abrufen**: Bridge-URL, Methode **POST**, Header `x-bridge-key: <WRITE_KEY>`, Anfragetext **JSON** = das Dictionary.
5. Kurzbefehle → Automation → Tageszeit (z. B. 07:00) oder „Wenn ich <App> öffne“ → Kurzbefehl ausführen, *Sofort ausführen*.

Hinweise: Von WhatsApp wird nur die Anzahl übertragen. Der GET-Endpunkt ist bewusst öffentlich (nur lesen, geringe Sensibilität); lege keine Geheimnisse hinein. Wähle einen nicht erratbaren Worker-Namen oder füge bei Bedarf ein Lese-Token hinzu.
