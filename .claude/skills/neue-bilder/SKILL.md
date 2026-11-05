---
name: neue-bilder
description: Neue Bilder als Werke auf die Seite bringen – zuerst über ulfseidl.at/admin, sonst aus dem Ordner eingang/. Use when Ulf says "neue Bilder", "Bilder im Eingang", "Werk dazu", "neues Bild", "hab Bilder hochgeladen", "iPhone-Foto geht nicht".
---

# Neue Bilder auf die Seite bringen

0. **Erst fragen, ob es ohne dich geht.** Für ein oder ein paar Bilder ist das am einfachsten:
   „Geh auf **ulfseidl.at/admin** → oben **＋ Neues Bild** → ins gestrichelte Feld klicken, Foto auswählen →
   Titel, Malerei oder Grafik → **Hinzufügen** → oben rechts **Veröffentlichen**.“
   Nur weitermachen, wenn Ulf viele Bilder hat, das Foto dort nicht hineingeht (iPhone-Format HEIC) oder er es dir geben will.
   Ein Bild, das er hier in den Chat einfügt, kannst du nicht als Datei speichern – dann Schritt 1.
1. `eingang/` ansehen (alles außer `README.md`). Ist er leer: Ulf kurz erklären, wie er Bilder hochlädt
   (github.com/aeshilion/ulfseidl-kunst → Ordner `eingang` → Add file → Upload files → Commit changes) und aufhören.
2. Jedes Bild ansehen. **Ulf in EINER Nachricht** je Bild fragen: Titel, Jahr, Technik, Maße (optional),
   Malerei oder Grafik, groß auf der Startseite (`auswahl`) oder weiter unten in der Zeitreise (`zeitreise`).
   Schlag aus dem Bild vor, was du siehst; Ulf bestätigt oder verbessert. Nichts erfinden, was er nicht gesagt hat.
3. Verkleinern auf längste Seite 1400 px, JPG, Qualität ~82, unter 400 KB. Nimm, was da ist:
   Python Pillow (`pip install pillow`; für iPhone-HEIC zusätzlich `pillow-heif`), sonst ImageMagick (`magick`/`convert`).
   Handyfotos vorher richtig drehen (EXIF-Ausrichtung). Dateiname: klein, ohne Leerzeichen und Umlaute, z. B. `sonnenblumen-2026.jpg`;
   nie eine vorhandene Datei in `static/werke/` überschreiben.
4. Ablegen in `static/werke/`, Eintrag in `data/werke.yaml` (Felder oben in der Datei; `alt` = kurz, was man sieht).
   Reihenfolge: dort einsortieren, wo Ulf es will; sonst Auswahl vorne, Zeitreise nach Jahr.
5. Originale aus `eingang/` löschen (`README.md` bleibt).
6. Skill `seite-pruefen` ausführen (bauen, `pruefen/pruefen.py`, Ulf Computer- und Handy-Bild zeigen).
7. Pull Request mit kurzem Titel; Ulf den Link geben und sagen: „Auf den Link klicken, unten **Merge pull request** und
   **Confirm merge** drücken – nach etwa 3 Minuten ist es auf ulfseidl.at.“

Feste Regeln aus `AGENTS.md` gelten (J. C. Superstar und Mazar-i-Sharif immer zusammen, nichts von fremden Servern).
