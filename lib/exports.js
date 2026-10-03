// Exports de données : CSV (RFC 4180, UTF-8) et JSON.
import site from "../src/_data/site.js";

const q = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (cells) => cells.map(q).join(",");
const HEAD = ["indicateur", "serie", "libelle", "annee", "valeur", "unite", "source"];

export function toCsv(ind) {
  const lines = [row(HEAD)];
  for (const s of ind.series)
    for (const o of s.obs) lines.push(row([ind.slug, s.id, s.label, o.year, o.value, ind.unit, `Eurostat ${s.dataset}`]));
  return lines.join("\r\n") + "\r\n";
}

function indicatorJson(ind) {
  return {
    id: ind.slug,
    titre: ind.title,
    question: ind.question,
    theme: ind.theme,
    unite: ind.unit,
    definition: ind.definition,
    resume: ind.summary,
    url: site.url + ind.url,
    periode: { debut: ind.firstYear, fin: ind.lastYear },
    miseAJour: ind.updated,
    source: {
      producteur: "Eurostat",
      jeuxDeDonnees: ind.datasets.map((d) => ({ code: d.code, titre: d.title, url: d.url })),
      reutilisation: site.eurostatCopyright,
    },
    series: ind.series.map((s) => ({
      id: s.id,
      libelle: s.label,
      territoire: s.geo,
      jeuDeDonnees: s.dataset,
      parametres: s.params,
      api: s.apiUrl,
      observations: s.obs.map((o) => ({ annee: o.year, valeur: o.value })),
    })),
  };
}

export const toJson = (ind) => JSON.stringify(indicatorJson(ind), null, 2) + "\n";

export const allJson = (model) =>
  JSON.stringify(
    {
      titre: site.title,
      url: site.url,
      genereLe: site.buildDate,
      derniereMiseAJour: model.lastUpdate,
      indicateurs: model.indicators.map(indicatorJson),
    },
    null,
    1
  ) + "\n";

export function latestCsv(model) {
  const lines = [row(["indicateur", "serie", "libelle", "annee", "valeur", "unite", "url"])];
  for (const ind of model.indicators)
    for (const s of ind.series)
      if (s.latest) lines.push(row([ind.slug, s.id, s.label, s.latest.year, s.latest.value, ind.unit, site.url + ind.url]));
  return lines.join("\r\n") + "\r\n";
}
