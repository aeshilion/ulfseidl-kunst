---
name: seite-pruefen
description: Seite vor jedem Vorschlag prüfen und Ulf zeigen, wie sie aussieht. Use before every pull request, and when Ulf says "zeig mir", "wie sieht das aus", "am Handy", "passt das", "prüf die Seite".
---

# Seite prüfen und zeigen

Vor **jedem** Pull Request, ohne dass Ulf danach fragen muss:

1. Bauen: `hugo --gc --minify` – muss fehlerfrei laufen.
2. Prüfen: `pip install pyyaml` (falls nötig), dann `python3 pruefen/pruefen.py`.
   Steht dort ✗, die Punkte beheben und wiederholen. Nie die Prüfung abschwächen, um grün zu werden.
3. Ansehen: `hugo server` starten und die geänderte Seite in zwei Breiten fotografieren –
   Computer (1280 px) und Handy (390 px). Nimm, was da ist (Playwright/Chromium headless).
   Gibt es keinen Browser, sag Ulf ehrlich, dass du nur den Code geprüft hast, und hör nicht auf zu arbeiten.
4. Ulf die Bilder zeigen, bei Änderungen vorher/nachher nebeneinander. Ein Satz, was sich geändert hat.
5. Im Pull Request erscheint nach etwa einer Minute „Seite prüfen“ mit grünem Haken.
   Erst dann Ulf sagen, er kann **Merge pull request** → **Confirm merge** klicken.
   Ist der Haken rot: selbst beheben, nicht Ulf damit belasten.
