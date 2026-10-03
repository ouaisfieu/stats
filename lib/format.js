// Mise en forme des nombres à la belge francophone (fr-BE) :
// espace fine insécable pour les milliers, virgule décimale.
const cache = new Map();
function nf(decimals) {
  if (!cache.has(decimals))
    cache.set(
      decimals,
      new Intl.NumberFormat("fr-BE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    );
  return cache.get(decimals);
}

export function fmt(value, decimals = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return nf(decimals).format(value).replace("-", "−");
}

export function fmtSigned(value, decimals = 0) {
  if (!Number.isFinite(value)) return "–";
  const s = fmt(Math.abs(value), decimals);
  if (Number(value.toFixed(decimals)) === 0) return s;
  return (value > 0 ? "+" : "−") + s;
}

export function fmtDelta(value, decimals, word = "point") {
  const abs = Math.abs(value);
  const n = Number(abs.toFixed(decimals));
  if (n === 0) return "stable";
  const plural = n >= 2 ? "s" : "";
  return `${fmtSigned(value, decimals)} ${word}${plural}`;
}

/** Forme compacte pour les tuiles : 11,96 millions ; 642 milliards… */
export function fmtCompact(value, decimals = 0, unitShort = "") {
  if (!Number.isFinite(value)) return "–";
  const abs = Math.abs(value);
  if (unitShort === "M€") {
    if (abs >= 1000) return `${fmt(value / 1000, 1)} Md€`;
    return `${fmt(value, 0)} M€`;
  }
  if (abs >= 1e6) return `${fmt(value / 1e6, 2)} millions`;
  if (abs >= 1e4) return fmt(value, 0);
  return fmt(value, decimals);
}

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export function fmtDate(iso) {
  if (!iso) return "";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const day = Number(m[3]);
  return `${day === 1 ? "1er" : day} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}
export function isoDate(iso) {
  if (!iso) return "";
  const m = String(iso).match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : "";
}
