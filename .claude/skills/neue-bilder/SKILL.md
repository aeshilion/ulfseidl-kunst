---
name: neue-bilder
description: Neue Bilder aus dem Ordner eingang/ als Werke auf die Seite bringen. Use when Ulf says "neue Bilder", "Bilder im Eingang", "Werk dazu", "neues Bild", "hab Bilder hochgeladen".
---

# Neue Bilder aus `eingang/` einbauen

1. `eingang/` ansehen (alles außer `README.md`). Ist er leer: Ulf kurz erklären, wie er Bilder hochlädt
   (GitHub → Ordner `eingang` → Add file → Upload files → Commit changes) und aufhören.
2. Jedes Bild ansehen. **Ulf in EINER Nachricht** je Bild fragen: Titel, Jahr, Technik, Maße (optional),
   Malerei oder Grafik, groß auf der Startseite (`auswahl`) oder im Zeitreise-Band (`zeitreise`).
   Schlag aus dem Bild vor, was du siehst; Ulf bestätigt oder verbessert. Nichts erfinden, was er nicht gesagt hat.
3. Verkleinern auf längste Seite 1600 px, JPG, Qualität ~82, unter 400 KB. Nimm, was da ist:
   Python Pillow (`pip install pillow`, falls nötig), sonst ImageMagick (`magick`/`convert`).
   Handyfotos vorher richtig drehen (EXIF-Ausrichtung). Dateiname: klein, ohne Leerzeichen und Umlaute, z. B. `sonnenblumen-2026.jpg`.
4. Ablegen in `static/werke/`, Eintrag in `data/werke.yaml` (Felder oben in der Datei; `alt` = kurz, was man sieht).
   Reihenfolge: dort einsortieren, wo Ulf es will; sonst ans Ende der passenden Gruppe.
5. Originale aus `eingang/` löschen (`README.md` bleibt).
6. `hugo --gc --minify` muss fehlerfrei laufen. Seite ansehen und Ulf ein Bild davon zeigen.
7. Pull Request mit kurzem Titel; Ulf sagen: „Im Vorschlag auf **Merge pull request** und **Confirm merge** klicken, nach einer Minute ist es auf ulfseidl.at.“

Feste Regeln aus `AGENTS.md` gelten (J. C. Superstar und Mazar-i-Sharif immer zusammen, nichts von fremden Servern).
