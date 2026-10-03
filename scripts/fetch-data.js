#!/usr/bin/env node
// Récupère toutes les séries du catalogue depuis l'API Eurostat (JSON-stat 2.0)
// et met à jour data/eurostat.json. En cas d'échec d'une série, la valeur
// précédemment enregistrée est conservée : le site peut toujours être construit.
//
// Usage : node scripts/fetch-data.js [--strict]

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { allSeries, seriesKey, eurostatApiUrl } from "../lib/catalog.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "data", "eurostat.json");
const STRICT = process.argv.includes("--strict");
const CONCURRENCY = 4;

/** Décode une réponse JSON-stat 2.0 dont seule la dimension « time » varie. */
export function decodeJsonStat(js) {
  const ids = js.id;
  const sizes = js.size;
  const tIdx = ids.indexOf("time");
  if (tIdx < 0) throw new Error("dimension time absente");
  ids.forEach((d, i) => {
    if (i !== tIdx && sizes[i] !== 1) throw new Error(`dimension ${d} non fixée (taille ${sizes[i]})`);
  });
  const timeIndex = js.dimension.time.category.index; // { "2005": 0, … }
  const byPos = Object.fromEntries(Object.entries(timeIndex).map(([t, i]) => [i, t]));
  const obs = {};
  for (const [k, v] of Object.entries(js.value ?? {})) {
    if (v === null || v === undefined) continue;
    const t = byPos[Number(k)];
    if (t !== undefined) obs[t] = v;
  }
  const status = {};
  for (const [k, v] of Object.entries(js.status ?? {})) {
    const t = byPos[Number(k)];
    if (t !== undefined && obs[t] !== undefined) status[t] = v;
  }
  return { updated: js.updated, label: js.label, obs, status };
}

async function fetchJson(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 60_000);
      const res = await fetch(url, { signal: ctrl.signal, headers: { accept: "application/json" } });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastErr;
}

async function main() {
  let store = { series: {} };
  try {
    store = JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    /* premier lancement */
  }

  const queue = allSeries();
  const failures = [];
  let changed = 0;

  async function worker() {
    while (queue.length) {
      const serie = queue.shift();
      const key = seriesKey(serie);
      const url = eurostatApiUrl(serie);
      try {
        const js = await fetchJson(url);
        const { updated, label, obs, status } = decodeJsonStat(js);
        if (!Object.keys(obs).length) throw new Error("aucune observation");
        const prev = store.series[key];
        const next = { dataset: serie.dataset, label, updated, obs, status, origin: "api" };
        if (JSON.stringify(prev?.obs) !== JSON.stringify(obs) || prev?.updated !== updated) changed++;
        store.series[key] = next;
        console.log(`✓ ${key} (${Object.keys(obs).length} obs.)`);
      } catch (e) {
        failures.push(key);
        console.warn(`✗ ${key} — ${e.message} (valeur précédente conservée)`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Tri des clés pour des diffs git lisibles
  store.series = Object.fromEntries(Object.entries(store.series).sort(([a], [b]) => a.localeCompare(b)));
  if (changed || !store.generatedAt) store.generatedAt = new Date().toISOString();
  store.source = "Eurostat — API Statistics 1.0 (JSON-stat 2.0)";
  await writeFile(FILE, JSON.stringify(store, null, 1) + "\n");

  console.log(`\n${allSeries().length - failures.length} séries à jour, ${changed} modifiées, ${failures.length} échecs.`);
  if (STRICT && failures.length) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e);
    process.exit(STRICT ? 1 : 0);
  });
}
