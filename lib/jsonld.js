// Données structurées : schema.org (JSON-LD) pour les moteurs de recherche,
// et DCAT-AP pour les portails de données ouvertes.
import { GEO } from "./catalog.js";
import { isoDate } from "./format.js";

const EUROSTAT = {
  "@type": "Organization",
  "@id": "https://ec.europa.eu/eurostat#org",
  name: "Eurostat",
  alternateName: "Office statistique de l'Union européenne",
  url: "https://ec.europa.eu/eurostat",
};
const STATBEL = {
  "@type": "GovernmentOrganization",
  name: "Statbel",
  alternateName: "Office belge de statistique",
  url: "https://statbel.fgov.be/fr",
};

// Thèmes de données de l'UE (vocabulaire contrôlé EU Vocabularies « data-theme »)
const EU_THEME = "http://publications.europa.eu/resource/authority/data-theme/";
const THEME_BY_INDICATOR = {
  population: ["SOCI"],
  "population-regions": ["SOCI", "REGI"],
  "population-provinces": ["SOCI", "REGI"],
  "naissances-deces": ["SOCI"],
  "solde-migratoire": ["SOCI"],
  "esperance-de-vie": ["HEAL", "SOCI"],
  fecondite: ["SOCI"],
  "age-median": ["SOCI"],
  "part-65-ans-et-plus": ["SOCI"],
  "chomage-par-region": ["ECON", "REGI"],
  "diplomes-du-superieur": ["EDUC"],
  "energies-renouvelables": ["ENER", "ENVI"],
  "emissions-gaz-a-effet-de-serre": ["ENVI"],
  "voitures-par-habitant": ["TRAN"],
  "risque-de-pauvrete": ["SOCI"],
  "revenu-median": ["SOCI", "ECON"],
  proprietaires: ["SOCI"],
};
const THEME_DEFAULT = { population: ["SOCI"], economie: ["ECON"], societe: ["SOCI"], institutions: ["GOVE", "ECON"] };
export const dataThemes = (ind) => (THEME_BY_INDICATOR[ind.slug] ?? THEME_DEFAULT[ind.theme]).map((c) => EU_THEME + c);

export function place(geo) {
  const g = GEO[geo];
  if (!g) return { "@type": "Country", name: "Belgique", sameAs: ["https://www.wikidata.org/wiki/Q31", "http://data.europa.eu/nuts/code/BE"] };
  const sameAs = [];
  if (g.wikidata) sameAs.push(`https://www.wikidata.org/wiki/${g.wikidata}`);
  if (g.nuts) sameAs.push(`http://data.europa.eu/nuts/code/${g.nuts}`);
  const type = geo === "BE" ? "Country" : geo === "EU27_2020" ? "Place" : "AdministrativeArea";
  return { "@type": type, name: g.label, ...(sameAs.length ? { sameAs } : {}) };
}

function spatial(ind) {
  const geos = [...new Set(ind.series.map((s) => s.geo))];
  return geos.length === 1 ? place(geos[0]) : geos.map(place);
}

export function datasetLd(ind, site) {
  const page = site.url + ind.url;
  const id = page + "#dataset";
  const desc = `${ind.definition} ${ind.summary}`.trim();
  const graph = [
    {
      "@type": "Dataset",
      "@id": id,
      name: `${ind.title} — Belgique`,
      alternateName: ind.question,
      description: desc.length >= 50 ? desc : desc + " Données Eurostat pour la Belgique.",
      url: page,
      identifier: ind.slug,
      keywords: [...ind.keywords, "Belgique", "statistiques", "open data", "Eurostat"],
      inLanguage: "fr-BE",
      isAccessibleForFree: true,
      license: site.eurostatCopyright,
      creditText: "Source : Eurostat",
      creator: ind.series.some((s) => s.dataset.startsWith("demo_")) ? [EUROSTAT, STATBEL] : EUROSTAT,
      provider: { "@id": site.url + "/#website-publisher" },
      isBasedOn: ind.datasets.map((d) => d.url),
      temporalCoverage: `${ind.firstYear}/${ind.lastYear}`,
      spatialCoverage: spatial(ind),
      ...(ind.updated ? { dateModified: isoDate(ind.updated) } : {}),
      variableMeasured: {
        "@type": "PropertyValue",
        name: ind.title,
        description: ind.definition,
        unitText: ind.unit,
      },
      measurementTechnique: ind.datasets.map((d) => `Eurostat ${d.code} — ${d.title}`).join(" ; "),
      distribution: [
        { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${site.url}/donnees/${ind.slug}.csv` },
        { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${site.url}/donnees/${ind.slug}.json` },
      ],
      includedInDataCatalog: { "@type": "DataCatalog", name: site.title, url: site.url + "/donnees/" },
    },
    {
      "@type": "WebPage",
      "@id": page,
      url: page,
      name: ind.title,
      description: ind.metaDescription,
      inLanguage: "fr-BE",
      isPartOf: { "@id": site.url + "/#website" },
      about: { "@id": id },
      mainEntity: { "@id": id },
      author: { "@id": site.url + "/#author" },
      ...(ind.updated ? { dateModified: isoDate(ind.updated) } : {}),
    },
  ];
  // Dernière observation de chaque série (schema.org Observation)
  for (const s of ind.series) {
    if (!s.latest) continue;
    graph.push({
      "@type": "Observation",
      name: `${ind.title} — ${s.label} — ${s.latest.year}`,
      observationAbout: place(s.geo),
      variableMeasured: { "@type": "StatisticalVariable", name: ind.chart === "hbar" || s.geo === "BE" ? `${ind.title} — ${s.label}` : ind.title },
      observationDate: String(s.latest.year),
      value: s.latest.value,
      unitText: ind.unit,
      measurementMethod: `https://ec.europa.eu/eurostat/databrowser/view/${s.dataset}/default/table?lang=fr`,
      isPartOf: { "@id": id },
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function collectionLd({ url, name, description, items }, site) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": site.url + url,
    url: site.url + url,
    name,
    description,
    inLanguage: "fr-BE",
    isPartOf: { "@id": site.url + "/#website" },
    author: { "@id": site.url + "/#author" },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((ind, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: site.url + ind.url,
        name: ind.title,
      })),
    },
  };
}

export function catalogLd(model, site) {
  return {
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    "@id": site.url + "/donnees/#catalog",
    name: `${site.title} — catalogue de données`,
    description:
      "Séries statistiques sur la Belgique, extraites de l'API Eurostat et republiées en CSV et JSON, avec métadonnées DCAT-AP.",
    url: site.url + "/donnees/",
    inLanguage: "fr-BE",
    license: site.eurostatCopyright,
    ...(model.lastUpdate ? { dateModified: isoDate(model.lastUpdate) } : {}),
    publisher: { "@id": site.url + "/#website-publisher" },
    dataset: model.indicators.map((ind) => ({
      "@type": "Dataset",
      "@id": site.url + ind.url + "#dataset",
      name: `${ind.title} — Belgique`,
      url: site.url + ind.url,
    })),
  };
}

/** Catalogue DCAT-AP 2 (JSON-LD), moissonnable par data.europa.eu, data.gov.be… */
export function dcatCatalog(model, site) {
  return {
    "@context": {
      dcat: "http://www.w3.org/ns/dcat#",
      dct: "http://purl.org/dc/terms/",
      foaf: "http://xmlns.com/foaf/0.1/",
      xsd: "http://www.w3.org/2001/XMLSchema#",
      vcard: "http://www.w3.org/2006/vcard/ns#",
      "dct:issued": { "@type": "xsd:date" },
      "dct:modified": { "@type": "xsd:date" },
      "dcat:theme": { "@type": "@id" },
      "dct:spatial": { "@type": "@id" },
      "dcat:downloadURL": { "@type": "@id" },
      "dcat:accessURL": { "@type": "@id" },
      "dcat:landingPage": { "@type": "@id" },
      "dct:license": { "@type": "@id" },
      "dct:source": { "@type": "@id" },
      "dct:format": { "@type": "@id" },
      "dcat:mediaType": { "@type": "@id" },
      "dct:language": { "@type": "@id" },
    },
    "@id": site.url + "/catalogue.jsonld",
    "@type": "dcat:Catalog",
    "dct:title": { "@value": `${site.title} — catalogue de données`, "@language": "fr" },
    "dct:description": { "@value": site.description, "@language": "fr" },
    "dct:language": "http://publications.europa.eu/resource/authority/language/FRA",
    "dct:publisher": { "@type": "foaf:Agent", "foaf:name": site.title, "foaf:homepage": { "@id": site.url + "/" } },
    "foaf:homepage": { "@id": site.url + "/" },
    ...(model.lastUpdate ? { "dct:modified": isoDate(model.lastUpdate) } : {}),
    "dcat:dataset": model.indicators.map((ind) => ({
      "@id": site.url + ind.url + "#dataset",
      "@type": "dcat:Dataset",
      "dct:identifier": ind.slug,
      "dct:title": { "@value": `${ind.title} — Belgique`, "@language": "fr" },
      "dct:description": { "@value": ind.definition, "@language": "fr" },
      "dcat:keyword": ind.keywords.map((k) => ({ "@value": k, "@language": "fr" })),
      "dcat:theme": dataThemes(ind),
      "dct:spatial": [...new Set(ind.series.map((s) => s.geo))].map((g) =>
        GEO[g]?.nuts ? `http://data.europa.eu/nuts/code/${GEO[g].nuts}` : "http://publications.europa.eu/resource/authority/country/EUR"
      ),
      "dct:temporal": {
        "@type": "dct:PeriodOfTime",
        "dcat:startDate": { "@value": `${ind.firstYear}-01-01`, "@type": "xsd:date" },
        "dcat:endDate": { "@value": `${ind.lastYear}-12-31`, "@type": "xsd:date" },
      },
      ...(ind.updated ? { "dct:modified": isoDate(ind.updated) } : {}),
      "dct:accrualPeriodicity": { "@id": "http://publications.europa.eu/resource/authority/frequency/ANNUAL" },
      "dct:source": ind.datasets.map((d) => d.url),
      "dcat:landingPage": site.url + ind.url,
      "dcat:distribution": [
        ["csv", "text/csv", "CSV"],
        ["json", "application/json", "JSON"],
      ].map(([ext, mt, f]) => ({
        "@type": "dcat:Distribution",
        "dct:title": { "@value": `${ind.title} (${f})`, "@language": "fr" },
        "dcat:downloadURL": `${site.url}/donnees/${ind.slug}.${ext}`,
        "dcat:accessURL": site.url + ind.url,
        "dcat:mediaType": `https://www.iana.org/assignments/media-types/${mt}`,
        "dct:format": `http://publications.europa.eu/resource/authority/file-type/${f}`,
        "dct:license": site.eurostatCopyright,
      })),
    })),
  };
}

export function websiteLd(site) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": site.url + "/#website",
        url: site.url + "/",
        name: site.title,
        alternateName: site.shortTitle,
        description: site.description,
        inLanguage: site.lang,
        author: { "@id": site.url + "/#author" },
        publisher: { "@id": site.url + "/#website-publisher" },
      },
      {
        "@type": "Person",
        "@id": site.url + "/#author",
        name: site.author.name,
        description: site.author.description,
        url: site.author.url,
        affiliation: { "@type": "Organization", name: "Anthropic", url: "https://www.anthropic.com" },
      },
      {
        "@type": "Organization",
        "@id": site.url + "/#website-publisher",
        name: site.title,
        url: site.url + "/",
        logo: site.url + "/apple-touch-icon.png",
        sameAs: [site.repo],
      },
    ],
  };
}
