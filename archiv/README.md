# Archiv: alle Bilder der alten Seite

Hier liegen die Bilder der alten WordPress-Seite ulfseidl.at (Stand 05.11.2026), ohne doppelte Dateien,
auf höchstens 1600 px verkleinert. **Dieser Ordner erscheint nicht auf der Webseite** — er ist der Vorrat.

- `phase1/` — frühe Grafik und Öl, 1973–1984 (Holzschnitt, Linolschnitt, Radierung, Zeichnung)
- `phase2/` — Aquarelle 1982–1999, Stillleben 1975, Triptychon 1978–80
- `phase4/` — 2009–2024 (J. C. Superstar, Mazar-i-Sharif, Öl ab 2015)

Die Dateinamen tragen meist Jahr, Technik, Titel und Maße (z. B. `Aquarell_1990_Praterallee_38_3_x_27_2`).
Manche Werke liegen in mehreren Fassungen vor (gleicher Titel, anderer Ausschnitt).

## Ein Bild aus dem Archiv auf die Seite holen

1. Bild nach `static/werke/` kopieren, kurzer Name, klein, ohne Leerzeichen und Umlaute (z. B. `praterallee.jpg`), unter 400 KB.
2. Eintrag in `data/werke.yaml` anlegen (Titel, Jahr, Technik, Maße aus dem Dateinamen; `bereich`, `platz`, `alt`).
3. `hugo` bauen lassen, dann Pull Request.
