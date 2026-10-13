/* Référentiel : symbologies, identifiants AIM, GS1, ISO 15434. */
"use strict";

const SYMBOLOGIES = {
  Codabar: { name: "Codabar", dim: "1D", desc: "Code linéaire numérique + quelques symboles (- $ : / . +), délimité par les caractères start/stop A, B, C ou D.", uses: "Bibliothèques, poches de sang, anciens systèmes logistiques." },
  Code39: { name: "Code 39", dim: "1D", desc: "Code linéaire alphanumérique (majuscules, chiffres, - . espace $ / + %). Chiffre de contrôle optionnel.", uses: "Industrie, automobile (Odette/Galia), défense, étiquettes internes." },
  Code39Std: { name: "Code 39 (standard)", dim: "1D", desc: "Code 39 en jeu de caractères standard (43 caractères).", uses: "Industrie, automobile, étiquettes internes." },
  Code39Ext: { name: "Code 39 Full ASCII", dim: "1D", desc: "Code 39 étendu : les 128 caractères ASCII sont codés par paires de caractères.", uses: "Industrie, quand minuscules ou caractères spéciaux sont nécessaires." },
  Code32: { name: "Code 32 (pharmacode italien)", dim: "1D", desc: "Variante du Code 39 utilisée pour le code AIC des médicaments en Italie.", uses: "Pharmacie (Italie)." },
  Code93: { name: "Code 93", dim: "1D", desc: "Code linéaire alphanumérique plus compact que le Code 39, avec deux chiffres de contrôle obligatoires.", uses: "Logistique, Postes canadiennes, applications internes." },
  Code128: { name: "Code 128", dim: "1D", desc: "Code linéaire haute densité, ASCII complet, chiffre de contrôle obligatoire. Trois jeux de caractères (A, B, C).", uses: "Logistique, industrie, étiquettes colis. GS1-128 si FNC1 en tête." },
  ITF: { name: "Interleaved 2 of 5 (ITF)", dim: "1D", desc: "Code linéaire numérique uniquement, nombre pair de chiffres, codés par paires entrelacées.", uses: "Cartons, emballages de regroupement, industrie." },
  ITF14: { name: "ITF-14", dim: "1D", desc: "ITF à 14 chiffres portant un GTIN-14, souvent entouré d'une barre de protection.", uses: "Cartons et emballages de regroupement (GS1)." },
  EAN13: { name: "EAN-13", dim: "1D", desc: "Code produit GS1 à 13 chiffres (GTIN-13), chiffre de contrôle obligatoire.", uses: "Grande distribution, identification des produits de vente." },
  EAN8: { name: "EAN-8", dim: "1D", desc: "Version courte de l'EAN à 8 chiffres (GTIN-8) pour petits emballages.", uses: "Grande distribution, petits articles." },
  EAN2: { name: "Add-on EAN-2", dim: "1D", desc: "Complément à 2 chiffres accolé à un EAN/UPC.", uses: "Presse, périodiques (numéro d'édition)." },
  EAN5: { name: "Add-on EAN-5", dim: "1D", desc: "Complément à 5 chiffres accolé à un EAN/UPC.", uses: "Livres (prix suggéré)." },
  ISBN: { name: "ISBN (EAN-13)", dim: "1D", desc: "EAN-13 commençant par 978/979, identifiant un livre.", uses: "Édition." },
  UPCA: { name: "UPC-A", dim: "1D", desc: "Code produit nord-américain à 12 chiffres (GTIN-12).", uses: "Distribution (Amérique du Nord)." },
  UPCE: { name: "UPC-E", dim: "1D", desc: "UPC compressé à 8 chiffres (zéros supprimés).", uses: "Petits emballages (Amérique du Nord)." },
  DataBar: { name: "GS1 DataBar", dim: "1D", desc: "Famille de codes GS1 compacts portant un GTIN-14.", uses: "Produits frais, petits articles, coupons." },
  DataBarOmni: { name: "GS1 DataBar Omnidirectionnel", dim: "1D", desc: "GS1 DataBar lisible dans toutes les orientations, porte un GTIN-14.", uses: "Fruits et légumes, petits produits en caisse." },
  DataBarStk: { name: "GS1 DataBar Empilé", dim: "1D", desc: "GS1 DataBar en deux rangées superposées.", uses: "Petits produits, pharmacie." },
  DataBarStkOmni: { name: "GS1 DataBar Empilé Omnidirectionnel", dim: "1D", desc: "Version empilée lisible dans toutes les orientations.", uses: "Produits frais, petits articles." },
  DataBarLtd: { name: "GS1 DataBar Limité", dim: "1D", desc: "GS1 DataBar très compact, non omnidirectionnel.", uses: "Petits articles de santé." },
  DataBarExp: { name: "GS1 DataBar Étendu", dim: "1D", desc: "GS1 DataBar pouvant porter plusieurs AI (poids, date, lot…).", uses: "Produits à poids variable, coupons." },
  DataBarExpStk: { name: "GS1 DataBar Étendu Empilé", dim: "1D", desc: "DataBar Étendu sur plusieurs rangées.", uses: "Produits à poids variable, coupons." },
  DXFilmEdge: { name: "DX Film Edge", dim: "1D", desc: "Code imprimé sur le bord des films photo 35 mm.", uses: "Films argentiques." },
  PZN: { name: "PZN (Pharmazentralnummer)", dim: "1D", desc: "Code 39 portant le numéro central pharmaceutique allemand.", uses: "Pharmacie (Allemagne)." },
  Telepen: { name: "Telepen", dim: "1D", desc: "Code linéaire ASCII complet.", uses: "Bibliothèques, universités (Royaume-Uni)." },
  TelepenAlpha: { name: "Telepen alphanumérique", dim: "1D", desc: "Telepen en mode ASCII.", uses: "Bibliothèques (Royaume-Uni)." },
  TelepenNumeric: { name: "Telepen numérique", dim: "1D", desc: "Telepen en mode numérique compressé.", uses: "Bibliothèques (Royaume-Uni)." },
  PDF417: { name: "PDF417", dim: "2D empilé", desc: "Code 2D empilé (rangées de codes linéaires), grande capacité, correction d'erreur niveaux 0 à 8.", uses: "Cartes d'identité, permis, cartes d'embarquement, documents de transport." },
  CompactPDF417: { name: "PDF417 compact (tronqué)", dim: "2D empilé", desc: "PDF417 sans indicateur de rangée droit pour gagner de la place.", uses: "Applications à espace réduit." },
  MicroPDF417: { name: "MicroPDF417", dim: "2D empilé", desc: "Version réduite du PDF417 pour petites quantités de données.", uses: "Petits emballages, composants de type GS1 composite." },
  Aztec: { name: "Aztec", dim: "2D matriciel", desc: "Code 2D avec cible centrale (« bullseye »), sans zone de silence nécessaire.", uses: "Billets de transport (train, avion), santé." },
  AztecCode: { name: "Aztec", dim: "2D matriciel", desc: "Code 2D avec cible centrale (« bullseye »), sans zone de silence nécessaire.", uses: "Billets de transport (train, avion), santé." },
  AztecRune: { name: "Aztec Rune", dim: "2D matriciel", desc: "Plus petit Aztec (11×11), ne code qu'une valeur de 0 à 255.", uses: "Marquages très compacts." },
  DataMatrix: { name: "Data Matrix (ECC 200)", dim: "2D matriciel", desc: "Code 2D carré ou rectangulaire avec bordure en « L », correction Reed-Solomon. Très utilisé en marquage direct (DPM).", uses: "Industrie, marquage pièces (laser, micro-percussion), santé (UDI), pharmacie (sérialisation), électronique." },
  MaxiCode: { name: "MaxiCode", dim: "2D matriciel", desc: "Code 2D hexagonal de taille fixe avec cible centrale.", uses: "Tri de colis (UPS)." },
  QRCode: { name: "QR Code", dim: "2D matriciel", desc: "Code 2D carré avec 3 motifs de repérage, versions 1 à 40, correction d'erreur L/M/Q/H.", uses: "Grand public (URL), industrie, logistique, paiements." },
  QRCodeModel1: { name: "QR Code Modèle 1", dim: "2D matriciel", desc: "Ancienne version du QR Code (avant 1997).", uses: "Anciennes applications industrielles." },
  QRCodeModel2: { name: "QR Code Modèle 2", dim: "2D matriciel", desc: "QR Code standard actuel.", uses: "Grand public, industrie, logistique." },
  MicroQRCode: { name: "Micro QR Code", dim: "2D matriciel", desc: "Version miniature du QR Code avec un seul motif de repérage (M1 à M4).", uses: "Marquage de petites pièces, composants électroniques." },
  RMQRCode: { name: "rMQR (QR rectangulaire)", dim: "2D matriciel", desc: "QR Code rectangulaire pour zones étroites.", uses: "Marquage de pièces longues et étroites, tubes, bords." },
  OtherBarcode: { name: "Autre code", dim: "?", desc: "Symbologie non répertoriée.", uses: "" },
};

function symbologyInfo(format) {
  return SYMBOLOGIES[format] || { name: format, dim: "?", desc: "", uses: "" };
}

/* Identifiants de symbologie AIM (ISO/IEC 15424) : "]" + code + modificateur. */
const AIM_CODES = {
  A: { name: "Code 39", mods: { 0: "pas de chiffre de contrôle vérifié", 1: "chiffre de contrôle vérifié et transmis", 3: "chiffre de contrôle vérifié et supprimé", 4: "Full ASCII, pas de contrôle", 5: "Full ASCII, contrôle vérifié et transmis", 7: "Full ASCII, contrôle vérifié et supprimé" } },
  B: { name: "Telepen" },
  C: { name: "Code 128", mods: { 0: "Code 128 standard", 1: "GS1-128 (FNC1 en 1re position)", 2: "FNC1 en 2e position", 4: "concaténation (FNC4)" } },
  E: { name: "EAN / UPC", mods: { 0: "EAN-13 / UPC-A / UPC-E", 1: "add-on 2 chiffres seul", 2: "add-on 5 chiffres seul", 3: "EAN/UPC avec add-on", 4: "EAN-8" } },
  e: { name: "GS1 DataBar", mods: { 0: "données GS1" } },
  F: { name: "Codabar", mods: { 0: "standard", 1: "ABC Codabar", 2: "contrôle vérifié et supprimé" } },
  G: { name: "Code 93", mods: { 0: "standard" } },
  I: { name: "Interleaved 2 of 5", mods: { 0: "pas de chiffre de contrôle vérifié", 1: "chiffre de contrôle vérifié et transmis", 3: "chiffre de contrôle vérifié et supprimé" } },
  L: { name: "PDF417 / MicroPDF417", mods: { 0: "standard", 1: "protocole ECI", 2: "canal de base" } },
  Q: { name: "QR Code", mods: { 0: "Modèle 1", 1: "Modèle 2, sans ECI", 2: "Modèle 2 avec ECI", 3: "GS1 (FNC1 en 1re position)", 4: "GS1 avec ECI", 5: "FNC1 en 2e position (AIM)", 6: "FNC1 en 2e position avec ECI" } },
  d: { name: "Data Matrix", mods: { 0: "ECC 000-140", 1: "ECC 200 standard", 2: "ECC 200 GS1 (FNC1 en 1re position)", 3: "ECC 200 FNC1 en 2e position", 4: "ECC 200 avec ECI", 5: "ECC 200 GS1 avec ECI", 6: "ECC 200 FNC1 2e position avec ECI" } },
  z: { name: "Aztec", mods: { 0: "standard", 1: "GS1 (FNC1 en 1re position)", 3: "avec ECI", 4: "GS1 avec ECI", C: "Aztec Rune" } },
  U: { name: "MaxiCode", mods: { 0: "mode 4 ou 5", 1: "mode 2 ou 3", 2: "mode 4 ou 5 avec ECI", 3: "mode 2 ou 3 avec ECI" } },
  X: { name: "Autre / non standard" },
};

function explainAim(aim) {
  if (!aim || aim.length < 3 || aim[0] !== "]") return "";
  const c = AIM_CODES[aim[1]];
  if (!c) return "";
  const mod = c.mods && c.mods[aim.slice(2)];
  return mod ? `${c.name} — ${mod}` : c.name;
}

const CONTENT_TYPES_FR = {
  Text: "Texte",
  Binary: "Binaire",
  Mixed: "Mixte (texte + binaire)",
  GS1: "GS1 (identifiants d'application)",
  ISO15434: "ISO/IEC 15434 (syntaxe « [)> »)",
  UnknownECI: "ECI inconnu",
};

/* Caractères de contrôle ASCII */
const CTRL = ["NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI", "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US"];

/* Renvoie une liste de segments {t: texte, ctrl: bool} pour afficher les caractères invisibles. */
function escapedSegments(bytes) {
  const segs = [];
  let buf = "";
  const flush = () => { if (buf) { segs.push({ t: buf, ctrl: false }); buf = ""; } };
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b < 32 || b === 127) {
      flush();
      segs.push({ t: `<${b === 127 ? "DEL" : CTRL[b]}>`, ctrl: true });
    } else if (b < 127) {
      buf += String.fromCharCode(b);
    } else {
      flush();
      segs.push({ t: `<x${b.toString(16).toUpperCase().padStart(2, "0")}>`, ctrl: true });
    }
  }
  flush();
  return segs;
}

function hexDump(bytes) {
  return Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

function controlCharSummary(bytes) {
  const counts = {};
  for (const b of bytes) {
    if (b < 32 || b === 127) {
      const n = b === 127 ? "DEL" : CTRL[b];
      counts[n] = (counts[n] || 0) + 1;
    }
  }
  return Object.entries(counts).map(([k, v]) => `${k} ×${v}`).join(", ");
}

/* ---------- GS1 ---------- */

const GS1_AI = {
  "00": "SSCC (n° de colis)", "01": "GTIN", "02": "GTIN des articles contenus", "10": "Numéro de lot", "11": "Date de production", "12": "Date d'échéance de paiement", "13": "Date d'emballage", "15": "Date de durabilité minimale (DDM)", "16": "Date limite de vente", "17": "Date de péremption", "20": "Variante produit", "21": "Numéro de série", "22": "Variante produit grand public", "235": "Numéro de série tiers (TPX)", "240": "Identification produit complémentaire", "241": "Référence client", "242": "N° de variante sur commande", "243": "Code composant d'emballage", "250": "Numéro de série secondaire", "251": "Référence de l'entité source", "253": "GDTI (type de document)", "254": "Extension GLN", "255": "GCN (coupon)", "30": "Quantité variable", "37": "Nombre d'unités contenues",
  "400": "N° de commande client", "401": "GINC (envoi)", "402": "GSIN (expédition)", "403": "Code de routage", "410": "Livrer à (GLN)", "411": "Facturer à (GLN)", "412": "Acheté auprès de (GLN)", "413": "Livrer pour (GLN)", "414": "GLN emplacement physique", "415": "GLN de la partie facturante", "416": "GLN lieu de production", "417": "GLN de la partie", "420": "Code postal de livraison", "421": "Code postal de livraison (avec pays)", "422": "Pays d'origine", "423": "Pays de transformation initiale", "424": "Pays de transformation", "425": "Pays de démontage", "426": "Pays de transformation complète", "427": "Subdivision du pays d'origine",
  "7001": "Code OTAN (NSN)", "7002": "Classification carcasse UNECE", "7003": "Date et heure de péremption", "7004": "Puissance active", "7005": "Zone de capture", "7006": "Date de première congélation", "7007": "Date(s) d'abattage", "7008": "Espèce (pêche)", "7009": "Type d'engin de pêche", "7010": "Méthode de production", "7020": "Lot de remise à neuf", "7021": "État fonctionnel", "7022": "État de révision", "7023": "GIAI de l'assemblage", "7240": "Protocole ID",
  "8001": "Produit en rouleau", "8002": "N° de téléphone mobile", "8003": "GRAI (actif consigné)", "8004": "GIAI (actif individuel)", "8005": "Prix unitaire", "8006": "ITIP (pièce d'un article)", "8007": "IBAN", "8008": "Date et heure de production", "8009": "Indicateur de capteur optique", "8010": "CPID (composant)", "8011": "N° de série du CPID", "8012": "Version logicielle", "8013": "GMN (modèle)", "8017": "GSRN prestataire", "8018": "GSRN bénéficiaire", "8019": "SRIN (instance de service)", "8020": "Réf. bulletin de paiement", "8026": "ITIP des pièces contenues", "8030": "Signature numérique", "8200": "URL de l'emballage", "90": "Information convenue entre partenaires",
};

const GS1_MEASURE = {
  "310": ["Poids net", "kg"], "311": ["Longueur", "m"], "312": ["Largeur", "m"], "313": ["Hauteur", "m"], "314": ["Surface", "m²"], "315": ["Volume net", "l"], "316": ["Volume net", "m³"],
  "320": ["Poids net", "lb"], "330": ["Poids brut (logistique)", "kg"], "331": ["Longueur (logistique)", "m"], "332": ["Largeur (logistique)", "m"], "333": ["Hauteur (logistique)", "m"], "334": ["Surface (logistique)", "m²"], "335": ["Volume brut (logistique)", "l"], "336": ["Volume brut (logistique)", "m³"],
  "390": ["Montant à payer (monnaie locale)", ""], "391": ["Montant à payer avec code devise ISO", ""], "392": ["Prix unitaire variable (monnaie locale)", ""], "393": ["Prix unitaire variable avec code devise", ""],
};

const GS1_DATES = new Set(["11", "12", "13", "15", "16", "17"]);
const GS1_CHECKED = new Set(["00", "01", "02", "410", "411", "412", "413", "414", "415", "416", "417"]);

function gs1Label(ai) {
  if (GS1_AI[ai]) return GS1_AI[ai];
  const m = GS1_MEASURE[ai.slice(0, 3)];
  if (ai.length === 4 && m) return `${m[0]}${m[1] ? " (" + m[1] + ")" : ""}`;
  if (/^9[1-9]$/.test(ai)) return "Information interne de l'entreprise";
  return "Identifiant d'application";
}

function formatGs1Date(v) {
  if (!/^\d{6}$/.test(v)) return null;
  const yy = +v.slice(0, 2), mm = v.slice(2, 4), dd = v.slice(4, 6);
  // Règle GS1 : fenêtre glissante simplifiée -> 20xx
  const yyyy = 2000 + yy;
  if (dd === "00") return `fin ${mm}/${yyyy}`;
  return `${dd}/${mm}/${yyyy}`;
}

function gs1CheckDigitOk(digits) {
  if (!/^\d+$/.test(digits)) return null;
  let sum = 0;
  const n = digits.length;
  for (let i = 0; i < n - 1; i++) sum += +digits[i] * ((n - 1 - i) % 2 === 1 ? 3 : 1);
  return (10 - (sum % 10)) % 10 === +digits[n - 1];
}

/* Parse le HRI "(01)0950...(17)250101(10)ABC" */
function parseGs1Hri(text) {
  if (!text || text[0] !== "(") return null;
  const re = /\((\d{2,4})\)([^(]*)/g;
  const out = [];
  let m;
  while ((m = re.exec(text))) {
    const ai = m[1], value = m[2];
    const item = { ai, label: gs1Label(ai), value, display: value, note: "" };
    if (GS1_DATES.has(ai)) item.display = formatGs1Date(value) || value;
    const meas = GS1_MEASURE[ai.slice(0, 3)];
    if (ai.length === 4 && meas) {
      const dec = +ai[3];
      const raw = ai.startsWith("391") || ai.startsWith("393") ? value.slice(3) : value;
      const num = dec ? raw.slice(0, raw.length - dec).replace(/^0+(?=\d)/, "") + "," + raw.slice(raw.length - dec) : raw.replace(/^0+(?=\d)/, "");
      item.display = `${num}${meas[1] ? " " + meas[1] : ""}${ai.startsWith("391") || ai.startsWith("393") ? " (devise " + value.slice(0, 3) + ")" : ""}`;
    }
    if (GS1_CHECKED.has(ai)) {
      const ok = gs1CheckDigitOk(value);
      if (ok !== null) item.note = ok ? "Clé de contrôle OK" : "Clé de contrôle INCORRECTE";
      item.checkOk = ok;
    }
    out.push(item);
  }
  return out.length ? out : null;
}

/* ---------- ISO/IEC 15434 ---------- */

const ISO15434_FORMATS = {
  "01": "Transport (ASC MH10.8.3)", "02": "EDI complet (ASC X12)", "03": "EDI ASC X12", "04": "EDI UN/EDIFACT", "05": "Identifiants d'application GS1", "06": "Identifiants de données ASC MH10 (Data Identifiers)", "07": "Texte libre", "08": "CII (Japon)", "09": "Données binaires", "11": "Identifiants de données (automobile)", "12": "Identifiants d'éléments de texte (TEI, aéronautique)", "DD": "Format de documentation",
};

const MH10_DI = {
  P: "Référence article (client)", "1P": "Référence article (fournisseur)", "2P": "Indice de révision", "20P": "Référence article (autre)", "30P": "Référence article (fournisseur, variante)",
  Q: "Quantité", "7Q": "Quantité avec unité",
  S: "Numéro de série", "1S": "Numéro de série (fournisseur)", "3S": "N° d'unité logistique (colis)", "4S": "N° d'unité logistique (étiquette maître)", "5S": "N° d'unité logistique (mixte)", "25S": "Identifiant unique (UII)",
  T: "Numéro de lot (client)", "1T": "Numéro de lot (fournisseur)", "20T": "Numéro de lot (autre)",
  V: "Code fournisseur (attribué par le client)", "12V": "DUNS du fabricant", "18V": "Identifiant de partie (agence + code)",
  K: "N° de commande client", "1K": "N° de commande fournisseur", "11K": "N° de bon de livraison",
  D: "Date (AAMMJJ)", "6D": "Date (AAAAMMJJ, avec qualifiant)", "9D": "Date (AASS)", "14D": "Date de péremption (AAAAMMJJ)", "16D": "Date de production (AAAAMMJJ)",
  "4L": "Pays d'origine", "B": "Type de conditionnement", "N": "Numéro de lot de fabrication",
};

function parseIso15434(bytes) {
  // [)> RS fmt GS ... RS ... EOT
  const s = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  if (!s.startsWith("[)>\x1E")) return null;
  const envelopes = s.slice(4).replace(/\x04$/, "").split("\x1E").filter((e) => e.length);
  const out = [];
  for (const env of envelopes) {
    const parts = env.split("\x1D");
    const fmt = parts.shift();
    const block = { format: fmt, label: ISO15434_FORMATS[fmt.slice(0, 2)] || "Format inconnu", fields: [] };
    if (fmt === "06" || fmt === "11") {
      for (const p of parts) {
        if (!p) continue;
        const m = /^(\d{0,3}[A-Z])(.*)$/s.exec(p);
        if (m) block.fields.push({ id: m[1], label: MH10_DI[m[1]] || "Identifiant de données", value: m[2] });
        else block.fields.push({ id: "?", label: "Champ", value: p });
      }
    } else {
      for (const p of parts) if (p) block.fields.push({ id: "", label: "Champ", value: p });
    }
    out.push(block);
  }
  return out;
}
