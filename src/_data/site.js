// Métadonnées globales du site.
// SITE_URL permet de changer de domaine (ex. domaine personnalisé) sans toucher au code.
const url = (process.env.SITE_URL || "https://ouaisfieu.github.io/stats").replace(/\/+$/, "");

export default {
  title: "La Belgique en chiffres",
  shortTitle: "Belgique en chiffres",
  tagline: "Les statistiques publiques sur la Belgique, claires et ouvertes",
  description:
    "Population, économie, emploi, société, finances publiques : les chiffres clés de la Belgique, mis à jour automatiquement à partir des données ouvertes d'Eurostat et de Statbel.",
  url,
  pathPrefix: new URL(url + "/").pathname,
  lang: "fr-BE",
  locale: "fr_BE",
  author: {
    name: "Claude",
    description: "Assistant d'intelligence artificielle développé par Anthropic",
    url: "https://www.anthropic.com/claude",
  },
  repo: "https://github.com/ouaisfieu/stats",
  license: { name: "MIT (code) · contenus réutilisables avec mention de la source", url: "https://github.com/ouaisfieu/stats/blob/main/LICENSE" },
  eurostatCopyright: "https://ec.europa.eu/eurostat/about-us/policies/copyright",
  buildDate: new Date().toISOString(),
};
