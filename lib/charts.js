// Graphiques SVG générés au build : aucun JavaScript requis pour les afficher.
// Une couche d'interaction optionnelle (assets/js/charts.js) ajoute l'infobulle.
import { fmt, fmtCompact } from "./format.js";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const r1 = (n) => Math.round(n * 10) / 10;

export function niceTicks(min, max, count = 5) {
  if (min === max) {
    const d = Math.abs(min) || 1;
    min -= d / 2;
    max += d / 2;
  }
  const span = max - min;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
  return { lo, hi, step, ticks };
}

function shortVal(v, ind, narrow) {
  const a = Math.abs(v);
  if (!narrow) return fmt(v, ind.decimals);
  if (ind.unitShort === "M€" && a >= 1000) return `${fmt(v / 1000, 0)} Md`;
  if (a >= 1e6) return `${fmt(v / 1e6, 2)} M`;
  if (a >= 1e5) return `${fmt(v / 1e3, 0)} k`;
  return fmt(v, ind.decimals);
}

function tickDecimals(step) {
  if (step >= 1) return 0;
  return Math.min(3, Math.ceil(-Math.log10(step)));
}

function axisLabel(v, step, unitShort) {
  const d = tickDecimals(step);
  const a = Math.abs(v);
  if (a >= 1e6) return `${fmt(v / 1e6, step >= 1e6 ? 0 : 1)} M`;
  if (a >= 1e4 && unitShort !== "M€") return `${fmt(v / 1e3, step >= 1e3 ? 0 : 1)} k`;
  if (unitShort === "M€" && a >= 1e3) return `${fmt(v / 1e3, 0)} Md`;
  return fmt(v, d);
}

function yearTicks(years, maxLabels = 8) {
  const n = years.length;
  const steps = [1, 2, 5, 10];
  const step = steps.find((s) => Math.ceil(n / s) <= maxLabels) ?? 10;
  const last = years.at(-1);
  // ancrer sur la dernière année
  return years.filter((y) => (last - y) % step === 0);
}

function roundedBar(x, y0, y1, w, r = 4) {
  // barre verticale de y0 (base) à y1 (extrémité), coins arrondis côté données seulement
  const up = y1 < y0;
  const h = Math.abs(y1 - y0);
  const rr = Math.min(r, h, w / 2);
  if (h < 0.5) return "";
  if (up) {
    return `M${r1(x)},${r1(y0)}V${r1(y1 + rr)}Q${r1(x)},${r1(y1)} ${r1(x + rr)},${r1(y1)}H${r1(x + w - rr)}Q${r1(x + w)},${r1(y1)} ${r1(x + w)},${r1(y1 + rr)}V${r1(y0)}Z`;
  }
  return `M${r1(x)},${r1(y0)}V${r1(y1 - rr)}Q${r1(x)},${r1(y1)} ${r1(x + rr)},${r1(y1)}H${r1(x + w - rr)}Q${r1(x + w)},${r1(y1)} ${r1(x + w)},${r1(y1 - rr)}V${r1(y0)}Z`;
}

function roundedHBar(x0, x1, y, h, r = 4) {
  const w = x1 - x0;
  const rr = Math.min(r, Math.abs(w), h / 2);
  if (w < 0.5) return "";
  return `M${r1(x0)},${r1(y)}H${r1(x1 - rr)}Q${r1(x1)},${r1(y)} ${r1(x1)},${r1(y + rr)}V${r1(y + h - rr)}Q${r1(x1)},${r1(y + h)} ${r1(x1 - rr)},${r1(y + h)}H${r1(x0)}Z`;
}

function svgOpen(id, w, h, title, desc, extraClass = "") {
  return `<svg class="chart-svg ${extraClass}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t ${id}-d" preserveAspectRatio="xMidYMid meet" focusable="false"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>`;
}

/** Graphique temporel : lignes (chart = "line") ou colonnes (chart = "bar"). */
export function timeChart(ind, { id = ind.slug, width = 720, height = 340, compact = false } = {}) {
  const series = ind.series.filter((s) => s.obs.length);
  const years = ind.years;
  if (!series.length || years.length < 2) return "";
  const W = width;
  const H = height;
  const narrow = W < 500;
  const isBar = ind.chart === "bar";
  const endLabels = !isBar;
  const M = { t: 18, r: endLabels ? (narrow ? 52 : 74) : 12, b: 30, l: narrow ? 40 : 52 };
  const pw = W - M.l - M.r;
  const ph = H - M.t - M.b;

  const vals = series.flatMap((s) => s.obs.map((o) => o.value));
  if (ind.reference) vals.push(ind.reference.value);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (isBar) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  } else if (min > 0 && min / max < 0.45) min = 0;
  const pad = (max - min) * 0.06;
  const { lo, hi, step, ticks } = niceTicks(min - (min === 0 ? 0 : pad), max + (max === 0 ? 0 : pad), narrow ? 4 : 5);

  const yr0 = years[0];
  const yr1 = years.at(-1);
  const band = pw / years.length;
  const xOf = isBar ? (y) => M.l + (y - yr0) * band + band / 2 : (y) => M.l + ((y - yr0) / (yr1 - yr0)) * pw;
  const yOf = (v) => M.t + ph - ((v - lo) / (hi - lo)) * ph;

  const desc = ind.summary;
  let out = svgOpen(id, W, H, `${ind.title} (${ind.unit}), ${yr0}–${yr1}`, desc, isBar ? "is-bar" : "is-line");

  // Grille et axe Y
  out += `<g class="grid" aria-hidden="true">`;
  for (const t of ticks) {
    const y = r1(yOf(t));
    out += `<line x1="${M.l}" x2="${W - M.r}" y1="${y}" y2="${y}" class="${t === 0 && lo < 0 ? "zero" : ""}"/>`;
    out += `<text x="${M.l - 8}" y="${y}" class="tick y" dy="0.32em" text-anchor="end">${esc(axisLabel(t, step, ind.unitShort))}</text>`;
  }
  out += `</g>`;

  // Axe X
  out += `<g class="xaxis" aria-hidden="true">`;
  for (const y of yearTicks(years, narrow ? 4 : 8)) {
    out += `<text x="${r1(xOf(y))}" y="${H - 8}" class="tick x" text-anchor="middle">${y}</text>`;
  }
  out += `</g>`;

  // Ligne de référence
  if (ind.reference && ind.reference.value >= lo && ind.reference.value <= hi) {
    const y = r1(yOf(ind.reference.value));
    out += `<g class="ref" aria-hidden="true"><line x1="${M.l}" x2="${W - M.r}" y1="${y}" y2="${y}"/><text x="${M.l + 6}" y="${y - 6}">${esc(/\d/.test(ind.reference.label) ? ind.reference.label : `${ind.reference.label} (${fmt(ind.reference.value, Number.isInteger(ind.reference.value) ? 0 : 1)}${ind.unitShort === "%" ? " %" : ""})`)}</text></g>`;
  }

  if (isBar) {
    const n = series.length;
    const gap = 2;
    const bw = Math.max(2, Math.min(24, (band * 0.72 - gap * (n - 1)) / n));
    const groupW = bw * n + gap * (n - 1);
    const y0 = yOf(0);
    series.forEach((s, i) => {
      out += `<g class="bars c-${s.slot}">`;
      for (const o of s.obs) {
        const x = xOf(o.year) - groupW / 2 + i * (bw + gap);
        out += `<path data-y="${o.year}" d="${roundedBar(x, y0, yOf(o.value), bw)}"/>`;
      }
      out += `</g>`;
    });
    // valeur au bout de la dernière colonne de la série principale
    {
      const s = series[0];
      const L = s.latest;
      const x = xOf(L.year) - groupW / 2 + bw / 2;
      const y = yOf(L.value);
      out += `<text class="val" x="${r1(x)}" y="${r1(L.value >= 0 ? y - 6 : y + 14)}" text-anchor="middle">${esc(fmt(L.value, ind.decimals))}</text>`;
    }
  } else {
    // Lignes (avec coupures sur les années manquantes)
    series.forEach((s) => {
      let d = "";
      let prevYear = null;
      for (const o of s.obs) {
        const cmd = prevYear !== null && o.year === prevYear + 1 ? "L" : "M";
        d += `${cmd}${r1(xOf(o.year))},${r1(yOf(o.value))}`;
        prevYear = o.year;
      }
      out += `<g class="series c-${s.slot}"><path class="line" d="${d}"/>`;
      const L = s.latest;
      out += `<circle class="dot" cx="${r1(xOf(L.year))}" cy="${r1(yOf(L.value))}" r="4.5"/></g>`;
    });
    // Étiquettes de fin (valeurs) — masquées si elles se chevauchent
    if (endLabels) {
      const labels = series
        .map((s) => ({ s, x: xOf(s.latest.year), y: yOf(s.latest.value) }))
        .sort((a, b) => a.y - b.y);
      for (let i = 1; i < labels.length; i++) {
        const dy = labels[i].y - labels[i - 1].y;
        if (dy < 14) labels[i].y = labels[i - 1].y + 14;
      }
      const ok = labels.every((l) => l.y - yOf(l.s.latest.value) <= 9);
      if (ok)
        for (const l of labels)
          out += `<text class="val" x="${r1(l.x + 9)}" y="${r1(l.y)}" dy="0.32em">${esc(shortVal(l.s.latest.value, ind, narrow))}</text>`;
    }
  }

  // Couche d'interaction (remplie par le JS)
  out += `<g class="hover" aria-hidden="true"><line class="cross" x1="0" x2="0" y1="${M.t}" y2="${M.t + ph}"/></g>`;
  out += `<rect class="hit" x="${M.l}" y="${M.t}" width="${pw}" height="${ph}" fill="transparent"/>`;
  out += `</svg>`;

  const payload = {
    t: isBar ? "bar" : "line",
    y0: yr0,
    y1: yr1,
    l: M.l,
    pw,
    top: M.t,
    ph,
    lo,
    hi,
    W,
    H,
    d: ind.decimals,
    u: ind.unitShort ?? "",
    pit: !!ind.pointInTime,
    s: series.map((s) => ({ n: s.label, c: s.slot, v: Object.fromEntries(s.obs.map((o) => [o.year, o.value])) })),
  };
  return { svg: out, payload: JSON.stringify(payload) };
}

/** Barres horizontales : comparaison transversale à la dernière date. */
export function barChart(ind, { id = ind.slug, width = 720, compact = false } = {}) {
  const rows = ind.rows ?? [];
  if (!rows.length) return "";
  const W = width;
  const narrow = W < 500;
  const labelW = narrow ? 0 : 250;
  const rowH = narrow ? 42 : 32;
  const barH = narrow ? 14 : 18;
  const M = { t: 8, r: narrow ? 70 : 92, b: 8, l: labelW };
  const H = M.t + M.b + rows.length * rowH;
  const max = Math.max(...rows.map((r) => r.value));
  const pw = W - M.l - M.r;
  const xOf = (v) => M.l + (v / max) * pw;
  const year = rows[0].year;
  let out = svgOpen(id, W, H, `${ind.title} (${ind.unit}), ${year}`, ind.summary, "is-hbar");
  if (!narrow) out += `<line class="base" x1="${M.l}" x2="${M.l}" y1="${M.t}" y2="${H - M.b}" aria-hidden="true"/>`;
  rows.forEach((r, i) => {
    const top = M.t + i * rowH;
    const y = narrow ? top + 20 : top + (rowH - barH) / 2;
    out += `<g class="hrow c-s1" data-label="${esc(r.label)}" data-value="${r.value}">`;
    if (narrow) out += `<text class="lab" x="0" y="${r1(top + 10)}" dy="0.32em">${esc(r.label)}</text>`;
    else out += `<text class="lab" x="${M.l - 10}" y="${r1(y + barH / 2)}" dy="0.32em" text-anchor="end">${esc(r.label)}</text>`;
    out += `<path d="${roundedHBar(M.l, xOf(r.value), y, barH)}"/>`;
    out += `<text class="val" x="${r1(xOf(r.value) + 8)}" y="${r1(y + barH / 2)}" dy="0.32em">${esc(narrow ? shortVal(r.value, ind, true) : fmt(r.value, ind.decimals))}</text>`;
    out += `<rect class="hit-row" x="0" y="${top}" width="${W}" height="${rowH}" fill="transparent"/>`;
    out += `</g>`;
  });
  out += `</svg>`;
  return { svg: out, payload: JSON.stringify({ t: "hbar", d: ind.decimals, u: ind.unitShort ?? "", year }) };
}

export function chart(ind, opts = {}) {
  return ind.chart === "hbar" ? barChart(ind, opts) : timeChart(ind, opts);
}

/** Petite courbe de tendance pour les tuiles (purement décorative, aria-hidden). */
export function sparkline(ind, { w = 120, h = 36 } = {}) {
  const s = ind.series[0];
  if (!s || s.obs.length < 2 || ind.chart === "hbar") return "";
  const obs = s.obs.slice(-15);
  const vs = obs.map((o) => o.value);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = max - min || 1;
  const x = (i) => 2 + (i / (obs.length - 1)) * (w - 8);
  const y = (v) => 4 + (1 - (v - min) / span) * (h - 8);
  const d = obs.map((o, i) => `${i ? "L" : "M"}${r1(x(i))},${r1(y(o.value))}`).join("");
  const L = obs.at(-1);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false"><path d="${d}"/><circle cx="${r1(x(obs.length - 1))}" cy="${r1(y(L.value))}" r="3.5"/></svg>`;
}
