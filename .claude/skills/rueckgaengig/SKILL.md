---
name: rueckgaengig
description: Eine Änderung an der Seite zurücknehmen. Use when Ulf says "rückgängig", "zurück", "wie vorher", "das war falsch", "mach das weg", "alte Version".
---

# Änderung zurücknehmen

1. `git log --oneline -15 origin/main` lesen und Ulf die letzten Änderungen **in Alltagssprache** zeigen
   (Datum, was sich geändert hat). Fragen, welche zurück soll, wenn es nicht eindeutig ist.
2. Nie Verlauf umschreiben: kein `reset`, kein Force-Push. Immer `git revert <commit>` (bei Merge-Commits `-m 1`).
3. `hugo --gc --minify` muss fehlerfrei laufen; Seite ansehen.
4. Pull Request „Zurück: …“; Ulf sagen, er soll ihn mergen. Nach einer Minute ist der alte Stand auf ulfseidl.at.
