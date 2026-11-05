# data/werke.yaml – Felder

Diese Erklärung steht hier und nicht als Kommentar in `werke.yaml`: die Sortier-Seite (`/admin`) verschiebt ganze
Werk-Blöcke, Kommentare zwischen den Blöcken würden dabei mitwandern oder stören.

Ein Eintrag unter `werke:` = ein Werk (auch mehrteilige: mehrere Bilder unter `bilder`).
**Reihenfolge in der Datei = Reihenfolge auf der Seite.**

| Feld | Bedeutung |
|---|---|
| `id` | kurzer Name ohne Leerzeichen, eindeutig |
| `titel` | wie er auf der Seite steht |
| `jahr` | Text, z. B. "2020" oder "1978–80" |
| `technik` | z. B. "Öl auf Leinwand", "Aquarell", "Kugelschreiber auf Papier" |
| `masse` | optional, z. B. "41,5 × 59 cm" |
| `bereich` | `malerei` oder `grafik` (welche Kachel/Unterseite) |
| `platz` | `auswahl` (groß auf der Startseite) oder `zeitreise` (Bilderwolke unten, alle übrigen Werke) |
| `bilder` | Dateinamen in `static/werke/`, in der Reihenfolge, wie sie nebeneinander hängen |
| `ganz` | optional: `true` = Bild nie zuschneiden (sehr schmale Hochformate) |
| `alt` | Bildbeschreibung für Blinde und Suchmaschinen (kurz, was man sieht) |

`held` = Startbild, `serien` = J. C. Superstar und Herbst in Mazar-i-Sharif (hängen immer zusammen).
