// OAuth-Vermittler für die Admin-Seite ulfseidl.at/admin (Decap CMS, GitHub-Backend).
// GitHub gibt das Zugangs-Token nur gegen das Client-Secret heraus; das darf nicht im Browser liegen.
// Dieser Worker hält das Secret (wrangler secret put GITHUB_CLIENT_SECRET) und reicht nur das Token
// an das Admin-Fenster auf ulfseidl.at weiter. Keine Daten, kein Speicher, keine Protokolle.

const SITE = "https://ulfseidl.at";
const SCOPE = "public_repo"; // Repo ist öffentlich; mehr Rechte braucht Decap nicht.

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/auth") {
      const state = crypto.randomUUID();
      const gh = new URL("https://github.com/login/oauth/authorize");
      gh.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      gh.searchParams.set("redirect_uri", `${url.origin}/callback`);
      gh.searchParams.set("scope", SCOPE);
      gh.searchParams.set("state", state);
      return new Response(null, {
        status: 302,
        headers: {
          Location: gh.toString(),
          "Set-Cookie": `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        },
      });
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const cookie = (req.headers.get("Cookie") || "").match(/oauth_state=([^;]+)/);
      if (!code || !state || !cookie || cookie[1] !== state) {
        return seite("error", { message: "Anmeldung abgelaufen. Bitte noch einmal auf Anmelden klicken." });
      }
      const r = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "ulfseidl-admin-auth" },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${url.origin}/callback`,
        }),
      });
      const daten = await r.json();
      if (!daten.access_token) {
        return seite("error", { message: "GitHub hat die Anmeldung abgelehnt." });
      }
      return seite("success", { token: daten.access_token, provider: "github" });
    }

    return new Response("ulfseidl.at Admin-Anmeldung", { status: 404 });
  },
};

// Decap-Protokoll: Fenster meldet sich beim Admin-Fenster, wartet auf dessen Antwort, schickt dann das Ergebnis –
// ausschließlich an https://ulfseidl.at (sonst niemand bekommt das Token).
function seite(status, inhalt) {
  const nachricht = `authorization:github:${status}:${JSON.stringify(inhalt)}`;
  const html = `<!doctype html><meta charset="utf-8"><title>Anmeldung</title><p>Anmeldung … dieses Fenster schließt sich gleich.</p>
<script>
(function () {
  var ziel = ${JSON.stringify(SITE)};
  function antwort(e) {
    if (e.origin !== ziel) return;
    window.opener.postMessage(${JSON.stringify(nachricht)}, ziel);
    window.removeEventListener("message", antwort);
    setTimeout(function () { window.close(); }, 300);
  }
  window.addEventListener("message", antwort);
  window.opener.postMessage("authorizing:github", ziel);
})();
</script>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": "oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
}
