# La Belgique en chiffres

Site statique (Jamstack) qui présente les principaux indicateurs statistiques sur la Belgique — population, économie, emploi, société, finances publiques et institutions — à partir des **données ouvertes d'Eurostat**, mises à jour automatiquement chaque semaine.

**En ligne :** https://ouaisfieu.github.io/stats/

- 29 indicateurs, 68 séries, comparaison avec la moyenne de l'UE quand elle existe
- Graphiques SVG générés au build (lisibles sans JavaScript), tableau de données et texte de synthèse pour chacun
- Téléchargements CSV / JSON par indicateur, fichier global, catalogue **DCAT-AP** (`/catalogue.jsonld`)
- SEO et web sémantique : JSON-LD schema.org (`Dataset`, `Observation`, `StatisticalVariable`, `BreadcrumbList`, `FAQPage`, `CollectionPage`), territoires identifiés par Wikidata et les URI NUTS de l'UE, sitemap, flux Atom, `llms.txt`, Open Graph
- Aucun cookie, aucun traceur, aucune dépendance côté client (un seul petit script optionnel pour les infobulles)

## Fonctionnement

```
lib/catalog.js        ← catalogue des indicateurs (source unique de vérité)
scripts/fetch-data.js ← interroge l'API Eurostat (JSON-stat) et met à jour data/eurostat.json
data/eurostat.json    ← données versionnées (l'historique git garde les révisions)
lib/model.js          ← assemble catalogue + données : dernières valeurs, variations, phrases
lib/charts.js         ← graphiques SVG (lignes, colonnes, barres)
lib/jsonld.js         ← schema.org et DCAT-AP
src/                  ← gabarits Eleventy (Nunjucks), CSS, JS, fichiers statiques
tests/                ← tests des données et du site construit
```

Le workflow `.github/workflows/deploy.yml` s'exécute à chaque push sur `main`, chaque lundi et à la demande :

1. récupère les séries sur l'API Eurostat (une série en échec garde sa dernière valeur connue) ;
2. si les données ont changé, les commite dans le dépôt ;
3. construit le site, lance les tests et la validation HTML ;
4. publie sur GitHub Pages.

## Mise en route

**Une seule fois :** dans *Settings → Pages*, choisir **Source : GitHub Actions**.

En local (Node ≥ 20) :

```bash
npm ci
npm run fetch   # facultatif : rafraîchit data/eurostat.json depuis Eurostat
npm start       # serveur de développement sur http://localhost:8080/stats/
npm run build && npm test
```

Domaine personnalisé : définir la variable de dépôt `SITE_URL` (ex. `https://chiffres.example.be`) dans *Settings → Secrets and variables → Actions → Variables*, et ajouter un fichier `src/static/CNAME`.

## Ajouter un indicateur

1. Trouver le jeu de données sur le [navigateur Eurostat](https://ec.europa.eu/eurostat/databrowser/) et noter son code et ses dimensions.
2. Ajouter une entrée dans `INDICATORS` (`lib/catalog.js`) : chaque série doit fixer **toutes** les dimensions sauf `time`.
3. `npm run fetch` puis `npm start` : la page, le graphique, les exports, le sitemap et les données structurées sont générés automatiquement.

## Sources et licence

- Données : © Union européenne, Eurostat — réutilisation libre avec mention de la source ([politique de réutilisation](https://ec.europa.eu/eurostat/about-us/policies/copyright)). Les chiffres belges sont transmis à Eurostat par Statbel, la Banque nationale de Belgique et les autres autorités statistiques.
- Données institutionnelles (`src/_data/institutions.js`) : relevées manuellement, sources citées sur la page.
- Code : licence MIT.

## Auteur

Conçu, développé et rédigé par **Claude**, assistant d'IA d'Anthropic. Projet indépendant, sans affiliation avec Eurostat, Statbel ni Anthropic.
