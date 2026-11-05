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
// 5 Neues Werk dazu + eines entfernen: neuer Block landet an seiner Stelle, entfernter fehlt, Rest Zeichen für Zeichen
const titel = 'Probe "Zitat" \\ „Gänsefüßchen“ Äöü';
const nb = O.block({ id: "probe-neu", titel, jahr: "2026", technik: "Öl", bereich: "malerei", platz: "zeitreise", bilder: ["probe-neu.jpg"] });
const wegId = ord[ord.length - 1].id;
const ord5 = [ord[0], { id: "probe-neu", platz: "auswahl" }].concat(ord.slice(1, -1));
const t5 = O.schreiben(text, ord5, { neu: { "probe-neu": nb }, entfernt: [wegId] });
const d5 = O.lesen(t5);
assert.strictEqual(d5.bloecke[1].id, "probe-neu");
assert.strictEqual(d5.bloecke[1].platz, "auswahl", "Platz aus der Ordnung gilt auch für neue Werke");
assert.strictEqual(d5.bloecke[1].titel, titel, "Anführungszeichen, Backslash, Umlaute kommen unverändert zurück");
assert.ok(!d5.bloecke.some(b => b.id === wegId), "entferntes Werk ist weg");
assert.strictEqual(d5.bloecke.length, d.bloecke.length);
const ohne = (dd, ids) => dd.bloecke.filter(b => !ids.includes(b.id)).map(b => b.text.replace(/^    platz: .*$/m, "")).sort().join("\n");
assert.strictEqual(ohne(d5, ["probe-neu"]), ohne(d, [wegId]), "übrige Werke unverändert");

// 6 Wächter: Datei hat inzwischen ein Werk mehr (z. B. über Claude dazugekommen) → ANDERS statt still verlieren
const mehr = text.trimEnd() + "\n" + O.block({ id: "ueber-claude", titel: "Über Claude", bereich: "grafik", platz: "zeitreise", bilder: ["x.jpg"] }) + "\n";
assert.throws(() => O.schreiben(mehr, ord5, { neu: { "probe-neu": nb }, entfernt: [wegId] }), /ANDERS/);
assert.throws(() => O.schreiben(mehr, ord), /ANDERS/);
// neue id, die es in der Datei schon gibt → ANDERS; entfernte id unbekannt → ANDERS
assert.throws(() => O.schreiben(text, ord.concat([{ id: "golgotha2", platz: "zeitreise" }]).map(o => o), { neu: { [ord[0].id]: nb } }), /ANDERS|passt nicht/);
assert.throws(() => O.schreiben(text, ord.slice(0, -1), { entfernt: ["gibtsnicht"] }), /ANDERS/);
// Pflichtfelder neuer Werke
assert.throws(() => O.block({ id: "x", titel: " ", bereich: "malerei", platz: "zeitreise", bilder: ["x.jpg"] }), /Titel/);
assert.throws(() => O.block({ id: "x", titel: "X", bereich: "skulptur", platz: "zeitreise", bilder: ["x.jpg"] }), /Bereich/);
assert.strictEqual(O.slug("Blick vom Großglockner – Ölstudie"), "blick-vom-grossglockner-oelstudie");
fs.writeFileSync(process.env.ORDNEN_PROBE_AUS || "/dev/null", t5);

console.log(`✓ Sortier-Logik in Ordnung (${d.bloecke.length} Werke, dazu/weg geprüft)`);
