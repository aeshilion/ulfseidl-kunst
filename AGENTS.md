# ulfseidl.at – Kunstseite von Ulf Seidl

Statische Hugo-Seite (Malerei & Grafik). Ulf Seidl pflegt sie selbst, meist über Claude Code im Browser.
Sprich Ulf mit **Du** an, schreib kurz und ohne Fachwörter. Er ist Maler, kein Programmierer.

## So ist die Seite gebaut
- **Alle Werke stehen in `data/werke.yaml`.** Ein Eintrag je Werk; die Felder sind oben in der Datei erklärt.
  Reihenfolge in der Datei = Reihenfolge auf der Seite.
- Bilder liegen in `static/werke/` (JPG, längste Seite höchstens 1600 px, unter 400 KB).
- Alle Bilder der alten Seite liegen als Vorrat in `archiv/alte-seite/` (nicht veröffentlicht, siehe `archiv/README.md`). Wünscht Ulf ein Werk, zuerst dort suchen.
- Startseite: Startbild (Jeansjacke) → Kacheln Malerei/Grafik → J. C. Superstar → Einzelwerke (`platz: auswahl`)
  → Mazar-i-Sharif → Zeitreise als Bilderwolke (`platz: zeitreise`, alle übrigen Werke). Unterseiten `/malerei/` und `/grafik/` zeigen alles mit `bereich`.
- Aussehen: `assets/css/seite.css` (Nachtgalerie: dunkel, Bodoni, Kugelschreiber-Blau `#8ea2ec`).
- **Neue Bilder** lädt Ulf auf GitHub in `eingang/` hoch. Ablauf: Skill `neue-bilder` (`.claude/skills/`). Zurücknehmen: Skill `rueckgaengig`. Prüfen und zeigen: Skill `seite-pruefen`.
- Ulfs Kurzanleitung: `anleitung/kurzanleitung.html` (+ PDF).
- **Sortier-Seite `ulfseidl.at/admin`** (eigene Seite in `static/admin/`: `ordnen.js` Oberfläche, `ordnen-logik.js`
  Logik mit Test `pruefen/ordnen-test.js`; Anmeldung über `admin-auth/`): Ulf zieht dort Bilder zwischen Auswahl und
  Zeitreise. Veröffentlichen legt einen PR auf einem Zweig `cms/…` an; ist „Seite prüfen“ grün, mergt
  `.github/workflows/admin-automerge.yml` ihn und veröffentlicht. Die Seite verschiebt nur ganze Werk-Blöcke und ändert
  die Zeile `platz:` – Felder bitte immer im Muster der Datei (`  - id:` beginnt einen Block, Felder mit 4 Leerzeichen),
  sonst lehnt die Sortier-Seite die Datei ab. Feldbeschreibung: `doku/werke-felder.md`.
  Liegt ein offener `cms/…`-PR vor, `data/werke.yaml` nicht gleichzeitig ändern.
- Rechtliches: `content/impressum.md`, `content/datenschutz.md`, `content/kontakt.md`.

## Feste Regeln
1. **J. C. Superstar (3 Blätter) und Herbst in Mazar-i-Sharif (4 Tafeln) hängen immer zusammen** – nie einzeln zeigen.
2. **Nichts von fremden Servern laden**: keine Google Fonts, kein Analytics, keine eingebetteten Videos, keine Cookies.
   Sonst stimmt die Datenschutzerklärung nicht mehr.
3. Impressum und Datenschutz nur ändern, wenn Ulf es ausdrücklich sagt.
4. Neues Bild: verkleinern (längste Seite 1600 px, Pillow oder ImageMagick), Dateiname klein, ohne Leerzeichen und Umlaute.
5. Jedes Bild braucht einen `alt`-Text: kurz, was man sieht.
6. Vor jedem Vorschlag Skill `seite-pruefen`: bauen, `python3 pruefen/pruefen.py` muss ✓ zeigen, Ulf Bilder (Computer + Handy) zeigen.
   Dieselbe Prüfung läuft auf GitHub bei jedem Pull Request (`.github/workflows/pruefen.yml`). Nie abschwächen, um grün zu werden.
7. Änderungen als Pull Request vorschlagen, nicht direkt auf `main`. Wer `main` bekommt, ist sofort online.

## Online
`main` → GitHub Actions (`.github/workflows/hugo.yml`) → GitHub Pages, nach etwa einer Minute.
Die Seite läuft seit 05.11.2026 unter https://ulfseidl.at (umgestellt, erledigt). Gemergt auf `main` = nach etwa einer Minute live auf ulfseidl.at.
Domain und DNS verwaltet Emanuel, nicht Ulf: nie nach dem Domain-Anbieter oder Zugangsdaten fragen.
