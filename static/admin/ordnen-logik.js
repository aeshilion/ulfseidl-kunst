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
    return m ? m[1].replace(/\\"/g, '"') : "";
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

  // ordnung: [{ id, platz }] in neuer Reihenfolge, Auswahl zuerst egal – Reihenfolge = Reihenfolge in der Datei.
  function schreiben(text, ordnung) {
    var d = lesen(text);
    var nachId = {};
    d.bloecke.forEach(function (b) { nachId[b.id] = b; });
    if (ordnung.length !== d.bloecke.length) throw new Error("ANDERS: Zahl der Werke hat sich geändert");
    var gesehen = {};
    var neu = ordnung.map(function (o) {
      var b = nachId[o.id];
      if (!b || gesehen[o.id]) throw new Error("ANDERS: Werk " + o.id + " unbekannt oder doppelt");
      if (PLAETZE.indexOf(o.platz) < 0) throw new Error("Platz ungültig: " + o.platz);
      gesehen[o.id] = true;
      return b.text.replace(/^    platz: .*$/m, "    platz: " + o.platz);
    });
    return d.kopf + "\n" + neu.join("\n") + "\n";
  }

  var api = { lesen: lesen, schreiben: schreiben, serie: serie };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else wurzel.Ordnen = api;
})(this);
