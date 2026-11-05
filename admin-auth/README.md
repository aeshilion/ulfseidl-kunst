# Admin-Anmeldung (OAuth-Vermittler)

`ulfseidl.at/admin` meldet Ulf mit seinem GitHub-Konto an. GitHub gibt das Zugangs-Token nur gegen ein
Client-Secret heraus, das nicht im Browser liegen darf. Dieser kleine Cloudflare Worker hält das Secret.
Wartung: keine. Kosten: 0 (Cloudflare-Gratisstufe). Betreiber: Emanuel (EAP-Cloudflare-Konto).

## Einrichtung (erledigt 05.11.2026)
1. GitHub OAuth App „ulfseidl.at Admin“ auf `aeshilion` (Settings → Developer settings → OAuth Apps),
   Callback `https://ulfseidl-admin-auth.red-sea-0a96.workers.dev/callback`, Ablauf der Zugangs-Tokens an.
2. Worker `ulfseidl-admin-auth` im Cloudflare-Konto office@ (Account `2e54ca5c…`), Code = `worker.js`,
   im Dashboard eingefügt (Workers & Pages → ulfseidl-admin-auth → Edit code → Deploy).
3. Variablen im Dashboard (Settings → Variables and Secrets): `GITHUB_CLIENT_ID` (Text, steht auch in
   `wrangler.toml`), `GITHUB_CLIENT_SECRET` (Secret). Secret liegt in 1Password „EAP Infrastruktur“ →
   „ulfseidl.at Admin OAuth“, nie im Chat oder Repo.
4. Code ändern: `worker.js` hier ändern, dann im Dashboard einfügen und Deploy (oder `wrangler deploy`).

## Was passiert beim Speichern
Admin-Seite → Pull Request auf Zweig `cms/…` → „Seite prüfen“ → grün → `.github/workflows/admin-automerge.yml`
mergt und startet den Deploy → nach etwa 2 Minuten auf ulfseidl.at. Rot: nichts passiert, Claude oder Emanuel schauen.

## Rückweg
Worker löschen und OAuth-App löschen → Admin-Seite kann sich nicht mehr anmelden; die Seite selbst läuft weiter.
