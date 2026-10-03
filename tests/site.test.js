// Vérifications du site construit (_site) : liens internes, JSON-LD, balises SEO.
// Lancer après `npm run build`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import site from "../src/_data/site.js";

const OUT = path.resolve("_site");
const PREFIX = site.pathPrefix; // ex. /stats/
const skip = !existsSync(OUT);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = skip ? [] : walk(OUT);
const html = files.filter((f) => f.endsWith(".html"));

test("pages HTML : titre, description, canonical, h1 unique, lang", { skip }, () => {
  const titles = new Map();
  for (const f of html) {
    const s = readFileSync(f, "utf8");
    assert.match(s, /<html lang="fr-BE"/, f);
    const t = s.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(t, `title manquant : ${f}`);
    if (!f.endsWith("404.html")) {
      assert.ok(!titles.has(t), `title en double : ${t}`);
      titles.set(t, f);
    }
    assert.match(s, /<meta name="description" content="[^"]{50,}"/, `description : ${f}`);
    assert.match(s, /<link rel="canonical" href="https:\/\//, `canonical : ${f}`);
    assert.equal((s.match(/<h1[\s>]/g) || []).length, 1, `h1 : ${f}`);
    assert.ok(!/&amp;amp;/.test(s), `double échappement : ${f}`);
  }
});

test("JSON-LD valide sur chaque page", { skip }, () => {
  for (const f of html) {
    const s = readFileSync(f, "utf8");
    const blocks = [...s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length >= 1, f);
    for (const b of blocks) JSON.parse(b[1]);
  }
  JSON.parse(readFileSync(path.join(OUT, "catalogue.jsonld"), "utf8"));
});

test("liens internes non cassés", { skip }, () => {
  const broken = [];
  for (const f of html) {
    const s = readFileSync(f, "utf8");
    for (const m of s.matchAll(/(?:href|src)="([^"#?]+)/g)) {
      const u = m[1];
      if (!u.startsWith(PREFIX)) {
        if (u.startsWith("/")) broken.push(`${f} → ${u} (sans préfixe)`);
        continue;
      }
      let p = path.join(OUT, u.slice(PREFIX.length));
      if (u.endsWith("/")) p = path.join(p, "index.html");
      if (!existsSync(p)) broken.push(`${f} → ${u}`);
    }
  }
  assert.deepEqual(broken, []);
});

test("fichiers SEO présents", { skip }, () => {
  for (const f of ["sitemap.xml", "robots.txt", "feed.xml", "llms.txt", "og.png", "favicon.svg", "site.webmanifest", "404.html"])
    assert.ok(existsSync(path.join(OUT, f)), f);
  const sm = readFileSync(path.join(OUT, "sitemap.xml"), "utf8");
  assert.ok((sm.match(/<loc>/g) || []).length >= 35);
});
