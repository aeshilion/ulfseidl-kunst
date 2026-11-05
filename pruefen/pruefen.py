#!/usr/bin/env python3
"""Prüft ulfseidl.at vor dem Veröffentlichen. Aufruf nach `hugo --gc --minify`:

    python3 pruefen/pruefen.py

Exit 0 = alles gut, 1 = mindestens ein Fehler (Liste in Alltagssprache).
Braucht PyYAML (`pip install pyyaml`).
"""
import re
import sys
from pathlib import Path

import yaml

WURZEL = Path(__file__).resolve().parent.parent
BILDER = WURZEL / "static" / "werke"
PUBLIC = WURZEL / "public"
MAX_KB = 400
SERIEN_TEILE = {"jc": 3, "mazar": 4}  # hängen immer zusammen (AGENTS.md Regel 1)
BEREICHE = {"malerei", "grafik"}
PLAETZE = {"auswahl", "zeitreise"}

fehler = []


def bild_pruefen(datei, wo):
    p = BILDER / str(datei)
    if not p.is_file():
        fehler.append(f"{wo}: Bild „{datei}“ fehlt in static/werke/.")
        return
    kb = p.stat().st_size / 1024
    if kb > MAX_KB:
        fehler.append(f"{wo}: Bild „{datei}“ ist {kb:.0f} KB groß, erlaubt sind {MAX_KB} KB. Bitte verkleinern.")
    if not re.fullmatch(r"[a-z0-9][a-z0-9._-]*", p.name):
        fehler.append(f"{wo}: Dateiname „{datei}“ bitte klein, ohne Leerzeichen und Umlaute.")


def daten_pruefen():
    d = yaml.safe_load((WURZEL / "data" / "werke.yaml").read_text(encoding="utf-8"))

    held = d.get("held") or {}
    bild_pruefen(held.get("bild"), "Startbild")
    if not str(held.get("alt") or "").strip():
        fehler.append("Startbild: Bildbeschreibung (alt) fehlt.")

    serien = d.get("serien") or {}
    for key, teile in SERIEN_TEILE.items():
        s = serien.get(key)
        if not s:
            fehler.append(f"Serie „{key}“ fehlt. J. C. Superstar und Mazar-i-Sharif müssen immer bleiben.")
            continue
        bilder = s.get("bilder") or []
        if len(bilder) != teile:
            fehler.append(f"Serie „{s.get('titel', key)}“ hat {len(bilder)} Bilder statt {teile}. Sie hängt immer vollständig.")
        for b in bilder:
            bild_pruefen(b, f"Serie „{s.get('titel', key)}“")
        if not str(s.get("alt") or "").strip():
            fehler.append(f"Serie „{s.get('titel', key)}“: Bildbeschreibung (alt) fehlt.")

    gesehen = set()
    for w in d.get("werke") or []:
        name = w.get("titel") or w.get("id") or "?"
        wo = f"Werk „{name}“"
        wid = w.get("id")
        if not wid:
            fehler.append(f"{wo}: id fehlt.")
        elif wid in gesehen:
            fehler.append(f"{wo}: id „{wid}“ gibt es zweimal.")
        gesehen.add(wid)
        if not str(w.get("titel") or "").strip():
            fehler.append(f"{wo}: Titel fehlt.")
        if w.get("bereich") not in BEREICHE:
            fehler.append(f"{wo}: bereich muss malerei oder grafik sein, ist „{w.get('bereich')}“.")
        if w.get("platz") not in PLAETZE:
            fehler.append(f"{wo}: platz muss auswahl oder zeitreise sein, ist „{w.get('platz')}“.")
        if not str(w.get("alt") or "").strip():
            fehler.append(f"{wo}: Bildbeschreibung (alt) fehlt.")
        bilder = w.get("bilder") or []
        if not bilder:
            fehler.append(f"{wo}: kein Bild angegeben.")
        for b in bilder:
            bild_pruefen(b, wo)


# Alles, was der Browser beim Öffnen selbst nachlädt. Links zum Anklicken (<a href>) sind erlaubt.
FREMD = [
    (re.compile(r"<(?:script|img|iframe|video|audio|source|embed|object)\b[^>]*\bsrc=[\"']?(https?:)?//", re.I), "lädt etwas von einem fremden Server"),
    (re.compile(r"<link\b[^>]*\bhref=[\"']?(https?:)?//(?!ulfseidl\.at)", re.I), "lädt Schrift oder Stil von einem fremden Server"),
    (re.compile(r"url\(\s*[\"']?(https?:)?//", re.I), "lädt in der Gestaltung etwas von einem fremden Server"),
    (re.compile(r"@import\s+[\"']?(url\()?\s*[\"']?(https?:)?//", re.I), "lädt Stil von einem fremden Server"),
]
EIGEN = re.compile(r"//(www\.)?ulfseidl\.at/")


def gebaut_pruefen():
    if not PUBLIC.is_dir():
        fehler.append("Die Seite ist nicht gebaut. Erst `hugo --gc --minify` laufen lassen.")
        return
    for p in sorted(PUBLIC.rglob("*")):
        if p.suffix not in {".html", ".css", ".js"}:
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        for muster, was in FREMD:
            for m in muster.finditer(text):
                schnipsel = text[m.start():m.start() + 120]
                if EIGEN.search(schnipsel[:80]):
                    continue
                fehler.append(f"{p.relative_to(PUBLIC)} {was} (Datenschutz): {schnipsel[:90]!r}")
                break
        if p.suffix == ".html":
            for m in re.finditer(r"<img\b[^>]*>", text, re.I):
                # alt="" (Schmuckbild, z. B. Kacheln mit eigenem Text) ist erlaubt; ganz ohne alt nicht.
                if not re.search(r"\salt(?=[\s=>/])", m.group(0)):
                    fehler.append(f"{p.relative_to(PUBLIC)}: ein Bild ohne Beschreibung (alt): {m.group(0)[:90]!r}")


def admin_pruefen():
    # Die Sortier-Seite darf nur mit dem eigenen Anmelde-Vermittler reden und nie eine Probe-Datei ausliefern.
    js = PUBLIC / "admin" / "ordnen.js"
    if js.is_file() and 'ANMELDUNG = "https://ulfseidl-admin-auth.' not in js.read_text(encoding="utf-8"):
        fehler.append("admin/ordnen.js: Anmelde-Adresse fehlt oder ist eine andere – Emanuel prüft.")
    if (PUBLIC / "admin" / "probe-werke.yaml").exists():
        fehler.append("admin/probe-werke.yaml ist eine Probe-Datei und darf nicht veröffentlicht werden.")


def main():
    daten_pruefen()
    gebaut_pruefen()
    admin_pruefen()
    if fehler:
        print(f"✗ {len(fehler)} Punkt(e) zu beheben:\n")
        for f in fehler:
            print(f"  – {f}")
        return 1
    print("✓ Alles in Ordnung: Bilder, Beschreibungen, Serien, nichts von fremden Servern.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
