// Assemble le catalogue et les données (data/eurostat.json) en objets prêts
// pour les gabarits : séries ordonnées, dernières valeurs, variations, phrases.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { INDICATORS, THEMES, GEO, DATASETS, seriesKey, eurostatApiUrl, eurostatBrowserUrl } from "./catalog.js";
import { fmt, fmtSigned, fmtDelta } from "./format.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadStore() {
  return JSON.parse(readFileSync(path.join(ROOT, "data", "eurostat.json"), "utf8"));
}

// Emplacements de couleur catégorielle (ordre fixe, validé daltonisme).
const SLOTS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];

function buildSeries(ind, store) {
  return ind.series.map((se, i) => {
    const key = seriesKey(se);
    const rec = store.series[key] ?? { obs: {} };
    const obs = Object.entries(rec.obs)
      .map(([year, value]) => ({ year: Number(year), value }))
      .filter((o) => Number.isFinite(o.value))
      .sort((a, b) => a.year - b.year);
    const latest = obs.at(-1) ?? null;
    return {
      id: se.id,
      label: se.label,
      geo: se.geo,
      geoInfo: GEO[se.geo] ?? null,
      dataset: se.dataset,
      params: se.params,
      key,
      apiUrl: eurostatApiUrl(se),
      updated: rec.updated ?? null,
      origin: rec.origin ?? null,
      slot: ind.chart === "hbar" ? "s1" : SLOTS[i % SLOTS.length],
      obs,
      latest,
      valueAt: (y) => obs.find((o) => o.year === y)?.value ?? null,
    };
  });
}

function unitSuffix(ind) {
  const u = ind.unitShort ?? "";
  if (u === "%") return " %";
  if (u) return ` ${u}`;
  return ["habitants", "personnes"].includes(ind.unit) ? ` ${ind.unit}` : "";
}

function deltaMode(ind) {
  if (ind.delta) return ind.delta;
  if (ind.signed) return ind.unitShort === "%" ? "pt" : "none";
  if (ind.unitShort === "%") return "pt";
  return "pct";
}

function describeDelta(ind, from, to) {
  const d = ind.decimals;
  const mode = deltaMode(ind);
  const diff = to - from;
  if (mode === "pt") return fmtDelta(diff, d, "point");
  if (mode === "abs") return ind.deltaWord ? fmtDelta(diff, d, ind.deltaWord) : fmtSigned(diff, d);
  if (mode === "pct" && from) {
    const pct = (to / from - 1) * 100;
    return Number(pct.toFixed(1)) === 0 ? "stable" : `${fmtSigned(pct, 1)} %`;
  }
  return null;
}

const when = (ind, y) => (ind.pointInTime ? `au 1er janvier ${y}` : `en ${y}`);

function sentence(ind, series) {
  const d = ind.decimals;
  const us = unitSuffix(ind);
  const main = series[0];
  if (!main?.latest) return "Données momentanément indisponibles.";
  const out = [];

  if (ind.chart === "hbar") {
    const rows = series.filter((s) => s.latest).sort((a, b) => b.latest.value - a.latest.value);
    const unitTxt = ind.unitShort === "%" ? ` ${ind.unit}` : us;
    const y = rows[0].latest.year;
    out.push(
      `${capital(when(ind, y))}, ${rows[0].label} arrive en tête (${fmt(rows[0].latest.value, d)}${unitTxt}), devant ${rows[1].label} (${fmt(rows[1].latest.value, d)}${unitTxt}).`
    );
    const last = rows.at(-1);
    out.push(`${last.label} ferme la marche (${fmt(last.latest.value, d)}${unitTxt}).`);
    if (ind.growthSince) {
      const g = rows
        .map((s) => ({ s, g: s.valueAt(ind.growthSince) ? (s.latest.value / s.valueAt(ind.growthSince) - 1) * 100 : null }))
        .filter((x) => x.g !== null)
        .sort((a, b) => b.g - a.g);
      if (g.length)
        out.push(
          `Depuis ${ind.growthSince}, la plus forte progression revient à ${g[0].s.label} (${fmtSigned(g[0].g, 1)} %), la plus faible à ${g.at(-1).s.label} (${fmtSigned(g.at(-1).g, 1)} %).`
        );
    }
    return out.join(" ");
  }

  const L = main.latest;
  const isRegional = ["BE1", "BE2", "BE3"].includes(main.geo);
  const multiMeasure = series.length > 1 && series.every((s) => s.geo === "BE");

  if (isRegional) {
    const total = series.reduce((a, s) => a + (s.latest?.value ?? 0), 0);
    out.push(
      `${capital(when(ind, L.year))} : ` +
        series
          .filter((s) => s.latest)
          .map((s) => `${s.label} ${fmt(s.latest.value, d)}${us}` + (ind.share ? ` (${fmt((s.latest.value / total) * 100, 1)} % du total)` : ""))
          .join(", ") +
        "."
    );
    const first = series.map((s) => ({ s, f: s.obs[0] })).filter((x) => x.f);
    if (first.length === series.length && first[0].f.year < L.year) {
      const y0 = first[0].f.year;
      out.push(
        `Depuis ${y0} : ` +
          first.map(({ s, f }) => `${s.label} ${describeDelta(ind, f.value, s.latest.value)}`).join(", ") +
          "."
      );
    }
    return out.join(" ");
  }

  if (multiMeasure) {
    out.push(
      `${capital(when(ind, L.year))}, ` +
        series
          .filter((s) => s.latest)
          .map((s) => `${s.label.toLowerCase()} : ${fmt(s.latest.value, d)}${us}`)
          .join(" ; ") +
        "."
    );
    if (ind.slug === "naissances-deces") {
      const n = series[0].valueAt(L.year) - series[1].valueAt(L.year);
      out.push(
        n < 0
          ? `Le solde naturel est négatif (${fmt(n, 0)}) : il y a eu plus de décès que de naissances.`
          : `Le solde naturel est positif (+${fmt(n, 0)}).`
      );
    }
    if (ind.slug === "depenses-et-recettes-publiques") {
      const gap = series[1].valueAt(L.year) - series[0].valueAt(L.year);
      out.push(`L'écart entre recettes et dépenses atteint ${fmtDelta(gap, 1, "point")} de PIB.`);
    }
    return out.join(" ");
  }

  const what = ind.title.charAt(0).toLowerCase() + ind.title.slice(1);
  const be = series.length > 1 ? " en Belgique" : "";
  out.push(`${capital(what)}${be} : ${fmt(L.value, d)}${us} ${when(ind, L.year)}.`);

  const prev = main.obs.at(-2);
  if (prev && prev.year === L.year - 1) {
    const dd = describeDelta(ind, prev.value, L.value);
    if (dd) out.push(dd === "stable" ? `Stable par rapport à ${prev.year}.` : `Évolution sur un an : ${dd}.`);
  }
  const ref = ind.growthSince ? main.obs.find((o) => o.year === ind.growthSince) : main.obs.find((o) => o.year === L.year - 10);
  if (ref && !ind.signed && deltaMode(ind) !== "none") {
    const dd = describeDelta(ind, ref.value, L.value);
    if (dd) out.push(`Depuis ${ref.year} (${fmt(ref.value, d)}${us}) : ${dd}.`);
  }
  const eu = series.find((s) => s.geo === "EU27_2020");
  if (eu?.latest) {
    const same = eu.valueAt(L.year);
    if (same !== null) out.push(`Moyenne de l'Union européenne la même année : ${fmt(same, d)}${us}.`);
    else out.push(`Moyenne de l'Union européenne ${when(ind, eu.latest.year)} : ${fmt(eu.latest.value, d)}${us}.`);
  }
  return out.join(" ");
}

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildModel(store = loadStore()) {
  const indicators = INDICATORS.map((ind) => {
    const series = buildSeries(ind, store);
    const years = [...new Set(series.flatMap((s) => s.obs.map((o) => o.year)))].sort((a, b) => a - b);
    const updated = series.map((s) => s.updated).filter(Boolean).sort().at(-1) ?? null;
    const main = series[0];
    const theme = THEMES.find((t) => t.slug === ind.theme);
    const datasets = [...new Set(series.map((s) => s.dataset))].map((code) => ({
      code,
      title: DATASETS[code] ?? code,
      url: eurostatBrowserUrl(code),
    }));
    let rows = null;
    if (ind.chart === "hbar") {
      rows = series
        .filter((s) => s.latest)
        .map((s) => ({
          label: s.label,
          id: s.id,
          geo: s.geo,
          year: s.latest.year,
          value: s.latest.value,
          growth: ind.growthSince && s.valueAt(ind.growthSince) ? (s.latest.value / s.valueAt(ind.growthSince) - 1) * 100 : null,
        }))
        .sort((a, b) => b.value - a.value);
    }
    return {
      ...ind,
      url: `/indicateurs/${ind.slug}/`,
      themeTitle: theme.title,
      themeShort: theme.short,
      series,
      years,
      firstYear: years[0],
      lastYear: years.at(-1),
      updated,
      datasets,
      headline: main?.latest ?? null,
      rows,
      summary: sentence(ind, series).replace(/ (%|ans?\b|Mt\b|M€|€)/g, "\u00a0$1"),
      metaDescription: null, // rempli plus bas
    };
  });

  for (const ind of indicators) {
    const h = ind.headline;
    const v = h ? `${fmt(h.value, ind.decimals)}${ind.unitShort === "%" ? " %" : ind.unitShort ? " " + ind.unitShort : ""}` : "";
    ind.metaDescription = truncate(
      `${ind.title} en Belgique${h && ind.chart !== "hbar" ? ` : ${v} (${h.year})` : ""}. Évolution ${ind.firstYear}-${ind.lastYear}, graphique, tableau et données ouvertes CSV/JSON (Eurostat).`,
      158
    );
  }

  const themes = THEMES.map((t) => ({
    ...t,
    url: `/themes/${t.slug}/`,
    indicators: indicators.filter((i) => i.theme === t.slug),
  }));

  const lastUpdate = indicators.map((i) => i.updated).filter(Boolean).sort().at(-1);
  return { indicators, themes, lastUpdate, generatedAt: store.generatedAt };
}

function truncate(s, n) {
  if (s.length <= n) return s;
  return s.slice(0, s.lastIndexOf(" ", n - 1)) + "…";
}
