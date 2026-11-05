// Test der Sortier-Logik (static/admin/ordnen-logik.js) gegen die echte data/werke.yaml. Aufruf: node pruefen/ordnen-test.js
"use strict";
const fs = require("fs"), path = require("path"), assert = require("assert");
const O = require(path.join(__dirname, "..", "static", "admin", "ordnen-logik.js"));
const text = fs.readFileSync(path.join(__dirname, "..", "data", "werke.yaml"), "utf8");
const d = O.lesen(text);
const ord = d.bloecke.map(b => ({ id: b.id, platz: b.platz }));

// 1 Gleiche Ordnung → Datei bleibt Zeichen für Zeichen gleich
assert.strictEqual(O.schreiben(text, ord), text, "unveränderte Ordnung muss die Datei unverändert lassen");

// 2 Letztes Werk nach vorne in die Auswahl: nur Reihenfolge und eine platz-Zeile ändern sich
const letzt = ord[ord.length - 1];
const neu = [{ id: letzt.id, platz: "auswahl" }].concat(ord.slice(0, -1));
const t2 = O.schreiben(text, neu);
const d2 = O.lesen(t2);
assert.strictEqual(d2.bloecke[0].id, letzt.id);
assert.strictEqual(d2.bloecke[0].platz, "auswahl");
assert.strictEqual(d2.kopf, d.kopf, "Kopf (Startbild, Serien) bleibt");
const ohnePlatz = s => s.split("\n").filter(z => !/^    platz: /.test(z)).sort().join("\n");
assert.strictEqual(ohnePlatz(t2), ohnePlatz(text), "außer platz-Zeilen geht keine Zeile verloren oder kommt dazu");

// 3 Negativproben: fehlendes, doppeltes, fremdes Werk, falscher Platz → Fehler, nichts geschrieben
assert.throws(() => O.schreiben(text, ord.slice(1)), /ANDERS/);
assert.throws(() => O.schreiben(text, [ord[0]].concat(ord.slice(0, -1))), /ANDERS/);
assert.throws(() => O.schreiben(text, [{ id: "gibtsnicht", platz: "auswahl" }].concat(ord.slice(1))), /ANDERS/);
assert.throws(() => O.schreiben(text, [{ id: ord[0].id, platz: "keller" }].concat(ord.slice(1))), /Platz/);

// 4 Serien sind lesbar (werden angezeigt, nie verändert)
assert.strictEqual(O.serie(d.kopf, "jc").bilder.length, 3);
assert.strictEqual(O.serie(d.kopf, "mazar").bilder.length, 4);
console.log(`✓ Sortier-Logik in Ordnung (${d.bloecke.length} Werke)`);
