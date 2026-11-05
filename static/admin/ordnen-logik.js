// Reine Logik der Sortier-Seite: liest data/werke.yaml als Text und schreibt nur Reihenfolge und Platz neu.
// Die YAML wird NICHT neu erzeugt: jeder Werk-Block bleibt Zeichen für Zeichen, nur die Zeile „platz:“ ändert sich.
// Läuft im Browser (window.Ordnen) und in node (Test: node tests/ordnen-test.js).
(function (wurzel) {
  "use strict";

  var BLOCK_ANFANG = /^  - id: /;
  var PLAETZE = ["auswahl", "zeitreise"];

  function zeilen(text) { return text.replace(/\r\n/g, "\n").split("\n"); }

  function feld(block, name) {
    var m = block.match(new RegExp("^    " + name + ': "?(.*?)"?$', "m"));
    return m ? m[1].replace(/\\(["\\])/g, "$1") : "";
  }

  function liste(block, name) {
    var m = block.match(new RegExp("^    " + name + ": \\[(.*)\\]$", "m"));
    return m ? m[1].split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];
  }

  // text → { kopf, bloecke: [{ id, platz, titel, jahr, bilder, text }], fuss }
  function lesen(text) {
    var z = zeilen(text);
    var start = z.indexOf("werke:");
    if (start < 0) throw new Error("werke: fehlt");
    var kopf = z.slice(0, start + 1).join("\n");
    var bloecke = [], aktuell = null, fuss = [];
    for (var i = start + 1; i < z.length; i++) {
      var zeile = z[i];
      if (BLOCK_ANFANG.test(zeile)) {
        aktuell = [zeile];
        bloecke.push(aktuell);
      } else if (aktuell && (zeile.indexOf("    ") === 0 || zeile === "")) {
        aktuell.push(zeile);
      } else if (zeile.trim() !== "") {
        throw new Error("Unerwartete Zeile " + (i + 1) + ": " + zeile);
      }
    }
    // Leerzeilen am Blockende gehören nicht zum Block (sonst wandern sie beim Umsortieren mit)
    bloecke = bloecke.map(function (b) {
      while (b.length && b[b.length - 1] === "") b.pop();
      var t = b.join("\n");
      var platz = feld(t, "platz");
      if (PLAETZE.indexOf(platz) < 0) throw new Error("Werk " + feld(t, "id") + ": platz " + platz);
      return { id: b[0].replace(BLOCK_ANFANG, "").trim(), platz: platz, titel: feld(t, "titel"),
               jahr: feld(t, "jahr"), bilder: liste(t, "bilder"), text: t };
    });
    var ids = {};
    bloecke.forEach(function (b) {
      if (ids[b.id]) throw new Error("id doppelt: " + b.id);
      ids[b.id] = true;
    });
    return { kopf: kopf, bloecke: bloecke };
  }

  // Serien-Bilder aus dem Kopf (nur zum Anzeigen, nie verändert)
  function serie(kopf, name) {
    var m = kopf.match(new RegExp("^  " + name + ":\\n((?:    .*\\n?)*)", "m"));
    if (!m) return null;
    return { titel: feld(m[1], "titel"), bilder: liste(m[1], "bilder") };
  }

  // ordnung: [{ id, platz }] in neuer Reihenfolge – Reihenfolge = Reihenfolge in der Datei.
  // extra (freiwillig): { neu: { id: blocktext }, entfernt: [id] } – neue Werke stehen in ordnung,
  // entfernte nicht. Die Datei muss genau die Werke enthalten, die die Seite geladen hat (sonst ANDERS).
  function schreiben(text, ordnung, extra) {
    var d = lesen(text);
    var neuBl = (extra && extra.neu) || {}, entfernt = (extra && extra.entfernt) || [];
    var nachId = {};
    d.bloecke.forEach(function (b) { nachId[b.id] = b; });
    var weg = {};
    entfernt.forEach(function (id) {
      if (!nachId[id] || weg[id]) throw new Error("ANDERS: entferntes Werk " + id + " unbekannt");
      weg[id] = true;
    });
    var zahlNeu = Object.keys(neuBl).length;
    if (ordnung.length - zahlNeu + entfernt.length !== d.bloecke.length) throw new Error("ANDERS: Zahl der Werke hat sich geändert");
    var gesehen = {};
    var aus = ordnung.map(function (o) {
      if (gesehen[o.id] || weg[o.id]) throw new Error("ANDERS: Werk " + o.id + " doppelt");
      if (PLAETZE.indexOf(o.platz) < 0) throw new Error("Platz ungültig: " + o.platz);
      gesehen[o.id] = true;
      var t;
      if (Object.prototype.hasOwnProperty.call(neuBl, o.id)) {
        if (nachId[o.id]) throw new Error("ANDERS: Werk " + o.id + " gibt es schon");
        t = neuBl[o.id];
        if (t.indexOf("  - id: " + o.id + "\n") !== 0) throw new Error("Neuer Block passt nicht zu " + o.id);
      } else {
        if (!nachId[o.id]) throw new Error("ANDERS: Werk " + o.id + " unbekannt");
        t = nachId[o.id].text;
      }
      return t.replace(/^    platz: .*$/m, "    platz: " + o.platz);
    });
    return d.kopf + "\n" + aus.join("\n") + "\n";
  }

  function q(s) { return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ") + '"'; }

  function slug(s) {
    s = String(s).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
    s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    return s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/g, "");
  }

  // Bildbeschreibung wie bei den übrigen Werken: Aquarell „Titel“, 1990
  function altText(w) {
    var a = w.technik && w.technik !== w.titel ? w.technik + " „" + w.titel + "“" : w.titel;
    return a + (w.jahr ? ", " + w.jahr : "");
  }

  // w: { id, titel, jahr?, technik?, masse?, bereich, platz, bilder: [datei] }
  function block(w) {
    if (!w.id || !String(w.titel || "").trim()) throw new Error("Titel fehlt");
    if (["malerei", "grafik"].indexOf(w.bereich) < 0) throw new Error("Bereich ungültig: " + w.bereich);
    if (PLAETZE.indexOf(w.platz) < 0) throw new Error("Platz ungültig: " + w.platz);
    var z = ["  - id: " + w.id, "    titel: " + q(w.titel.trim())];
    if (w.jahr) z.push("    jahr: " + q(w.jahr.trim()));
    if (w.technik) z.push("    technik: " + q(w.technik.trim()));
    if (w.masse) z.push("    masse: " + q(w.masse.trim()));
    z.push("    bereich: " + w.bereich, "    platz: " + w.platz,
           "    bilder: [" + w.bilder.join(", ") + "]", "    alt: " + q(altText(w)));
    return z.join("\n");
  }

  var api = { lesen: lesen, schreiben: schreiben, serie: serie, block: block, slug: slug, altText: altText };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else wurzel.Ordnen = api;
})(this);
