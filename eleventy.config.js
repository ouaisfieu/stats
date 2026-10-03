import { HtmlBasePlugin } from "@11ty/eleventy";
import { buildModel } from "./lib/model.js";
import { chart, sparkline } from "./lib/charts.js";
import { fmt, fmtSigned, fmtCompact, fmtDate, isoDate } from "./lib/format.js";
import { GEO, eurostatBrowserUrl } from "./lib/catalog.js";
import site from "./src/_data/site.js";
import { toCsv, toJson, allJson, latestCsv } from "./lib/exports.js";
import { datasetLd, collectionLd, catalogLd, dcatCatalog, websiteLd } from "./lib/jsonld.js";

export default function (eleventyConfig) {
  const model = buildModel();
  eleventyConfig.addGlobalData("model", model);
  eleventyConfig.addGlobalData("GEO", GEO);

  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  eleventyConfig.addWatchTarget("./lib/");
  eleventyConfig.addWatchTarget("./data/");

  // ── Filtres ──
  eleventyConfig.addFilter("num", (v, d = 0) => fmt(v, d));
  eleventyConfig.addFilter("signed", (v, d = 0) => fmtSigned(v, d));
  eleventyConfig.addFilter("compact", (v, d = 0, u = "") => fmtCompact(v, d, u));
  eleventyConfig.addFilter("dateFr", (v) => fmtDate(v));
  eleventyConfig.addFilter("isoDate", (v) => isoDate(v));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("jsonld", (v) => JSON.stringify(v, null, 0).replace(/</g, "\\u003c"));
  eleventyConfig.addFilter("abs", (path) => site.url + (path.startsWith("/") ? path : "/" + path));
  eleventyConfig.addFilter("eurostatUrl", (code) => eurostatBrowserUrl(code));
  eleventyConfig.addFilter("unitSuffix", (ind) =>
    ind.unitShort === "%" ? "\u00a0%" : ind.unitShort ? `\u00a0${ind.unitShort}` : ""
  );
  eleventyConfig.addFilter("find", (arr, key, val) => (arr || []).find((x) => x[key] === val));
  eleventyConfig.addFilter("byTheme", (arr, slug) => arr.filter((x) => x.theme === slug));
  eleventyConfig.addFilter("featured", (arr) => arr.filter((x) => x.featured));
  eleventyConfig.addFilter("sum", (arr, key) => arr.reduce((a, x) => a + (key ? x[key] : x), 0));
  eleventyConfig.addFilter("valueAt", (serie, year) => serie.obs.find((o) => o.year === year)?.value ?? null);
  eleventyConfig.addFilter("breadcrumbLd", (crumbs) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Accueil", url: "/" }, ...crumbs].map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: site.url + b.url,
    })),
  }));
  eleventyConfig.addFilter("websiteLd", (s) => websiteLd(s));
  eleventyConfig.addFilter("datasetLd", (ind) => datasetLd(ind, site));
  eleventyConfig.addFilter("collectionLd", (o) => collectionLd(o, site));
  eleventyConfig.addFilter("catalogLd", (m) => catalogLd(m, site));
  eleventyConfig.addFilter("dcatCatalog", (m) => dcatCatalog(m, site));
  eleventyConfig.addFilter("faqLd", (inds, slugs) =>
    slugs
      .map((s) => inds.find((i) => i.slug === s))
      .map((i) => ({
        "@type": "Question",
        name: i.question,
        acceptedAnswer: { "@type": "Answer", text: `${i.summary} Source : Eurostat.`, url: site.url + i.url },
      }))
  );
  eleventyConfig.addFilter("ucfirst", (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : s));
  eleventyConfig.addFilter("toCsv", toCsv);
  eleventyConfig.addFilter("toJson", toJson);
  eleventyConfig.addFilter("allJson", allJson);
  eleventyConfig.addFilter("latestCsv", latestCsv);
  eleventyConfig.addFilter("seriesCount", (m) => new Set(m.indicators.flatMap((i) => i.series.map((s) => s.key))).size);
  eleventyConfig.addFilter("uniqueDatasets", (m) => {
    const map = new Map();
    for (const i of m.indicators) for (const d of i.datasets) map.set(d.code, d);
    return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
  });
  eleventyConfig.addFilter("reverseCopy", (arr) => [...arr].reverse());

  // ── Graphiques ──
  // Deux rendus : large (≥ 600 px) et étroit (mobile, colonnes de thème) ;
  // la feuille de style n'affiche que celui qui convient.
  const box = (c, cls) =>
    c ? `<div class="chart ${cls}" data-chart='${c.payload.replace(/'/g, "&#39;")}'>${c.svg}<div class="tip" role="status" aria-live="polite" hidden></div></div>` : "";
  eleventyConfig.addShortcode("chart", (ind, compact = false) => {
    const narrow = box(chart(ind, { width: 400, height: 280, compact: true, id: (compact ? "m-" : "n-") + ind.slug }), compact ? "chart-only" : "chart-narrow");
    if (compact) return narrow;
    return box(chart(ind, { width: 720, height: 340, id: "c-" + ind.slug }), "chart-wide") + narrow;
  });
  eleventyConfig.addShortcode("sparkline", (ind) => sparkline(ind));

  // Minification légère du HTML (espaces entre balises)
  eleventyConfig.addTransform("tidy", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    return content.replace(/\n\s*\n+/g, "\n").replace(/>\s+</g, (m) => (m.includes("\n") ? ">\n<" : m));
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix: site.pathPrefix,
    templateFormats: ["njk", "md", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
