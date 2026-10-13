"use strict";

const APP_VERSION = "1.1.0";
const LIVE_MAX_SIDE = 1600;   // résolution max envoyée au décodeur en direct
const PHOTO_MAX_SIDE = 3200;  // résolution max pour une photo importée
const HISTORY_KEY = "symbo.history.v1";
const SETTINGS_KEY = "symbo.settings.v1";
const HISTORY_MAX = 200;

const $ = (id) => document.getElementById(id);
const video = $("video");
const overlay = $("overlay");
const statusEl = $("status");
const work = document.createElement("canvas");
const workCtx = work.getContext("2d", { willReadFrequently: true });

const settings = Object.assign({ sound: true }, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));

let stream = null;
let track = null;
let scanning = false;
let busy = false;
let backCameras = [];
let cameraIndex = -1;
let torchOn = false;
let lastScale = 1;
let msgId = 0;
const pending = new Map();

/* ---------- Décodeur (Web Worker) ---------- */

const worker = new Worker("decoder-worker.js");
worker.onmessage = (e) => {
  const cb = pending.get(e.data.id);
  if (cb) { pending.delete(e.data.id); cb(e.data); }
};

function decode(imageData, deep) {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    worker.postMessage({ id, imageData, deep }, [imageData.data.buffer]);
  });
}

/* ---------- Caméra ---------- */

function setStatus(t) { statusEl.textContent = t; statusEl.classList.toggle("hidden", !t); }

async function startCamera() {
  stopCamera();
  $("start-panel").classList.add("hidden");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showStart("Caméra indisponible : l'appli doit être ouverte en HTTPS dans Safari ou Chrome.");
    return;
  }
  setStatus("Démarrage de la caméra…");
  const base = { width: { ideal: 1920 }, height: { ideal: 1080 } };
  const cam = backCameras[cameraIndex];
  const video_c = cam ? { ...base, deviceId: { exact: cam.deviceId } } : { ...base, facingMode: { ideal: "environment" } };
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: video_c });
  } catch (err) {
    const denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
    showStart(denied
      ? "Accès à la caméra refusé. Autorisez la caméra pour ce site dans les réglages du navigateur, puis réessayez."
      : "Impossible de démarrer la caméra (" + (err && err.name ? err.name : err) + ").");
    return;
  }
  video.srcObject = stream;
  try { await video.play(); } catch (_) { /* iOS : lecture lancée au prochain geste */ }
  track = stream.getVideoTracks()[0];
  torchOn = false;
  await setupCapabilities();
  await listCameras();
  scanning = true;
  setStatus("Visez un code");
  requestAnimationFrame(tick);
}

function stopCamera() {
  scanning = false;
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  track = null;
}

function showStart(msg) {
  setStatus("");
  $("start-msg").textContent = msg;
  $("start-panel").classList.remove("hidden");
}

async function setupCapabilities() {
  const caps = (track && track.getCapabilities) ? track.getCapabilities() : {};
  if (caps.focusMode && caps.focusMode.includes("continuous")) {
    track.applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(() => {});
  }
  $("btn-torch").classList.toggle("hidden", !caps.torch);
  $("btn-torch").classList.remove("on");
  const zoom = $("zoom");
  if (caps.zoom && caps.zoom.max > caps.zoom.min) {
    zoom.min = caps.zoom.min;
    zoom.max = Math.min(caps.zoom.max, 10);
    zoom.step = caps.zoom.step || 0.1;
    zoom.value = (track.getSettings && track.getSettings().zoom) || caps.zoom.min;
    $("zoom-max").textContent = Math.round(zoom.max) + "×";
    $("zoom-wrap").classList.remove("hidden");
  } else {
    $("zoom-wrap").classList.add("hidden");
  }
}

async function listCameras() {
  try {
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
    const back = devices.filter((d) => /back|rear|arri[eè]re|environment|dos/i.test(d.label));
    backCameras = back.length ? back : devices;
    if (cameraIndex < 0 && track) {
      const cur = track.getSettings ? track.getSettings().deviceId : null;
      cameraIndex = Math.max(0, backCameras.findIndex((d) => d.deviceId === cur));
    }
    $("btn-switch").classList.toggle("hidden", backCameras.length < 2);
  } catch (_) {
    $("btn-switch").classList.add("hidden");
  }
}

/* ---------- Boucle de lecture ---------- */

function tick() {
  if (!scanning) return;
  if (!busy && video.readyState >= 2 && video.videoWidth) grabFrame();
  requestAnimationFrame(tick);
}

async function grabFrame() {
  busy = true;
  const vw = video.videoWidth, vh = video.videoHeight;
  const scale = Math.min(1, LIVE_MAX_SIDE / Math.max(vw, vh));
  work.width = Math.round(vw * scale);
  work.height = Math.round(vh * scale);
  workCtx.drawImage(video, 0, 0, work.width, work.height);
  const img = workCtx.getImageData(0, 0, work.width, work.height);
  const res = await decode(img, false);
  if (scanning && res.results && res.results.length) {
    lastScale = scale;
    scanning = false;
    feedback();
    drawLiveOverlay(res.results, scale);
    const snap = snapshotWithBoxes(work, res.results);
    setTimeout(() => { clearOverlay(); showResults(res.results, snap, true); }, 220);
  }
  busy = false;
}

function drawLiveOverlay(results, scale) {
  const cw = overlay.clientWidth, ch = overlay.clientHeight;
  overlay.width = cw * devicePixelRatio; overlay.height = ch * devicePixelRatio;
  const ctx = overlay.getContext("2d");
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const vw = video.videoWidth, vh = video.videoHeight;
  const s = Math.max(cw / vw, ch / vh);
  const ox = (cw - vw * s) / 2, oy = (ch - vh * s) / 2;
  const map = (p) => [(p.x / scale) * s + ox, (p.y / scale) * s + oy];
  ctx.lineWidth = 4; ctx.strokeStyle = "#2ecc71"; ctx.fillStyle = "rgba(46,204,113,.25)";
  for (const r of results) drawPoly(ctx, r.position, map);
}

function clearOverlay() { overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height); }

function drawPoly(ctx, pos, map) {
  const pts = [pos.topLeft, pos.topRight, pos.bottomRight, pos.bottomLeft].map(map);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

function snapshotWithBoxes(srcCanvas, results) {
  const c = document.createElement("canvas");
  const s = Math.min(1, 1000 / Math.max(srcCanvas.width, srcCanvas.height));
  c.width = Math.round(srcCanvas.width * s); c.height = Math.round(srcCanvas.height * s);
  const ctx = c.getContext("2d");
  ctx.drawImage(srcCanvas, 0, 0, c.width, c.height);
  ctx.lineWidth = Math.max(3, c.width / 250); ctx.strokeStyle = "#2ecc71"; ctx.fillStyle = "rgba(46,204,113,.18)";
  ctx.font = `bold ${Math.max(16, c.width / 32)}px sans-serif`;
  results.forEach((r, i) => {
    drawPoly(ctx, r.position, (p) => [p.x * s, p.y * s]);
    if (results.length > 1) {
      ctx.fillStyle = "#2ecc71";
      ctx.fillText(String(i + 1), r.position.topLeft.x * s + 4, r.position.topLeft.y * s - 6);
      ctx.fillStyle = "rgba(46,204,113,.18)";
    }
  });
  return c.toDataURL("image/jpeg", 0.82);
}

/* ---------- Retour sonore / vibration ---------- */

let audioCtx = null;
function unlockAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}
function feedback() {
  if (navigator.vibrate) navigator.vibrate(60);
  if (!settings.sound || !audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.frequency.value = 2200; o.type = "square";
  g.gain.setValueAtTime(0.08, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.09);
  o.connect(g).connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.1);
}

/* ---------- Photo importée ---------- */

async function decodeFile(file) {
  const wasScanning = scanning;
  scanning = false;
  setStatus("Analyse de la photo…");
  try {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch (_) { bmp = await createImageBitmap(file); }
    const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    const res = await decode(ctx.getImageData(0, 0, c.width, c.height), true);
    if (res.error) throw new Error(res.error);
    if (!res.results.length) {
      toast("Aucun code détecté sur la photo");
      if (wasScanning || stream) resumeScan();
      return [];
    }
    feedback();
    showResults(res.results, snapshotWithBoxes(c, res.results), true);
    return res.results;
  } catch (err) {
    toast("Erreur d'analyse : " + err.message);
    if (stream) resumeScan();
    return [];
  }
}

function resumeScan() {
  if (!stream) { startCamera(); return; }
  scanning = true;
  setStatus("Visez un code");
  requestAnimationFrame(tick);
}

/* ---------- Affichage des résultats ---------- */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function parseExtra(extra) {
  try { return extra ? JSON.parse(extra) : {}; } catch (_) { return {}; }
}

function symbolDataUrl(sym) {
  if (!sym || !sym.width || !sym.height) return null;
  const q = 2; // zone de silence ajoutée, en modules
  const c = document.createElement("canvas");
  c.width = sym.width + 2 * q; c.height = sym.height + 2 * q;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
  const img = ctx.createImageData(sym.width, sym.height);
  for (let i = 0; i < sym.data.length; i++) {
    const v = sym.data[i];
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, q, q);
  return c.toDataURL("image/png");
}

const EC_QR = { L: "L (≈7 %)", M: "M (≈15 %)", Q: "Q (≈25 %)", H: "H (≈30 %)" };

function versionText(r, x) {
  const v = x.Version || r.version;
  if (!v) return "";
  if (r.format === "QRCode" || r.format === "QRCodeModel2" || r.format === "QRCodeModel1") {
    const n = parseInt(v, 10);
    return n ? `Version ${n} (${17 + 4 * n} × ${17 + 4 * n} modules)` : v;
  }
  if (r.format === "MicroQRCode") {
    const n = parseInt(String(v).replace(/\D/g, ""), 10);
    return n ? `M${n} (${9 + 2 * n} × ${9 + 2 * n} modules)` : v;
  }
  const m = /^(\d+)x(\d+)$/.exec(v);
  if (m) return `${m[1]} × ${m[2]} modules`;
  if (r.format.startsWith("Aztec") && /^\d+$/.test(v)) return `${v} couche${+v > 1 ? "s" : ""} de données`;
  return String(v);
}

function checkDigitText(r) {
  const f = r.format;
  if (["EAN13", "EAN8", "UPCA", "UPCE", "ISBN", "ITF14"].includes(f)) return "Obligatoire — vérifiée ✔";
  if (["Code128", "Code93"].includes(f)) return "Obligatoire — vérifiée ✔";
  if (f.startsWith("DataBar")) return "Obligatoire — vérifiée ✔";
  if (["Code39", "Code39Std", "Code39Ext", "ITF", "Codabar"].includes(f)) {
    const m = (r.symbologyIdentifier || "").slice(2);
    if (["1", "3", "5", "7"].includes(m)) return "Présente — vérifiée ✔";
    return "Optionnelle — non vérifiée";
  }
  return "";
}

function renderResult(r, idx, total) {
  const info = symbologyInfo(r.format);
  const x = parseExtra(r.extra);
  const bytes = r.bytes instanceof Uint8Array ? r.bytes : new Uint8Array(r.bytes || []);
  const segs = escapedSegments(bytes);
  const hasCtrl = segs.some((s) => s.ctrl);
  const symUrl = r.symbol ? symbolDataUrl(r.symbol) : null;
  const is2D = info.dim.startsWith("2D");
  const gs1 = r.contentType === "GS1" ? parseGs1Hri(r.text) : null;
  const iso = r.contentType === "ISO15434" ? parseIso15434(bytes) : null;

  const badges = [`<span class="badge accent">${esc(info.dim)}</span>`];
  if (gs1) badges.push('<span class="badge ok">GS1</span>');
  if (iso) badges.push('<span class="badge ok">ISO 15434</span>');
  if (r.isInverted) badges.push('<span class="badge warn">Contraste inversé</span>');
  if (r.isMirrored) badges.push('<span class="badge warn">En miroir</span>');
  if (r.hasECI) badges.push('<span class="badge">ECI</span>');
  if (r.sequenceSize >= 0) badges.push('<span class="badge warn">Structured Append</span>');
  if (hasCtrl) badges.push('<span class="badge warn">Caractères de contrôle</span>');
  if (x.ReaderInit || r.readerInit) badges.push('<span class="badge bad">Code de programmation</span>');

  const rows = [];
  const add = (k, v, mono) => { if (v !== "" && v != null) rows.push(`<tr><td>${esc(k)}</td><td${mono ? ' class="mono"' : ""}>${esc(v)}</td></tr>`); };
  add("Symbologie", `${info.name}`);
  add("Nom technique", r.format, true);
  add("Identifiant AIM", r.symbologyIdentifier ? `${r.symbologyIdentifier}  ${explainAim(r.symbologyIdentifier) ? "— " + explainAim(r.symbologyIdentifier) : ""}` : "");
  add("Type de contenu", CONTENT_TYPES_FR[r.contentType] || r.contentType);
  add("Longueur", `${bytes.length} octet${bytes.length > 1 ? "s" : ""}`);
  add("Caractères de contrôle", hasCtrl ? controlCharSummary(bytes) || "octets > 127" : "aucun");
  add("Version / taille", versionText(r, x));
  if (is2D && r.symbol && r.symbol.width && !/x/.test(x.Version || "")) add("Matrice", `${r.symbol.width} × ${r.symbol.height} modules`);
  const ec = x.ECLevel || r.ecLevel;
  if (ec) add("Correction d'erreur", EC_QR[ec] || (/^\d$/.test(ec) && r.format.includes("PDF417") ? `Niveau ${ec}` : ec));
  if (x.DataMask !== undefined) add("Masque de données", String(x.DataMask));
  if (x.UEC !== undefined) {
    const uec = Number(x.UEC);
    if (!isNaN(uec)) add("Marge de correction restante", `${Math.round(uec * 100)} % (indicatif, pas un grade ISO)`);
  }
  add("Clé de contrôle", checkDigitText(r));
  if (x.EanAddOn) add("Add-on EAN", x.EanAddOn, true);
  if (x.UPCE) add("UPC-E d'origine", x.UPCE, true);
  if (r.sequenceSize >= 0) add("Structured Append", `Symbole ${r.sequenceIndex + 1} / ${r.sequenceSize || "?"}${r.sequenceId ? " — ID " + r.sequenceId : ""}`);
  for (const k of ["FileId", "FileName", "FileSize", "Sender", "Addressee", "Timestamp", "Checksum"]) if (x[k] !== undefined) add("Macro PDF417 " + k, String(x[k]));
  add("ECI", r.hasECI ? "Oui" : "Non");
  add("Contraste", r.isInverted ? "Inversé (clair sur foncé)" : "Normal (foncé sur clair)");
  if (["QRCode", "QRCodeModel1", "QRCodeModel2", "MicroQRCode", "RMQRCode", "DataMatrix"].includes(r.format)) add("En miroir", r.isMirrored ? "Oui" : "Non");
  if (r.rotation !== undefined) add("Rotation dans l'image", `${Math.round(r.rotation)}°`);
  if (info.dim === "1D" && r.lineCount > 0) add("Lignes de balayage concordantes", String(r.lineCount));

  let structured = "";
  if (gs1) {
    structured = `<h3 class="sec">Champs GS1</h3><table class="kv">` + gs1.map((f) =>
      `<tr><td><span class="ai">(${esc(f.ai)})</span>${esc(f.label)}</td><td class="mono">${esc(f.display)}${f.display !== f.value ? `<br><span class="muted small">${esc(f.value)}</span>` : ""}${f.note ? `<br><span class="${f.checkOk ? "note-ok" : "note-bad"}">${esc(f.note)}</span>` : ""}</td></tr>`).join("") + `</table>`;
  }
  if (iso) {
    structured = iso.map((b) => `<h3 class="sec">ISO 15434 — format ${esc(b.format)}</h3><p class="desc">${esc(b.label)}</p><table class="kv">` +
      b.fields.map((f) => `<tr><td>${f.id ? `<span class="ai">${esc(f.id)}</span>` : ""}${esc(f.label)}</td><td class="mono">${esc(f.value)}</td></tr>`).join("") +
      `</table><p class="muted small">Libellés des identifiants : interprétation indicative.</p>`).join("");
  }

  const escapedHtml = segs.map((s) => (s.ctrl ? `<span class="ctrl">${esc(s.t)}</span>` : esc(s.t))).join("") || '<span class="muted">(vide)</span>';
  const views = {
    text: esc(r.text) || '<span class="muted">(vide)</span>',
    ctrl: escapedHtml,
    hex: esc(hexDump(bytes)),
  };
  const defView = hasCtrl ? "ctrl" : "text";

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="sym-head">
      <div>
        ${total > 1 ? `<div class="muted small">Code ${idx + 1} / ${total}</div>` : ""}
        <div class="sym-name">${esc(info.name)}</div>
        <div class="sym-sub">${esc(r.symbologyIdentifier || "")}${explainAim(r.symbologyIdentifier) ? " · " + esc(explainAim(r.symbologyIdentifier)) : ""}</div>
      </div>
      ${symUrl ? `<img class="symbol-img${is2D ? "" : " linear"}" src="${symUrl}" alt="Symbole reconstruit">` : ""}
    </div>
    <div class="badges">${badges.join("")}</div>

    <h3 class="sec">Données</h3>
    <div class="tabs" role="tablist">
      <button data-v="text">Texte</button>
      <button data-v="ctrl">Caractères visibles</button>
      <button data-v="hex">Hexa</button>
    </div>
    <div class="data"></div>
    <div class="data-actions">
      <button class="mini" data-act="copy">Copier</button>
      ${navigator.share ? '<button class="mini" data-act="share">Partager</button>' : ""}
    </div>

    ${structured}

    <h3 class="sec">Caractéristiques</h3>
    <table class="kv">${rows.join("")}</table>

    ${info.desc ? `<h3 class="sec">À propos de cette symbologie</h3><p class="desc">${esc(info.desc)}</p>${info.uses ? `<p class="desc"><span class="muted">Usages courants :</span> ${esc(info.uses)}</p>` : ""}` : ""}
  `;

  const dataEl = card.querySelector(".data");
  const tabs = card.querySelectorAll(".tabs button");
  let current = defView;
  const setView = (v) => {
    current = v;
    dataEl.innerHTML = views[v];
    tabs.forEach((b) => b.classList.toggle("active", b.dataset.v === v));
  };
  tabs.forEach((b) => b.addEventListener("click", () => setView(b.dataset.v)));
  setView(defView);

  const plain = { text: r.text, ctrl: segs.map((s) => s.t).join(""), hex: hexDump(bytes) };
  card.querySelector('[data-act="copy"]').addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(plain[current]); toast("Copié"); } catch (_) { toast("Copie impossible"); }
  });
  const shareBtn = card.querySelector('[data-act="share"]');
  if (shareBtn) shareBtn.addEventListener("click", () => {
    navigator.share({ title: info.name, text: `${info.name} (${r.symbologyIdentifier || r.format})\n${plain.ctrl}` }).catch(() => {});
  });
  return card;
}

function showResults(results, snapshot, save) {
  setStatus("");
  const body = $("result-body");
  body.innerHTML = "";
  if (snapshot) {
    const img = document.createElement("img");
    img.className = "snapshot"; img.src = snapshot; img.alt = "Image analysée";
    body.appendChild(img);
  }
  results.forEach((r, i) => body.appendChild(renderResult(r, i, results.length)));
  $("result-title").textContent = results.length > 1 ? `${results.length} codes détectés` : "Résultat";
  $("result").classList.remove("hidden");
  body.scrollTop = 0;
  if (save) results.forEach(saveHistory);
}

function closeResult() {
  $("result").classList.add("hidden");
  resumeScan();
}

/* ---------- Historique ---------- */

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch (_) { return []; }
}

function saveHistory(r) {
  const h = loadHistory();
  const { symbol, position, ...rest } = r;
  h.unshift({ ...rest, bytes: hexDump(r.bytes).replace(/ /g, ""), ts: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, HISTORY_MAX)));
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function renderHistory() {
  const list = $("history-list");
  const h = loadHistory();
  list.innerHTML = h.length ? "" : '<li class="muted">Aucun scan pour le moment.</li>';
  h.forEach((e) => {
    const li = document.createElement("li");
    const d = new Date(e.ts);
    const preview = escapedSegments(hexToBytes(e.bytes)).map((s) => s.t).join("");
    li.innerHTML = `<div class="h-top"><span class="h-sym">${esc(symbologyInfo(e.format).name)}</span><span>${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span></div><div class="h-data">${esc(preview)}</div>`;
    li.addEventListener("click", () => {
      $("history").classList.add("hidden");
      showResults([{ ...e, bytes: hexToBytes(e.bytes) }], null, false);
    });
    list.appendChild(li);
  });
}

async function exportCsv() {
  const h = loadHistory();
  if (!h.length) { toast("Historique vide"); return; }
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const lines = [["Date", "Symbologie", "Nom technique", "Identifiant AIM", "Type de contenu", "Données (texte)", "Données (caractères visibles)", "Hexa"].map(q).join(";")];
  for (const e of h) {
    const b = hexToBytes(e.bytes);
    lines.push([new Date(e.ts).toLocaleString("fr-FR"), symbologyInfo(e.format).name, e.format, e.symbologyIdentifier, CONTENT_TYPES_FR[e.contentType] || e.contentType, e.text, escapedSegments(b).map((s) => s.t).join(""), hexDump(b)].map(q).join(";"));
  }
  const name = `scans-symbologie-${new Date().toISOString().slice(0, 10)}.csv`;
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const file = new File([blob], name, { type: "text/csv" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (err) { if (err.name === "AbortError") return; }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ---------- Divers ---------- */

let toastTimer = null;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 2200);
}

function renderSoundBtn() {
  $("btn-sound").classList.toggle("off", !settings.sound);
  $("sound-label").textContent = settings.sound ? "Bip" : "Muet";
}

function openSheet(id) {
  scanning = false;
  setStatus("");
  $(id).classList.remove("hidden");
}
function closeSheet(id) {
  $(id).classList.add("hidden");
  if ($("result").classList.contains("hidden")) resumeScan();
}

/* ---------- Événements ---------- */

document.addEventListener("pointerdown", unlockAudio, { passive: true });
$("btn-start").addEventListener("click", startCamera);
$("btn-rescan").addEventListener("click", closeResult);
$("btn-close-result").addEventListener("click", closeResult);
$("btn-history").addEventListener("click", () => { renderHistory(); openSheet("history"); });
$("btn-close-history").addEventListener("click", () => closeSheet("history"));
$("btn-about").addEventListener("click", () => openSheet("about"));
$("btn-close-about").addEventListener("click", () => closeSheet("about"));
$("btn-export").addEventListener("click", exportCsv);
$("btn-clear").addEventListener("click", () => {
  if (confirm("Effacer tout l'historique de ce téléphone ?")) { localStorage.removeItem(HISTORY_KEY); renderHistory(); }
});
$("file").addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  e.target.value = "";
  if (f) decodeFile(f);
});
$("btn-torch").addEventListener("click", async () => {
  if (!track) return;
  try {
    await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
    torchOn = !torchOn;
    $("btn-torch").classList.toggle("on", torchOn);
  } catch (_) { toast("Lampe indisponible"); }
});
$("btn-switch").addEventListener("click", () => {
  if (backCameras.length < 2) return;
  cameraIndex = (cameraIndex + 1) % backCameras.length;
  toast(backCameras[cameraIndex].label || `Caméra ${cameraIndex + 1}`);
  startCamera();
});
$("btn-sound").addEventListener("click", () => {
  settings.sound = !settings.sound;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  renderSoundBtn();
});
$("zoom").addEventListener("input", (e) => {
  if (track) track.applyConstraints({ advanced: [{ zoom: Number(e.target.value) }] }).catch(() => {});
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopCamera();
  else if ([...document.querySelectorAll(".sheet")].every((s) => s.classList.contains("hidden"))) startCamera();
});

$("version-info").textContent = `Version ${APP_VERSION} — moteur de décodage ZXing-C++ (open source).`;
renderSoundBtn();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// Point d'entrée de test (analyse d'une image sans caméra)
window.__decodeBlob = decodeFile;

startCamera();
