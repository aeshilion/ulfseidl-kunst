// Sortier-Seite ulfseidl.at/admin: Bilder ziehen → Veröffentlichen → Pull Request auf cms/… →
// „Seite prüfen“ grün → admin-automerge.yml mergt und startet den Deploy. Anmeldung über den
// OAuth-Vermittler (admin-auth/worker.js), Protokoll wie Decap. Kein fremder Code, kein Speicher außer
// dem Browser dieses Rechners (Anmeldung 30 Tage, vorheriger Stand).
(function () {
  "use strict";
  var REPO = "aeshilion/ulfseidl-kunst";
  var DATEI = "data/werke.yaml";
  var ANMELDUNG = "https://ulfseidl-admin-auth.red-sea-0a96.workers.dev";
  var API = "https://api.github.com";
  var BILD = "/werke/";
  var MERK_TOKEN = "ordnen.token", MERK_VORHER = "ordnen.vorher";

  var $ = function (id) { return document.getElementById(id); };
  var token = null, quelltext = null, werke = [], ordnung = [], geladen = [], gewaehlt = null, beschaeftigt = false;
  var neueWerke = {}, entfernt = [];  // id → { felder, blob }; ids, die von der Seite genommen werden

  // ---------- Anzeige ----------
  function status(text, art, mitPunkt) {
    var s = $("status");
    s.className = "status" + (art ? " " + art : "");
    s.textContent = "";
    if (mitPunkt) { var p = document.createElement("span"); p.className = "punkt"; s.appendChild(p); }
    if (text instanceof Node) s.appendChild(text); else s.appendChild(document.createTextNode(text || ""));
  }

  function geaendert() {
    return JSON.stringify(ordnung) !== JSON.stringify(geladen) || Object.keys(neueWerke).length > 0 || entfernt.length > 0;
  }

  function knoepfe() {
    var g = geaendert();
    $("veroeffentlichen").disabled = !g || beschaeftigt;
    $("zuruecksetzen").hidden = !g || beschaeftigt;
    var v = vorherLesen();
    $("vorher").hidden = !v || beschaeftigt || JSON.stringify(v) === JSON.stringify(ordnung);
    $("neu-knopf").hidden = beschaeftigt || $("arbeit").hidden;
  }

  function nachId(id) {
    for (var i = 0; i < werke.length; i++) if (werke[i].id === id) return werke[i];
    return null;
  }

  // Kacheln werden einmal gebaut und danach nur umgehängt (sonst laden die Bilder bei jedem Klick neu)
  var kacheln = {};
  function kachel(id) {
    if (kacheln[id]) return kacheln[id];
    var w = nachId(id);
    var f = document.createElement("figure");
    f.className = "kachel";
    f.tabIndex = 0;
    f.dataset.id = id;
    var n = document.createElement("span"); n.className = "nr"; f.appendChild(n);
    var bb = document.createElement("div"); bb.className = "bb";
    w.bilder.forEach(function (b) {
      var img = document.createElement("img");
      img.src = w.vorschau || BILD + b; img.alt = ""; img.loading = "lazy"; img.decoding = "async"; img.draggable = false;
      bb.appendChild(img);
    });
    f.appendChild(bb);
    if (w.vorschau) f.classList.add("neu-werk");
    var c = document.createElement("figcaption");
    c.textContent = w.titel;
    if (w.jahr) { var j = document.createElement("span"); j.textContent = w.jahr; c.appendChild(j); }
    f.appendChild(c);
    return (kacheln[id] = f);
  }

  function zeichnen() {
    var drin = {};
    ordnung.forEach(function (o) { drin[o.id] = true; });
    document.querySelectorAll(".feld .kachel").forEach(function (k) { if (!drin[k.dataset.id]) k.remove(); });
    ["auswahl", "zeitreise"].forEach(function (platz) {
      var feld = document.querySelector('.feld[data-platz="' + platz + '"]');
      var nr = 0;
      ordnung.forEach(function (o) {
        if (o.platz !== platz) return;
        var f = kachel(o.id), w = nachId(o.id);
        nr++;
        f.querySelector(".nr").textContent = nr;
        f.classList.toggle("gewaehlt", gewaehlt === o.id);
        f.classList.remove("zieht");
        f.setAttribute("aria-label", w.titel + (w.jahr ? ", " + w.jahr : "") + ", Platz " + nr);
        feld.appendChild(f);  // hängt in neuer Reihenfolge an (verschiebt, baut nicht neu)
      });
    });
    werkzeugZeigen();
    knoepfe();
    if (!beschaeftigt) entwurfMerken();
  }

  // Entwurf im Browser: Reihenfolge und Entfernte; neue Bilder nicht (zu groß) – dafür warnt das Schließen
  function entwurfMerken() {
    var o = ordnung.filter(function (x) { return !neueWerke[x.id]; });
    merken("ordnen.entwurf", geaendert() ? { basis: JSON.stringify(geladen), ordnung: o } : null);
  }

  function serieZeigen(ziel, s) {
    var el = $(ziel);
    el.textContent = "";
    if (!s) { el.hidden = true; return; }
    var bb = document.createElement("div"); bb.className = "bb";
    s.bilder.forEach(function (b) {
      var img = document.createElement("img"); img.src = BILD + b; img.alt = ""; img.loading = "lazy"; bb.appendChild(img);
    });
    var p = document.createElement("p");
    var t = document.createElement("b"); t.textContent = "🔒 " + s.titel;
    p.appendChild(t); p.appendChild(document.createTextNode(" – hängt fest an dieser Stelle. Ändern nur über Claude."));
    el.appendChild(bb); el.appendChild(p);
  }

  // ---------- Verschieben ----------
  function stelle(id) {
    for (var i = 0; i < ordnung.length; i++) if (ordnung[i].id === id) return i;
    return -1;
  }

  function verschieben(id, platz, vorId) {
    var i = stelle(id);
    if (i < 0) return;
    var o = ordnung.splice(i, 1)[0];
    o = { id: o.id, platz: platz };
    var ziel = vorId ? stelle(vorId) : -1;
    if (ziel < 0) {
      // ans Ende dieses Bereichs
      var letzte = -1;
      ordnung.forEach(function (x, k) { if (x.platz === platz) letzte = k; });
      ziel = letzte < 0 ? (platz === "auswahl" ? 0 : ordnung.length) : letzte + 1;
    }
    ordnung.splice(ziel, 0, o);
    zeichnen();
  }

  function imBereich(platz) { return ordnung.filter(function (x) { return x.platz === platz; }); }

  function tun(was) {
    if (!gewaehlt) return;
    var i = stelle(gewaehlt), o = ordnung[i], liste = imBereich(o.platz), k = liste.indexOf(o);
    if (was === "fertig") { gewaehlt = null; zeichnen(); return; }
    if (was === "entfernen") {
      var w = nachId(o.id);
      if (!window.confirm("„" + w.titel + "“ von der Seite nehmen?\n\nDas Bild bleibt gespeichert und kann über Claude zurückgeholt werden.")) return;
      ordnung.splice(i, 1);
      if (neueWerke[o.id]) { delete neueWerke[o.id]; werke = werke.filter(function (x) { return x.id !== o.id; }); URL.revokeObjectURL(w.vorschau); }
      else entfernt.push(o.id);
      gewaehlt = null; zeichnen(); return;
    }
    if (was === "wechseln") {
      var anderer = o.platz === "auswahl" ? "zeitreise" : "auswahl";
      var erster = imBereich(anderer)[0];
      verschieben(o.id, anderer, anderer === "zeitreise" && erster ? erster.id : null);
    } else if (was === "vor" && k > 0) verschieben(o.id, o.platz, liste[k - 1].id);
    else if (was === "nach" && k < liste.length - 1) verschieben(o.id, o.platz, liste[k + 2] ? liste[k + 2].id : null);
    else if (was === "anfang" && k > 0) verschieben(o.id, o.platz, liste[0].id);
    else if (was === "ende" && k < liste.length - 1) verschieben(o.id, o.platz, null);
    var el = document.querySelector('.kachel[data-id="' + CSS.escape(gewaehlt) + '"]');
    if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  }

  function werkzeugZeigen() {
    var wz = $("werkzeug");
    if (!gewaehlt || beschaeftigt) { wz.hidden = true; return; }
    var o = ordnung[stelle(gewaehlt)];
    $("werkzeug-titel").textContent = nachId(gewaehlt).titel;
    $("wechseln").textContent = o.platz === "auswahl" ? "↓ in die Zeitreise" : "↑ in die Auswahl";
    wz.hidden = false;
  }

  var ziehtId = null;
  function markenWeg() {
    document.querySelectorAll(".davor,.danach").forEach(function (e) { e.classList.remove("davor", "danach"); });
    document.querySelectorAll(".feld.ziel").forEach(function (e) { e.classList.remove("ziel"); });
  }

  function zielBestimmen(x, y) {
    var el = document.elementFromPoint(x, y);
    var feld = el && el.closest(".feld");
    if (!feld) return null;
    var k = el.closest(".kachel");
    if (k && k.dataset.id !== ziehtId) {
      var r = k.getBoundingClientRect();
      return { feld: feld, kachel: k, danach: x > r.left + r.width / 2 };
    }
    return { feld: feld, kachel: null };
  }

  // Ziehen mit der Maus/dem Trackpad (Zeiger-Ereignisse statt HTML-Drag: zuverlässig auf dem Mac-Trackpad).
  // Erst ab 8 px Bewegung wird gezogen; sonst ist es ein Klick (= auswählen, Knöpfe erscheinen).
  function ziehenEinrichten() {
    var arbeit = $("arbeit"), start = null, geist = null, rollen = 0, letzt = null;
    arbeit.addEventListener("pointerdown", function (e) {
      var k = e.target.closest(".kachel");
      if (!k || beschaeftigt || e.button !== 0) return;
      start = { k: k, x: e.clientX, y: e.clientY, beruehrung: e.pointerType === "touch" };
    });
    window.addEventListener("pointermove", function (e) {
      if (!start) return;
      letzt = e;
      if (!ziehtId) {
        if (Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) < 8) return;
        if (start.beruehrung) { start = null; return; }  // Finger: wischen = rollen; verschieben über die Knöpfe
        ziehtId = start.k.dataset.id;
        var r = start.k.getBoundingClientRect();
        geist = start.k.cloneNode(true);
        geist.className = "kachel geist";
        geist.style.width = r.width + "px";
        start.dx = start.x - r.left; start.dy = start.y - r.top;
        document.body.appendChild(geist);
        start.k.classList.add("zieht");
        document.body.classList.add("zieht-gerade");
      }
      e.preventDefault();
      geist.style.transform = "translate(" + (e.clientX - start.dx) + "px," + (e.clientY - start.dy) + "px) rotate(-2deg)";
      markenWeg();
      var z = zielBestimmen(e.clientX, e.clientY);
      if (z) { z.feld.classList.add("ziel"); if (z.kachel) z.kachel.classList.add(z.danach ? "danach" : "davor"); }
      // am Fensterrand automatisch rollen
      var rand = 70, v = e.clientY < rand ? -14 : e.clientY > innerHeight - rand ? 14 : 0;
      if (v && !rollen) rollen = setInterval(function () { scrollBy(0, v); }, 16);
      if (!v && rollen) { clearInterval(rollen); rollen = 0; }
    });
    function aufhoeren(e, abbrechen) {
      if (!start) return;
      clearInterval(rollen); rollen = 0;
      var id = ziehtId, z = id && !abbrechen ? zielBestimmen(e.clientX, e.clientY) : null;
      markenWeg();
      if (geist) { geist.remove(); geist = null; }
      document.body.classList.remove("zieht-gerade");
      var k = start.k; start = null; ziehtId = null;
      if (!id) {  // Klick
        if (abbrechen) return;
        gewaehlt = gewaehlt === k.dataset.id ? null : k.dataset.id;
        zeichnen();
        return;
      }
      if (!z) { zeichnen(); return; }
      var platz = z.feld.dataset.platz, vorId = null;
      if (z.kachel) {
        if (!z.danach) vorId = z.kachel.dataset.id;
        else { var n = z.kachel.nextElementSibling; while (n && n.dataset.id === id) n = n.nextElementSibling; vorId = n ? n.dataset.id : null; }
      }
      gewaehlt = id;
      verschieben(id, platz, vorId);
    }
    window.addEventListener("pointerup", function (e) { aufhoeren(e, false); });
    window.addEventListener("pointercancel", function (e) { aufhoeren(e, true); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape" && ziehtId) aufhoeren(letzt || e, true); });
    arbeit.addEventListener("keydown", function (e) {
      var k = e.target.closest && e.target.closest(".kachel");
      if (!k) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        gewaehlt = gewaehlt === k.dataset.id ? null : k.dataset.id;
        zeichnen(); k.focus();
        return;
      }
      if (!gewaehlt || k.dataset.id !== gewaehlt) return;
      var m = { ArrowLeft: "vor", ArrowRight: "nach", ArrowUp: "wechseln", ArrowDown: "wechseln", Escape: "fertig" }[e.key];
      if (m === "wechseln") {
        var p = ordnung[stelle(gewaehlt)].platz;
        if ((e.key === "ArrowUp") !== (p === "zeitreise")) return;
      }
      if (m) { e.preventDefault(); tun(m); }
    });
    $("werkzeug").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b && b.dataset.tu) tun(b.dataset.tu);
    });
  }

  // ---------- Merken (nur dieser Browser) ----------
  function merken(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat */ } }
  function lesenMerk(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function vorherLesen() {
    var v = lesenMerk(MERK_VORHER);
    if (!v || !Array.isArray(v) || v.length !== ordnung.length) return null;
    for (var i = 0; i < v.length; i++) if (!nachId(v[i].id)) return null;
    return v;
  }

  // ---------- GitHub ----------
  function gh(pfad, art, inhalt) {
    return fetch(API + pfad, {
      method: art || "GET",
      headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: inhalt ? JSON.stringify(inhalt) : undefined,
      cache: "no-store"
    }).then(function (r) {
      if (r.status === 401) { abgemeldet(); throw new Error("ANMELDEN"); }
      if (!r.ok) return r.text().then(function (t) { throw new Error("GitHub " + r.status + " " + pfad + ": " + t.slice(0, 200)); });
      return r.status === 204 ? null : r.json();
    });
  }

  function b64lesen(s) {
    var bin = atob(s.replace(/\n/g, "")), b = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(b);
  }
  function b64schreiben(s) {
    var b = new TextEncoder().encode(s), bin = "";
    for (var i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  function datenAnzeigen(text) {
    var d = Ordnen.lesen(text);
    quelltext = text;
    werke = d.bloecke;
    kacheln = {};
    document.querySelectorAll(".feld").forEach(function (f) { f.textContent = ""; });
    var entwurf = lesenMerk("ordnen.entwurf");
    geladen = werke.map(function (b) { return { id: b.id, platz: b.platz }; });
    ordnung = geladen.slice();
    neueWerke = {}; entfernt = [];
    if (entwurf && entwurf.basis === JSON.stringify(geladen) && Array.isArray(entwurf.ordnung)) {
      ordnung = entwurf.ordnung.filter(function (o) { return nachId(o.id); });
      var noch = {};
      ordnung.forEach(function (o) { noch[o.id] = true; });
      entfernt = geladen.filter(function (o) { return !noch[o.id]; }).map(function (o) { return o.id; });
    }
    serieZeigen("serie-jc", Ordnen.serie(d.kopf, "jc"));
    serieZeigen("serie-mazar", Ordnen.serie(d.kopf, "mazar"));
    $("anmelden").hidden = true;
    $("arbeit").hidden = false;
    zeichnen();
  }

  function laden() {
    status("Bilder werden geladen …", "", true);
    return gh("/repos/" + REPO).then(function (r) {
      if (!r.permissions || !r.permissions.push) throw new Error("RECHTE");
      return gh("/repos/" + REPO + "/contents/" + DATEI + "?ref=main");
    }).then(function (f) {
      datenAnzeigen(b64lesen(f.content));
      return offeneAenderung();
    }).then(function (pr) {
      if (pr) laufendBeobachten(pr.number, "Es läuft noch eine Änderung. Bitte ein paar Minuten warten.");
      else status("");
    }).catch(fehler);
  }

  function offeneAenderung() {
    return gh("/repos/" + REPO + "/pulls?state=open&per_page=50").then(function (l) {
      return l.filter(function (p) { return p.head && p.head.ref.indexOf("cms/") === 0; })[0] || null;
    });
  }

  function veroeffentlichen() {
    if (beschaeftigt || !geaendert()) return;
    beschaeftigt = true; gewaehlt = null; zeichnen();
    status("Wird abgeschickt …", "", true);
    var vorher = geladen.slice(), neu = ordnung.slice(), zweig = "cms/ordnen-" + new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    var kopfSha, dateiSha, neuText;
    var neuIds = Object.keys(neueWerke), weg = entfernt.slice(), mitBildern = neuIds.length > 0 || weg.length > 0;
    var dateien = {};  // id → Dateiname in static/werke
    var titel = mitBildern ? "Admin: " + [neuIds.length ? neuIds.length + " neue(s) Bild(er)" : "", weg.length ? weg.length + " von der Seite genommen" : ""].filter(Boolean).join(", ") + ", Reihenfolge" : "Admin: Reihenfolge/Platz geändert";
    offeneAenderung().then(function (pr) {
      if (pr) throw new Error("LAEUFT");
      return gh("/repos/" + REPO + "/git/ref/heads/main");
    }).then(function (ref) {
      kopfSha = ref.object.sha;
      if (!neuIds.length) return null;
      return gh("/repos/" + REPO + "/contents/static/werke?ref=" + kopfSha);
    }).then(function (liste) {
      // Dateinamen für neue Bilder: nie eine vorhandene Datei überschreiben
      var belegt = {};
      (liste || []).forEach(function (x) { belegt[x.name] = true; });
      neuIds.forEach(function (id) {
        var name = id + ".jpg", n = 2;
        while (belegt[name]) name = id + "-" + n++ + ".jpg";
        belegt[name] = true; dateien[id] = name;
      });
      return gh("/repos/" + REPO + "/contents/" + DATEI + "?ref=" + kopfSha);
    }).then(function (f) {
      dateiSha = f.sha;
      var bloecke = {};
      neuIds.forEach(function (id) {
        var x = neueWerke[id].felder;
        bloecke[id] = Ordnen.block({ id: id, titel: x.titel, jahr: x.jahr, technik: x.technik, masse: x.masse, bereich: x.bereich,
                                     platz: "zeitreise", bilder: [dateien[id]] });
      });
      // wirft ANDERS, wenn sich die Werke inzwischen geändert haben (z. B. über Claude)
      neuText = mitBildern ? Ordnen.schreiben(b64lesen(f.content), neu, { neu: bloecke, entfernt: weg }) : Ordnen.schreiben(b64lesen(f.content), neu);
      return gh("/repos/" + REPO + "/git/refs", "POST", { ref: "refs/heads/" + zweig, sha: kopfSha });
    }).then(function () {
      // neue Bilder nacheinander auf den Zweig, dann die Liste
      return neuIds.reduce(function (p, id) {
        return p.then(function () { return alsB64(neueWerke[id].blob); }).then(function (inhalt) {
          return gh("/repos/" + REPO + "/contents/static/werke/" + dateien[id], "PUT", {
            message: "Admin: neues Bild " + dateien[id], content: inhalt, branch: zweig
          });
        });
      }, Promise.resolve());
    }).then(function () {
      return gh("/repos/" + REPO + "/contents/" + DATEI, "PUT", {
        message: titel, content: b64schreiben(neuText), sha: dateiSha, branch: zweig
      });
    }).then(function () {
      return gh("/repos/" + REPO + "/pulls", "POST", {
        title: titel, head: zweig, base: "main",
        body: "Auf ulfseidl.at/admin geändert. Wird nach grüner Prüfung automatisch veröffentlicht." +
          (neuIds.length ? "\n\nNeu: " + neuIds.map(function (id) { return neueWerke[id].felder.titel + " (" + dateien[id] + ")"; }).join(", ") : "") +
          (weg.length ? "\n\nVon der Seite genommen (Bilddateien bleiben): " + weg.join(", ") : "")
      });
    }).then(function (pr) {
      merken(MERK_VORHER, vorher);
      merken("ordnen.entwurf", null);
      neuIds.forEach(function (id) { var w = nachId(id); if (w) w.bilder = [dateien[id]]; });
      werke = werke.filter(function (w) { return weg.indexOf(w.id) < 0; });
      neueWerke = {}; entfernt = [];
      geladen = neu.slice();
      quelltext = neuText;
      laufendBeobachten(pr.number, "Wird geprüft … etwa 3 Minuten. Du kannst das Fenster offen lassen.");
    }).catch(function (e) { beschaeftigt = false; fehler(e); });
  }

  function alsB64(blob) {
    return new Promise(function (ja, nein) {
      var r = new FileReader();
      r.onload = function () { ja(String(r.result).split(",")[1]); };
      r.onerror = function () { nein(r.error); };
      r.readAsDataURL(blob);
    });
  }

  // ---------- Neues Bild ----------
  var MAX_KANTE = 1400, MAX_BYTES = 380 * 1024;
  var neuBlob = null, neuUrl = null;

  function alsJpeg(leinwand, q) {
    return new Promise(function (ja) { leinwand.toBlob(ja, "image/jpeg", q); });
  }

  // Foto aufrecht drehen (EXIF), auf höchstens 1400 px verkleinern, unter 380 KB bringen (Prüfung erlaubt 400 KB)
  function verkleinern(datei) {
    return createImageBitmap(datei, { imageOrientation: "from-image" }).then(function (bmp) {
      var kante = MAX_KANTE;
      function versuch(stufe) {
        var f = Math.min(1, kante / Math.max(bmp.width, bmp.height));
        var c = document.createElement("canvas");
        c.width = Math.round(bmp.width * f); c.height = Math.round(bmp.height * f);
        var g = c.getContext("2d");
        g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(bmp, 0, 0, c.width, c.height);
        var qs = [0.86, 0.8, 0.72, 0.64, 0.56, 0.5];
        return qs.reduce(function (p, q) {
          return p.then(function (b) { return b && b.size < MAX_BYTES ? b : alsJpeg(c, q); });
        }, Promise.resolve(null)).then(function (b) {
          if (b && b.size < MAX_BYTES) return b;
          if (stufe > 4) throw new Error("ZUGROSS");
          kante = Math.round(kante * 0.8);
          return versuch(stufe + 1);
        });
      }
      return versuch(0);
    });
  }

  function neuFormularPruefen() {
    var titel = $("neu-titel").value.trim();
    var bereich = document.querySelector('#neu-form input[name="bereich"]:checked');
    $("neu-ok").disabled = !(neuBlob && titel && bereich);
  }

  function neuMeldung(text) { var m = $("neu-meldung"); m.textContent = text || ""; m.hidden = !text; }

  function neuDateiNehmen(datei) {
    if (!datei) return;
    neuMeldung("");
    if (/heic|heif/i.test(datei.type) || /\.hei[cf]$/i.test(datei.name)) {
      return neuMeldung("Dieses Foto-Format (HEIC) kann der Browser nicht öffnen. Bitte als JPG sichern – oder das Bild Claude geben.");
    }
    $("ablage-text").textContent = "Wird vorbereitet …";
    verkleinern(datei).then(function (blob) {
      neuBlob = blob;
      if (neuUrl) URL.revokeObjectURL(neuUrl);
      neuUrl = URL.createObjectURL(blob);
      var v = $("neu-vorschau"); v.src = neuUrl; v.hidden = false;
      $("ablage-text").hidden = true;
      if (!$("neu-titel").value) $("neu-titel").focus();
      neuFormularPruefen();
    }).catch(function () {
      neuBlob = null;
      $("ablage-text").innerHTML = "Foto hierher ziehen<br><small>oder hier klicken und auswählen</small>";
      neuMeldung("Dieses Bild ließ sich nicht öffnen. Bitte ein JPG-Foto nehmen – oder das Bild Claude geben.");
      neuFormularPruefen();
    });
  }

  function neuOeffnen() {
    $("neu-form").reset();
    neuBlob = null; neuUrl = null; neuMeldung("");
    $("neu-vorschau").hidden = true; $("neu-vorschau").removeAttribute("src");
    $("ablage-text").hidden = false;
    $("ablage-text").innerHTML = "Foto hierher ziehen<br><small>oder hier klicken und auswählen</small>";
    neuFormularPruefen();
    $("neu-dialog").showModal();
  }

  function neuUebernehmen() {
    var felder = {
      titel: $("neu-titel").value.trim(), jahr: $("neu-jahr").value.trim(), technik: $("neu-technik").value.trim(),
      masse: $("neu-masse").value.trim(),
      bereich: document.querySelector('#neu-form input[name="bereich"]:checked').value
    };
    var platz = document.querySelector('#neu-form input[name="platz"]:checked').value;
    var basis = Ordnen.slug(felder.titel + (felder.jahr ? "-" + felder.jahr : "")) || "werk", id = basis, n = 2;
    while (nachId(id) || entfernt.indexOf(id) >= 0) id = basis + "-" + n++;
    delete kacheln[id];  // weggeworfenes gleichnamiges Werk: keine alte Kachel wiederverwenden
    neueWerke[id] = { felder: felder, blob: neuBlob };
    werke.push({ id: id, platz: platz, titel: felder.titel, jahr: felder.jahr, bilder: ["neu.jpg"], vorschau: neuUrl, text: "" });
    // Auswahl: vorne. Zeitreise: nach Jahr einsortiert (ohne Jahr ans Ende), wie die übrigen Werke
    var o = { id: id, platz: platz }, liste = imBereich(platz), vor = null;
    if (platz === "auswahl") vor = liste[0] || null;
    else {
      var j = jahrZahl(felder.jahr);
      vor = liste.filter(function (x) { return jahrZahl(nachId(x.id).jahr) > j; })[0] || null;
    }
    if (vor) ordnung.splice(stelle(vor.id), 0, o);
    else if (platz === "auswahl") ordnung.unshift(o);
    else ordnung.push(o);
    neuBlob = null; neuUrl = null;
    gewaehlt = id;
    zeichnen();
    var el = document.querySelector('.kachel[data-id="' + CSS.escape(id) + '"]');
    if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: "center", behavior: "smooth" }); }
    status("„" + felder.titel + "“ ist dazugekommen. Wenn alles passt: oben rechts „Veröffentlichen“.", "gut");
  }

  function jahrZahl(s) { var m = String(s || "").match(/\d{4}/); return m ? +m[0] : 9999; }

  function neuEinrichten() {
    $("neu-knopf").addEventListener("click", neuOeffnen);
    $("neu-abbrechen").addEventListener("click", function () { $("neu-dialog").close(); });
    $("neu-datei").addEventListener("change", function (e) { neuDateiNehmen(e.target.files[0]); });
    var ab = $("ablage");
    ["dragenter", "dragover"].forEach(function (t) { ab.addEventListener(t, function (e) { e.preventDefault(); ab.classList.add("ziel"); }); });
    ["dragleave", "drop"].forEach(function (t) { ab.addEventListener(t, function () { ab.classList.remove("ziel"); }); });
    ab.addEventListener("drop", function (e) { e.preventDefault(); neuDateiNehmen(e.dataTransfer.files[0]); });
    $("neu-form").addEventListener("input", neuFormularPruefen);
    $("neu-form").addEventListener("change", neuFormularPruefen);
    $("neu-form").addEventListener("submit", function (e) {
      if ($("neu-ok").disabled) { e.preventDefault(); return; }
      neuUebernehmen();
    });
  }

  // PR offen → gemergt → Deploy (hugo.yml) für den Merge-Stand fertig = online
  function laufendBeobachten(nr, text) {
    beschaeftigt = true; knoepfe(); werkzeugZeigen();
    status(text, "", true);
    var beginn = Date.now(), mergeSha = null;
    function runde() {
      if (Date.now() - beginn > 20 * 60 * 1000) return ende(false, "Das dauert ungewöhnlich lange. Schau später auf die Seite – oder frag Claude.");
      var schritt = mergeSha ? deployPruefen() : gh("/repos/" + REPO + "/pulls/" + nr).then(function (pr) {
        if (pr.merged) { mergeSha = pr.merge_commit_sha; status("Geprüft ✓ – wird jetzt veröffentlicht …", "", true); return; }
        if (pr.state === "closed") return ende(false, "Hat nicht geklappt. Auf der Seite hat sich nichts verändert.");
        return gh("/repos/" + REPO + "/commits/" + pr.head.sha + "/check-runs").then(function (c) {
          var laeufe = c.check_runs || [];
          var rot = laeufe.some(function (r) { return r.conclusion === "failure" || r.conclusion === "cancelled" || r.conclusion === "timed_out"; });
          if (rot) return wegraeumen(pr).then(function () {
            return ende(false, "Hat nicht geklappt. Auf der Seite hat sich nichts verändert. Du kannst es nochmal versuchen; sonst schauen Claude oder Emanuel nach.");
          });
          // grün, aber nach 6 Minuten nicht gemergt: Auto-Merge hat abgelehnt
          var gruen = laeufe.length && laeufe.every(function (r) { return r.status === "completed" && (r.conclusion === "success" || r.conclusion === "skipped" || r.conclusion === "neutral"); });
          if (gruen && Date.now() - new Date(pr.created_at).getTime() > 6 * 60 * 1000)
            return ende(false, "Geprüft, aber nicht veröffentlicht. Claude oder Emanuel schließen den alten Vorschlag – sag ihnen kurz Bescheid.");
        });
      });
      Promise.resolve(schritt).then(function (fertig) { if (fertig !== true && beschaeftigt) setTimeout(runde, 10000); })
        .catch(function (e) { if (e.message === "ANMELDEN") return; setTimeout(runde, 15000); });
    }
    function deployPruefen() {
      return gh("/repos/" + REPO + "/actions/workflows/hugo.yml/runs?branch=main&per_page=10").then(function (l) {
        var lauf = (l.workflow_runs || []).filter(function (r) { return r.head_sha === mergeSha; })[0];
        if (!lauf || lauf.status !== "completed") return;
        if (lauf.conclusion === "success") return ende(true);
        return ende(false, "Geprüft, aber das Veröffentlichen hat nicht geklappt. Emanuel schaut nach.");
      });
    }
    function ende(gut, text) {
      beschaeftigt = false;
      if (gut) {
        var a = document.createElement("a"); a.href = "/"; a.target = "_blank"; a.textContent = "ansehen";
        var f = document.createDocumentFragment();
        f.appendChild(document.createTextNode("Ist online ✓ – ")); f.appendChild(a);
        status(f, "gut");
      } else status(text, "schlecht");
      knoepfe();
      return true;
    }
    runde();
  }

  // Eigenen roten Vorschlag schließen und den Zweig löschen (nur cms/ordnen-…, nur von dieser Seite angelegt)
  function wegraeumen(pr) {
    if (!pr.head || pr.head.ref.indexOf("cms/ordnen-") !== 0) return Promise.resolve();
    return gh("/repos/" + REPO + "/pulls/" + pr.number, "PATCH", { state: "closed" })
      .then(function () { return gh("/repos/" + REPO + "/git/refs/heads/" + pr.head.ref, "DELETE"); })
      .catch(function () { /* bleibt offen – Claude/Emanuel räumen auf */ });
  }

  function fehler(e) {
    var m = (e && e.message) || "";
    if (m === "ANMELDEN") return;
    if (m === "RECHTE") return status("Dieses GitHub-Konto darf die Seite nicht ändern. Bitte mit Ulfs Konto anmelden.", "schlecht");
    if (m === "LAEUFT") return status("Es läuft noch eine Änderung. Bitte ein paar Minuten warten und dann nochmal drücken.", "schlecht");
    if (m.indexOf("ANDERS") === 0) return status("Die Bilder wurden inzwischen woanders geändert. Bitte die Seite neu laden.", "schlecht");
    if (window.console) console.error(e);
    status("Hat nicht geklappt. Auf der Seite hat sich nichts verändert. Bitte nochmal versuchen.", "schlecht");
  }

  // ---------- Anmeldung (Protokoll des OAuth-Vermittlers, wie Decap) ----------
  function abgemeldet() {
    token = null; merken(MERK_TOKEN, null);
    beschaeftigt = false;
    if (ordnung.length && geaendert()) merken("ordnen.entwurf", { basis: JSON.stringify(geladen), ordnung: ordnung });
    $("arbeit").hidden = true; $("anmelden").hidden = false; $("werkzeug").hidden = true;
    status("Bitte neu anmelden – deine Ordnung bleibt erhalten.", "");
  }

  function anmelden() {
    var fenster = window.open(ANMELDUNG + "/auth", "anmelden", "width=620,height=720");
    if (!fenster) return status("Das Anmeldefenster wurde blockiert. Bitte Pop-ups für ulfseidl.at erlauben.", "schlecht");
    status("Anmeldung im neuen Fenster …", "", true);
    function antwort(e) {
      if (e.origin !== ANMELDUNG) return;
      if (e.data === "authorizing:github") { e.source.postMessage("authorizing:github", e.origin); return; }
      var m = typeof e.data === "string" && e.data.match(/^authorization:github:(success|error):(.*)$/);
      if (!m) return;
      window.removeEventListener("message", antwort);
      var inhalt = {};
      try { inhalt = JSON.parse(m[2]); } catch (x) { /* leer */ }
      if (m[1] !== "success" || !inhalt.token) return status(inhalt.message || "Anmeldung hat nicht geklappt.", "schlecht");
      token = inhalt.token;
      merken(MERK_TOKEN, { token: token, bis: Date.now() + 30 * 24 * 3600 * 1000 });
      laden();
    }
    window.addEventListener("message", antwort);
  }

  // ---------- Start ----------
  window.addEventListener("beforeunload", function (e) {
    if (ordnung.length && geaendert() && !beschaeftigt) { e.preventDefault(); e.returnValue = ""; }
  });
  document.addEventListener("DOMContentLoaded", function () {
    ziehenEinrichten();
    $("anmeldeknopf").addEventListener("click", anmelden);
    $("veroeffentlichen").addEventListener("click", veroeffentlichen);
    $("zuruecksetzen").addEventListener("click", function () {
      if (!window.confirm("Alle Änderungen seit dem letzten Veröffentlichen verwerfen?")) return;
      Object.keys(neueWerke).forEach(function (id) { var w = nachId(id); if (w && w.vorschau) URL.revokeObjectURL(w.vorschau); });
      werke = werke.filter(function (w) { return !neueWerke[w.id]; });
      neueWerke = {}; entfernt = [];
      ordnung = geladen.slice(); gewaehlt = null; merken("ordnen.entwurf", null); zeichnen(); status("");
    });
    neuEinrichten();
    $("vorher").addEventListener("click", function () { var v = vorherLesen(); if (v) { ordnung = v; gewaehlt = null; zeichnen(); } });
    // Nur am eigenen Rechner beim Bauen: ?probe lädt eine Probe-Datei statt GitHub (nie auf ulfseidl.at)
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]probe/.test(location.search)) {
      fetch("probe-werke.yaml").then(function (r) { return r.text(); }).then(datenAnzeigen).catch(fehler);
      return;
    }
    var t = lesenMerk(MERK_TOKEN);
    if (t && t.token && t.bis > Date.now()) { token = t.token; laden(); }
    else { $("anmelden").hidden = false; }
  });
})();
