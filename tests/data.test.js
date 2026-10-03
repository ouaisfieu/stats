import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeJsonStat } from "../scripts/fetch-data.js";
import { buildModel, loadStore } from "../lib/model.js";
import { allSeries, seriesKey, INDICATORS } from "../lib/catalog.js";

test("decodeJsonStat : réponse creuse avec dimension time", () => {
  const js = {
    id: ["freq", "geo", "time"],
    size: [1, 1, 3],
    updated: "2026-01-01T00:00:00+0100",
    dimension: { time: { category: { index: { 2023: 0, 2024: 1, 2025: 2 } } } },
    value: { 0: 1.5, 2: 2.5 },
    status: { 2: "p" },
  };
  const r = decodeJsonStat(js);
  assert.deepEqual(r.obs, { 2023: 1.5, 2025: 2.5 });
  assert.deepEqual(r.status, { 2025: "p" });
});

test("decodeJsonStat : refuse une dimension non fixée", () => {
  const js = { id: ["geo", "time"], size: [2, 1], dimension: { time: { category: { index: { 2025: 0 } } } }, value: {} };
  assert.throws(() => decodeJsonStat(js));
});

test("chaque série du catalogue a des données", () => {
  const store = loadStore();
  for (const s of allSeries()) {
    const rec = store.series[seriesKey(s)];
    assert.ok(rec, `série absente : ${seriesKey(s)}`);
    assert.ok(Object.keys(rec.obs).length > 0, `série vide : ${seriesKey(s)}`);
  }
});

test("le modèle produit un indicateur complet par entrée du catalogue", () => {
  const m = buildModel();
  assert.equal(m.indicators.length, INDICATORS.length);
  const slugs = new Set();
  for (const i of m.indicators) {
    assert.ok(!slugs.has(i.slug), `slug en double : ${i.slug}`);
    slugs.add(i.slug);
    assert.ok(i.headline, `pas de dernière valeur : ${i.slug}`);
    assert.ok(i.summary.length > 20);
    assert.ok(i.metaDescription.length <= 160, `meta description trop longue : ${i.slug}`);
  }
});

test("cohérence : somme des régions = Belgique (population)", () => {
  const m = buildModel();
  const be = m.indicators.find((i) => i.slug === "population").series[0];
  const reg = m.indicators.find((i) => i.slug === "population-regions").series;
  const y = reg[0].latest.year;
  const sum = reg.reduce((a, s) => a + s.valueAt(y), 0);
  assert.equal(sum, be.valueAt(y));
});
