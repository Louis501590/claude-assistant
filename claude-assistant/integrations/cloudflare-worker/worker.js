/**
 * Optionale „Daten-Bridge“ – ein kleiner Cloudflare Worker + KV (Gratis-Tarif, kein Dauerbetrieb nötig).
 *
 *   POST /  mit Header  x-bridge-key: <WRITE_KEY>   Body: JSON  → speichert
 *   GET  /                                                         → liefert
 *
 * Dein iOS-Kurzbefehl sendet per POST; die PWA liest per GET (Einstellungen → Daten-Bridge-URL).
 * Einrichtung: docs/IOS_SHORTCUT.md
 *
 * Bindings: KV-Namespace `BRIDGE`, Secret `WRITE_KEY`.
 */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-bridge-key",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (request.method === "POST") {
      if (request.headers.get("x-bridge-key") !== env.WRITE_KEY) return new Response("Forbidden", { status: 403, headers: CORS });
      let body;
      try { body = await request.json(); } catch { return new Response("Bad JSON", { status: 400, headers: CORS }); }
      body.updatedAt = new Date().toISOString();
      await env.BRIDGE.put("state", JSON.stringify(body));
      return new Response("ok", { headers: CORS });
    }

    const state = (await env.BRIDGE.get("state")) ?? "{}";
    return new Response(state, { headers: { ...CORS, "content-type": "application/json", "cache-control": "no-store" } });
  },
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (request.method === "POST") {
      if (request.headers.get("x-bridge-key") !== env.WRITE_KEY) return new Response("Forbidden", { status: 403, headers: CORS });
      let body;
      try { body = await request.json(); } catch { return new Response("Bad JSON", { status: 400, headers: CORS }); }
      body.updatedAt = new Date().toISOString();
      await env.BRIDGE.put("state", JSON.stringify(body));
      return new Response("ok", { headers: CORS });
    }

    const state = (await env.BRIDGE.get("state")) ?? "{}";
    return new Response(state, { headers: { ...CORS, "content-type": "application/json", "cache-control": "no-store" } });
  },
};
