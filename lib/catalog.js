// Catalogue des indicateurs : source unique de vérité.
// Utilisé par le script de récupération (scripts/fetch-data.js) et par le site (src/_data).
// Chaque série correspond à une requête Eurostat (API Statistics 1.0, JSON-stat 2.0)
// dont toutes les dimensions, hors « time », sont fixées à une seule valeur.

export const SINCE = 2005;

const BE = { code: "BE", label: "Belgique" };
const EU = { code: "EU27_2020", label: "Union européenne (27)" };

export const GEO = {
  BE: { label: "Belgique", nuts: "BE", wikidata: "Q31" },
  EU27_2020: { label: "Union européenne (27)", nuts: null, wikidata: "Q458" },
  BE1: { label: "Région de Bruxelles-Capitale", short: "Bruxelles", nuts: "BE1" },
  BE2: { label: "Région flamande", short: "Flandre", nuts: "BE2" },
  BE3: { label: "Région wallonne", short: "Wallonie", nuts: "BE3" },
  BE10: { label: "Bruxelles-Capitale", nuts: "BE10" },
  BE21: { label: "Anvers", nuts: "BE21" },
  BE22: { label: "Limbourg", nuts: "BE22" },
  BE23: { label: "Flandre-Orientale", nuts: "BE23" },
  BE24: { label: "Brabant flamand", nuts: "BE24" },
  BE25: { label: "Flandre-Occidentale", nuts: "BE25" },
  BE31: { label: "Brabant wallon", nuts: "BE31" },
  BE32: { label: "Hainaut", nuts: "BE32" },
  BE33: { label: "Liège", nuts: "BE33" },
  BE34: { label: "Luxembourg", nuts: "BE34" },
  BE35: { label: "Namur", nuts: "BE35" },
};

export const DATASETS = {
  demo_gind: "Population au 1er janvier et indicateurs démographiques",
  demo_r_d2jan: "Population au 1er janvier par région NUTS 2",
  demo_mlexpec: "Espérance de vie par âge et sexe",
  demo_find: "Indicateurs de fécondité",
  demo_pjanind: "Indicateurs de structure de la population",
  nama_10_gdp: "PIB et principales composantes",
  nama_10_pc: "Agrégats principaux par habitant",
  prc_ppp_ind: "Niveaux de prix et volumes en standards de pouvoir d'achat",
  prc_hicp_aind: "IPCH – moyennes annuelles",
  une_rt_a: "Chômage par sexe et âge – données annuelles",
  lfst_r_lfu3rt: "Taux de chômage par région NUTS 2",
  lfsi_emp_a: "Emploi et activité – données annuelles",
  ilc_peps01n: "Personnes en risque de pauvreté ou d'exclusion sociale",
  ilc_di03: "Revenu moyen et médian par âge et sexe",
  ilc_lvho02: "Distribution de la population par statut d'occupation du logement",
  edat_lfse_03: "Niveau d'éducation atteint par la population",
  nrg_ind_ren: "Part des énergies renouvelables",
  env_air_gge: "Émissions de gaz à effet de serre par secteur",
  road_eqs_carhab: "Voitures particulières pour 1 000 habitants",
  gov_10dd_edpt1: "Déficit et dette publics",
  gov_10a_main: "Principaux agrégats des administrations publiques",
  gov_10a_exp: "Dépenses des administrations publiques par fonction (COFOG)",
};

const s = (geo, dataset, params, extra = {}) => ({
  id: extra.id ?? geo.code ?? geo,
  geo: geo.code ?? geo,
  label: extra.label ?? (typeof geo === "string" ? GEO[geo].short ?? GEO[geo].label : geo.label),
  dataset,
  params: { ...params, geo: geo.code ?? geo },
  since: extra.since,
});

const regions = (dataset, params) => ["BE1", "BE2", "BE3"].map((g) => s(g, dataset, params));
const provinces = (dataset, params) =>
  ["BE10", "BE21", "BE22", "BE23", "BE24", "BE25", "BE31", "BE32", "BE33", "BE34", "BE35"].map((g) =>
    s(g, dataset, params, { since: 2015 })
  );

export const THEMES = [
  {
    slug: "population",
    title: "Population & territoire",
    short: "Population",
    intro:
      "Combien sommes-nous, où vivons-nous et comment la population évolue-t-elle ? Démographie, régions, provinces, natalité, espérance de vie et vieillissement.",
  },
  {
    slug: "economie",
    title: "Économie & emploi",
    short: "Économie",
    intro:
      "Produit intérieur brut, croissance, prix à la consommation, emploi et chômage : les grands agrégats de l'économie belge, comparés à la moyenne européenne.",
  },
  {
    slug: "societe",
    title: "Société & vie quotidienne",
    short: "Société",
    intro:
      "Revenus, pauvreté, logement, éducation, énergie et environnement : des indicateurs pour mesurer les conditions de vie en Belgique.",
  },
  {
    slug: "institutions",
    title: "Politique & institutions",
    short: "Institutions",
    intro:
      "Finances publiques, dette, dépenses de l'État par fonction et organisation institutionnelle d'un pays fédéral à trois régions et trois communautés.",
  },
];

// fmt: nombre de décimales ; unit: suffixe affiché ; chart: line | bar | hbar
export const INDICATORS = [
  // ───────────── Population & territoire ─────────────
  {
    slug: "population",
    pointInTime: true,
    theme: "population",
    title: "Population totale",
    question: "Combien d'habitants compte la Belgique ?",
    unit: "habitants",
    unitShort: "",
    decimals: 0,
    chart: "line",
    keywords: ["population", "habitants", "démographie"],
    definition:
      "Nombre de personnes ayant leur résidence habituelle en Belgique au 1er janvier de l'année, d'après le Registre national, transmis par Statbel à Eurostat.",
    series: [s(BE, "demo_gind", { indic_de: "JAN" })],
    featured: true,
  },
  {
    slug: "population-regions",
    pointInTime: true,
    theme: "population",
    title: "Population par région",
    question: "Comment la population se répartit-elle entre Bruxelles, la Flandre et la Wallonie ?",
    unit: "habitants",
    decimals: 0,
    chart: "line",
    keywords: ["régions", "Flandre", "Wallonie", "Bruxelles", "population"],
    definition:
      "Population résidente au 1er janvier dans chacune des trois régions belges (niveau NUTS 1).",
    series: regions("demo_r_d2jan", { sex: "T", age: "TOTAL", unit: "NR" }),
    share: true,
  },
  {
    slug: "population-provinces",
    pointInTime: true,
    theme: "population",
    title: "Population par province",
    question: "Quelles sont les provinces les plus peuplées ?",
    unit: "habitants",
    decimals: 0,
    chart: "hbar",
    keywords: ["provinces", "population", "Anvers", "Hainaut", "Liège"],
    definition:
      "Population résidente au 1er janvier dans les dix provinces et la Région de Bruxelles-Capitale (niveau NUTS 2).",
    series: provinces("demo_r_d2jan", { sex: "T", age: "TOTAL", unit: "NR" }),
    growthSince: 2015,
  },
  {
    slug: "naissances-deces",
    delta: "none",
    theme: "population",
    title: "Naissances et décès",
    question: "Combien de naissances et de décès chaque année ?",
    unit: "personnes",
    decimals: 0,
    chart: "line",
    keywords: ["naissances", "décès", "natalité", "mortalité", "solde naturel"],
    definition:
      "Nombre de naissances vivantes et de décès enregistrés au cours de l'année civile en Belgique.",
    series: [
      s(BE, "demo_gind", { indic_de: "LBIRTH" }, { label: "Naissances", id: "naissances" }),
      s(BE, "demo_gind", { indic_de: "DEATH" }, { label: "Décès", id: "deces" }),
    ],
  },
  {
    slug: "solde-migratoire",
    delta: "abs",
    theme: "population",
    title: "Solde migratoire",
    question: "La Belgique gagne-t-elle des habitants par la migration ?",
    unit: "personnes",
    decimals: 0,
    chart: "bar",
    keywords: ["migration", "immigration", "émigration", "solde migratoire"],
    definition:
      "Différence entre la variation totale de la population et le solde naturel (naissances moins décès), ajustements statistiques compris. Une valeur positive signifie plus d'arrivées que de départs.",
    series: [s(BE, "demo_gind", { indic_de: "CNMIGRAT" })],
  },
  {
    slug: "esperance-de-vie",
    delta: "abs",
    deltaWord: "an",
    theme: "population",
    title: "Espérance de vie à la naissance",
    question: "Combien de temps vit-on en Belgique ?",
    unit: "ans",
    unitShort: "ans",
    decimals: 1,
    chart: "line",
    keywords: ["espérance de vie", "santé", "longévité"],
    definition:
      "Nombre moyen d'années qu'un nouveau-né peut espérer vivre si les conditions de mortalité de l'année restent inchangées.",
    series: [
      s(BE, "demo_mlexpec", { sex: "T", age: "Y_LT1", unit: "YR" }),
      s(EU, "demo_mlexpec", { sex: "T", age: "Y_LT1", unit: "YR" }),
    ],
    featured: true,
  },
  {
    slug: "fecondite",
    delta: "abs",
    deltaWord: "enfant",
    theme: "population",
    title: "Indice de fécondité",
    question: "Combien d'enfants par femme ?",
    unit: "enfants par femme",
    unitShort: "",
    decimals: 2,
    chart: "line",
    keywords: ["fécondité", "natalité", "enfants par femme"],
    definition:
      "Indicateur conjoncturel de fécondité : nombre moyen d'enfants qu'aurait une femme au cours de sa vie si elle connaissait les taux de fécondité par âge observés l'année considérée. Le seuil de remplacement des générations est d'environ 2,1.",
    series: [s(BE, "demo_find", { indic_de: "TOTFERRT" }), s(EU, "demo_find", { indic_de: "TOTFERRT" })],
    reference: { value: 2.1, label: "Seuil de remplacement" },
  },
  {
    slug: "age-median",
    pointInTime: true,
    delta: "abs",
    deltaWord: "an",
    theme: "population",
    title: "Âge médian",
    question: "La population vieillit-elle ?",
    unit: "ans",
    unitShort: "ans",
    decimals: 1,
    chart: "line",
    keywords: ["âge médian", "vieillissement", "structure par âge"],
    definition:
      "Âge qui partage la population en deux groupes d'effectifs égaux : la moitié est plus jeune, l'autre moitié plus âgée.",
    series: [s(BE, "demo_pjanind", { indic_de: "MEDAGEPOP" }), s(EU, "demo_pjanind", { indic_de: "MEDAGEPOP" })],
  },
  {
    slug: "part-65-ans-et-plus",
    pointInTime: true,
    theme: "population",
    title: "Part des 65 ans et plus",
    question: "Quelle part de la population a 65 ans ou plus ?",
    unit: "% de la population",
    unitShort: "%",
    decimals: 1,
    chart: "line",
    keywords: ["seniors", "vieillissement", "65 ans", "pensions"],
    definition: "Proportion de personnes âgées de 65 ans ou plus dans la population totale au 1er janvier.",
    series: [s(BE, "demo_pjanind", { indic_de: "PC_Y65_MAX" }), s(EU, "demo_pjanind", { indic_de: "PC_Y65_MAX" })],
  },

  // ───────────── Économie & emploi ─────────────
  {
    slug: "pib",
    theme: "economie",
    title: "Produit intérieur brut",
    question: "Quelle est la taille de l'économie belge ?",
    unit: "millions d'euros",
    unitShort: "M€",
    decimals: 0,
    chart: "line",
    keywords: ["PIB", "économie", "richesse", "croissance"],
    definition:
      "Valeur de l'ensemble des biens et services finaux produits sur le territoire au cours de l'année, aux prix courants (non corrigée de l'inflation).",
    series: [s(BE, "nama_10_gdp", { na_item: "B1GQ", unit: "CP_MEUR" })],
    featured: true,
  },
  {
    slug: "croissance-economique",
    theme: "economie",
    title: "Croissance du PIB en volume",
    question: "L'économie belge croît-elle ?",
    unit: "% par rapport à l'année précédente",
    unitShort: "%",
    decimals: 1,
    chart: "bar",
    keywords: ["croissance", "PIB réel", "récession", "conjoncture"],
    definition:
      "Variation annuelle du PIB en volume (aux prix de l'année précédente, en volumes chaînés), c'est-à-dire hors effet de l'inflation.",
    series: [
      s(BE, "nama_10_gdp", { na_item: "B1GQ", unit: "CLV_PCH_PRE" }),
      s(EU, "nama_10_gdp", { na_item: "B1GQ", unit: "CLV_PCH_PRE" }),
    ],
    signed: true,
  },
  {
    slug: "pib-par-habitant",
    theme: "economie",
    title: "PIB par habitant",
    question: "Quelle richesse produite par habitant ?",
    unit: "euros par habitant",
    unitShort: "€",
    decimals: 0,
    chart: "line",
    keywords: ["PIB par habitant", "niveau de vie", "richesse"],
    definition: "PIB aux prix courants divisé par la population moyenne de l'année.",
    series: [s(BE, "nama_10_pc", { na_item: "B1GQ", unit: "CP_EUR_HAB" })],
  },
  {
    slug: "pib-par-habitant-sp-a",
    delta: "abs",
    deltaWord: "point",
    theme: "economie",
    title: "PIB par habitant en standards de pouvoir d'achat",
    question: "La Belgique est-elle plus riche que la moyenne européenne ?",
    unit: "indice, UE27 = 100",
    unitShort: "",
    decimals: 0,
    chart: "line",
    keywords: ["SPA", "pouvoir d'achat", "comparaison européenne", "convergence"],
    definition:
      "PIB par habitant exprimé en standards de pouvoir d'achat (SPA), qui neutralisent les différences de niveaux de prix entre pays, rapporté à la moyenne de l'UE à 27 (= 100).",
    series: [s(BE, "prc_ppp_ind", { na_item: "VI_PPS_EU27_2020_HAB", ppp_cat: "GDP" })],
    reference: { value: 100, label: "Moyenne UE27" },
  },
  {
    slug: "inflation",
    theme: "economie",
    title: "Inflation (IPCH)",
    question: "À quelle vitesse les prix augmentent-ils ?",
    unit: "% de variation annuelle moyenne",
    unitShort: "%",
    decimals: 1,
    chart: "line",
    keywords: ["inflation", "prix", "IPCH", "pouvoir d'achat", "coût de la vie"],
    definition:
      "Variation de la moyenne annuelle de l'indice des prix à la consommation harmonisé (IPCH, tous postes), méthode commune à l'UE. Il diffère de l'indice national des prix utilisé pour l'indexation des salaires.",
    series: [
      s(BE, "prc_hicp_aind", { coicop: "CP00", unit: "RCH_A_AVG" }),
      s(EU, "prc_hicp_aind", { coicop: "CP00", unit: "RCH_A_AVG" }),
    ],
    signed: true,
    featured: true,
  },
  {
    slug: "taux-de-chomage",
    theme: "economie",
    title: "Taux de chômage",
    question: "Quelle part de la population active est au chômage ?",
    unit: "% de la population active",
    unitShort: "%",
    decimals: 1,
    chart: "line",
    keywords: ["chômage", "emploi", "marché du travail", "BIT"],
    definition:
      "Part des chômeurs (sans emploi, disponibles et cherchant activement un travail, selon la définition du BIT) dans la population active de 15 à 74 ans, mesurée par l'enquête sur les forces de travail.",
    series: [
      s(BE, "une_rt_a", { age: "Y15-74", sex: "T", unit: "PC_ACT" }),
      s(EU, "une_rt_a", { age: "Y15-74", sex: "T", unit: "PC_ACT" }),
    ],
    featured: true,
  },
  {
    slug: "chomage-par-region",
    theme: "economie",
    title: "Taux de chômage par région",
    question: "Le chômage est-il le même partout en Belgique ?",
    unit: "% de la population active",
    unitShort: "%",
    decimals: 1,
    chart: "line",
    keywords: ["chômage", "régions", "Bruxelles", "Flandre", "Wallonie"],
    definition: "Taux de chômage BIT des 15-74 ans dans chacune des trois régions.",
    series: regions("lfst_r_lfu3rt", { age: "Y15-74", sex: "T", isced11: "TOTAL", unit: "PC" }),
  },
  {
    slug: "chomage-des-jeunes",
    theme: "economie",
    title: "Chômage des jeunes",
    question: "Les jeunes trouvent-ils du travail ?",
    unit: "% de la population active de 15-24 ans",
    unitShort: "%",
    decimals: 1,
    chart: "line",
    keywords: ["jeunes", "chômage", "insertion professionnelle"],
    definition:
      "Taux de chômage BIT des 15-24 ans. Il est calculé sur les seuls jeunes actifs ; les étudiants qui ne cherchent pas d'emploi n'entrent pas dans le calcul.",
    series: [s(BE, "une_rt_a", { age: "Y15-24", sex: "T", unit: "PC_ACT" })],
  },
  {
    slug: "taux-d-emploi",
    theme: "economie",
    title: "Taux d'emploi des 20-64 ans",
    question: "Quelle part des adultes travaille ?",
    unit: "% de la population de 20-64 ans",
    unitShort: "%",
    decimals: 1,
    chart: "line",
    keywords: ["emploi", "taux d'emploi", "marché du travail", "objectif 2030"],
    definition:
      "Part des personnes de 20 à 64 ans ayant un emploi. L'UE vise 78 % en 2030 ; la Belgique s'est fixé un objectif de 80 %.",
    series: [
      s(BE, "lfsi_emp_a", { age: "Y20-64", sex: "T", indic_em: "EMP_LFS", unit: "PC_POP" }),
      s(EU, "lfsi_emp_a", { age: "Y20-64", sex: "T", indic_em: "EMP_LFS", unit: "PC_POP" }),
    ],
  },

  // ───────────── Société & vie quotidienne ─────────────
  {
    slug: "risque-de-pauvrete",
    theme: "societe",
    title: "Risque de pauvreté ou d'exclusion sociale",
    question: "Combien de personnes sont menacées de pauvreté ?",
    unit: "% de la population",
    unitShort: "%",
    decimals: 1,
    chart: "line",
    keywords: ["pauvreté", "exclusion sociale", "AROPE", "inégalités"],
    definition:
      "Indicateur AROPE (définition Europe 2030) : part des personnes en risque de pauvreté monétaire, ou en situation de privation matérielle et sociale sévère, ou vivant dans un ménage à très faible intensité de travail. Source : enquête EU-SILC.",
    series: [s(BE, "ilc_peps01n", { age: "TOTAL", sex: "T", unit: "PC" }), s(EU, "ilc_peps01n", { age: "TOTAL", sex: "T", unit: "PC" })],
    featured: true,
  },
  {
    slug: "revenu-median",
    theme: "societe",
    title: "Revenu disponible médian",
    question: "Quel est le revenu d'un ménage « typique » ?",
    unit: "euros par an (équivalent adulte)",
    unitShort: "€",
    decimals: 0,
    chart: "line",
    keywords: ["revenu", "niveau de vie", "salaire", "pouvoir d'achat"],
    definition:
      "Revenu net disponible annuel médian par équivalent adulte (échelle de l'OCDE modifiée). L'année indiquée est celle de l'enquête EU-SILC ; les revenus portent sur l'année précédente.",
    series: [s(BE, "ilc_di03", { age: "TOTAL", sex: "T", statinfo: "MED_EI", unit: "EUR" })],
  },
  {
    slug: "proprietaires",
    theme: "societe",
    title: "Part de propriétaires",
    question: "Les Belges sont-ils propriétaires de leur logement ?",
    unit: "% de la population",
    unitShort: "%",
    decimals: 1,
    chart: "line",
    keywords: ["logement", "propriétaires", "locataires", "immobilier"],
    definition:
      "Part de la population vivant dans un logement dont le ménage est propriétaire (avec ou sans emprunt hypothécaire).",
    series: [
      s(BE, "ilc_lvho02", { rskpovth: "TOTAL", hhcomp: "TOTAL", tenure: "OWN", unit: "PC" }),
      s(EU, "ilc_lvho02", { rskpovth: "TOTAL", hhcomp: "TOTAL", tenure: "OWN", unit: "PC" }),
    ],
  },
  {
    slug: "diplomes-du-superieur",
    theme: "societe",
    title: "Diplômés de l'enseignement supérieur (25-34 ans)",
    question: "Quelle part des jeunes adultes est diplômée du supérieur ?",
    unit: "% des 25-34 ans",
    unitShort: "%",
    decimals: 1,
    chart: "line",
    keywords: ["éducation", "diplôme", "enseignement supérieur", "université"],
    definition:
      "Part des 25-34 ans ayant atteint un niveau d'enseignement supérieur (CITE 5 à 8 : bachelier, master, doctorat ou équivalent). L'objectif européen pour 2030 est de 45 %.",
    series: [
      s(BE, "edat_lfse_03", { age: "Y25-34", sex: "T", isced11: "ED5-8", unit: "PC" }),
      s(EU, "edat_lfse_03", { age: "Y25-34", sex: "T", isced11: "ED5-8", unit: "PC" }),
    ],
    reference: { value: 45, label: "Objectif UE 2030" },
  },
  {
    slug: "energies-renouvelables",
    theme: "societe",
    title: "Part des énergies renouvelables",
    question: "Quelle part de l'énergie consommée est renouvelable ?",
    unit: "% de la consommation finale brute d'énergie",
    unitShort: "%",
    decimals: 1,
    chart: "line",
    keywords: ["énergie", "renouvelables", "climat", "transition énergétique"],
    definition:
      "Part des sources renouvelables (éolien, solaire, biomasse, hydraulique, pompes à chaleur…) dans la consommation finale brute d'énergie, selon la méthode de la directive européenne sur les énergies renouvelables.",
    series: [s(BE, "nrg_ind_ren", { nrg_bal: "REN", unit: "PC" }), s(EU, "nrg_ind_ren", { nrg_bal: "REN", unit: "PC" })],
  },
  {
    slug: "emissions-gaz-a-effet-de-serre",
    theme: "societe",
    title: "Émissions de gaz à effet de serre",
    question: "La Belgique réduit-elle ses émissions ?",
    unit: "millions de tonnes d'équivalent CO₂",
    unitShort: "Mt",
    decimals: 1,
    chart: "line",
    keywords: ["climat", "CO2", "gaz à effet de serre", "émissions"],
    definition:
      "Émissions totales de gaz à effet de serre (CO₂, CH₄, N₂O, gaz fluorés), hors utilisation des terres (UTCATF) et hors éléments pour mémoire (aviation et navigation internationales), d'après l'inventaire transmis à la CCNUCC.",
    series: [s(BE, "env_air_gge", { airpol: "GHG", src_crf: "TOTX4_MEMO", unit: "MIO_T" }, { since: 1990 })],
    growthSince: 1990,
    featured: true,
  },
  {
    slug: "voitures-par-habitant",
    theme: "societe",
    title: "Voitures pour 1 000 habitants",
    question: "Combien de voitures en circulation ?",
    unit: "voitures pour 1 000 habitants",
    unitShort: "",
    decimals: 0,
    chart: "line",
    keywords: ["mobilité", "voiture", "parc automobile", "transport"],
    definition: "Nombre de voitures particulières immatriculées pour 1 000 habitants au 31 décembre.",
    series: [s(BE, "road_eqs_carhab", { unit: "NR" })],
  },

  // ───────────── Politique & institutions ─────────────
  {
    slug: "dette-publique",
    theme: "institutions",
    title: "Dette publique",
    question: "Combien l'État belge doit-il ?",
    unit: "% du PIB",
    unitShort: "%",
    decimals: 1,
    chart: "line",
    keywords: ["dette publique", "finances publiques", "Maastricht", "budget"],
    definition:
      "Dette brute consolidée de l'ensemble des administrations publiques (fédéral, communautés, régions, pouvoirs locaux, sécurité sociale), au sens du traité de Maastricht, en pourcentage du PIB. Le seuil européen de référence est de 60 %.",
    series: [
      s(BE, "gov_10dd_edpt1", { na_item: "GD", sector: "S13", unit: "PC_GDP" }),
      s(EU, "gov_10dd_edpt1", { na_item: "GD", sector: "S13", unit: "PC_GDP" }),
    ],
    reference: { value: 60, label: "Critère de Maastricht" },
    featured: true,
  },
  {
    slug: "deficit-public",
    theme: "institutions",
    title: "Solde budgétaire",
    question: "L'État dépense-t-il plus qu'il ne perçoit ?",
    unit: "% du PIB",
    unitShort: "%",
    decimals: 1,
    chart: "bar",
    keywords: ["déficit", "budget", "solde public", "finances publiques"],
    definition:
      "Capacité (+) ou besoin (−) de financement de l'ensemble des administrations publiques, en pourcentage du PIB. Le seuil européen de référence pour le déficit est de 3 %.",
    series: [
      s(BE, "gov_10dd_edpt1", { na_item: "B9", sector: "S13", unit: "PC_GDP" }),
      s(EU, "gov_10dd_edpt1", { na_item: "B9", sector: "S13", unit: "PC_GDP" }),
    ],
    reference: { value: -3, label: "Seuil de −3 %" },
    signed: true,
  },
  {
    slug: "depenses-et-recettes-publiques",
    delta: "none",
    theme: "institutions",
    title: "Dépenses et recettes publiques",
    question: "Quel poids l'État a-t-il dans l'économie ?",
    unit: "% du PIB",
    unitShort: "%",
    decimals: 1,
    chart: "line",
    keywords: ["dépenses publiques", "recettes publiques", "impôts", "fiscalité"],
    definition:
      "Total des dépenses et des recettes de l'ensemble des administrations publiques, en pourcentage du PIB. L'écart entre les deux courbes correspond au solde budgétaire.",
    series: [
      s(BE, "gov_10a_main", { na_item: "TE", sector: "S13", unit: "PC_GDP" }, { label: "Dépenses", id: "depenses" }),
      s(BE, "gov_10a_main", { na_item: "TR", sector: "S13", unit: "PC_GDP" }, { label: "Recettes", id: "recettes" }),
    ],
  },
  {
    slug: "depenses-publiques-par-fonction",
    theme: "institutions",
    title: "Dépenses publiques par fonction",
    question: "À quoi sert l'argent public ?",
    unit: "% du PIB",
    unitShort: "%",
    decimals: 1,
    chart: "hbar",
    keywords: ["COFOG", "dépenses publiques", "protection sociale", "santé", "enseignement"],
    definition:
      "Dépenses de l'ensemble des administrations publiques ventilées selon la classification des fonctions des administrations publiques (COFOG), en pourcentage du PIB.",
    series: [
      ["GF10", "Protection sociale"],
      ["GF07", "Santé"],
      ["GF01", "Services généraux des administrations"],
      ["GF04", "Affaires économiques"],
      ["GF09", "Enseignement"],
      ["GF03", "Ordre et sécurité publics"],
      ["GF02", "Défense"],
      ["GF05", "Protection de l'environnement"],
      ["GF08", "Loisirs, culture et culte"],
      ["GF06", "Logement et équipements collectifs"],
    ].map(([code, label]) => ({
      ...s(BE, "gov_10a_exp", { cofog99: code, na_item: "TE", sector: "S13", unit: "PC_GDP" }, { label, id: code }),
    })),
  },
];

/** Clé stable d'une requête : dataset?param=valeur&… (paramètres triés). */
export function seriesKey(serie) {
  const q = Object.keys(serie.params)
    .sort()
    .map((k) => `${k}=${serie.params[k]}`)
    .join("&");
  return `${serie.dataset}?${q}`;
}

export function eurostatApiUrl(serie, lang = "fr") {
  const p = new URLSearchParams({ ...serie.params, sinceTimePeriod: String(serie.since ?? SINCE), format: "JSON", lang });
  return `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${serie.dataset}?${p}`;
}

export function eurostatBrowserUrl(dataset) {
  return `https://ec.europa.eu/eurostat/databrowser/view/${dataset}/default/table?lang=fr`;
}

export function allSeries() {
  const map = new Map();
  for (const ind of INDICATORS) for (const se of ind.series) map.set(seriesKey(se), se);
  return [...map.values()];
}
