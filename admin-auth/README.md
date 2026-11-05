# Admin-Anmeldung (OAuth-Vermittler)

`ulfseidl.at/admin` meldet Ulf mit seinem GitHub-Konto an. GitHub gibt das Zugangs-Token nur gegen ein
Client-Secret heraus, das nicht im Browser liegen darf. Dieser kleine Cloudflare Worker hält das Secret.
Wartung: keine. Kosten: 0 (Cloudflare-Gratisstufe). Betreiber: Emanuel (EAP-Cloudflare-Konto).

## Einrichten (einmalig, Emanuel)
1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App (Konto `aeshilion`):
   - Application name: `ulfseidl.at Admin`
   - Homepage URL: `https://ulfseidl.at`
   - Authorization callback URL: `https://ulfseidl-admin-auth.<subdomain>.workers.dev/callback`
2. Client-ID in `wrangler.toml` eintragen, Client-Secret erzeugen.
3. `npx wrangler deploy` und `npx wrangler secret put GITHUB_CLIENT_SECRET` (Secret aus 1Password, nie in den Chat).
4. Worker-Adresse in `static/admin/config.yml` bei `base_url` eintragen.

## Was passiert beim Speichern
Admin-Seite → Pull Request auf Zweig `cms/…` → „Seite prüfen“ → grün → `.github/workflows/admin-automerge.yml`
mergt und startet den Deploy → nach etwa 2 Minuten auf ulfseidl.at. Rot: nichts passiert, Claude oder Emanuel schauen.

## Rückweg
Worker löschen und OAuth-App löschen → Admin-Seite kann sich nicht mehr anmelden; die Seite selbst läuft weiter.
