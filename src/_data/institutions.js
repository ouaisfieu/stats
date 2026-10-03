// Données institutionnelles (statiques, vérifiées manuellement).
// Mettre à jour après chaque élection ou réforme ; indiquer la date de vérification.
export default {
  checked: "2026-10-03",
  structure: [
    { value: 1, label: "État fédéral", note: "Gouvernement et Parlement fédéraux (Chambre et Sénat)" },
    { value: 3, label: "Régions", note: "Région flamande, Région wallonne, Région de Bruxelles-Capitale" },
    { value: 3, label: "Communautés", note: "flamande, française (Fédération Wallonie-Bruxelles), germanophone" },
    { value: 3, label: "Langues officielles", note: "néerlandais, français, allemand" },
    { value: 10, label: "Provinces", note: "cinq en Flandre, cinq en Wallonie ; Bruxelles n'appartient à aucune province" },
    { value: 565, label: "Communes", note: "depuis le 1er janvier 2025 : 285 en Flandre, 261 en Wallonie, 19 à Bruxelles" },
  ],
  parliaments: [
    { name: "Chambre des représentants", seats: 150, level: "fédéral" },
    { name: "Sénat", seats: 60, level: "fédéral" },
    { name: "Parlement flamand", seats: 124, level: "Communauté et Région flamandes" },
    { name: "Parlement de Wallonie", seats: 75, level: "Région wallonne" },
    { name: "Parlement de la Région de Bruxelles-Capitale", seats: 89, level: "Région bruxelloise" },
    { name: "Parlement de la Fédération Wallonie-Bruxelles", seats: 94, level: "Communauté française" },
    { name: "Parlement de la Communauté germanophone", seats: 25, level: "Communauté germanophone" },
  ],
  election: {
    name: "Élections législatives fédérales",
    date: "2024-06-09",
    chamber: "Chambre des représentants",
    seats: 150,
    majority: 76,
    turnout: 88.45,
    // Ordre : sièges décroissants, puis voix
    results: [
      { party: "N-VA", group: "nl", votes: 16.71, seats: 24, gov: true },
      { party: "MR", group: "fr", votes: 10.26, seats: 20, gov: true },
      { party: "Vlaams Belang", group: "nl", votes: 13.77, seats: 20 },
      { party: "PS", group: "fr", votes: 8.04, seats: 16 },
      { party: "PVDA-PTB", group: "bi", votes: 9.86, seats: 15 },
      { party: "Les Engagés", group: "fr", votes: 6.77, seats: 14, gov: true },
      { party: "Vooruit", group: "nl", votes: 8.11, seats: 13, gov: true },
      { party: "CD&V", group: "nl", votes: 7.98, seats: 11, gov: true },
      { party: "Open VLD", group: "nl", votes: 5.45, seats: 7 },
      { party: "Groen", group: "nl", votes: 4.65, seats: 6 },
      { party: "Ecolo", group: "fr", votes: 2.93, seats: 3 },
      { party: "DéFI", group: "fr", votes: 1.2, seats: 1 },
    ],
  },
  government: {
    name: "Gouvernement De Wever",
    since: "2025-02-03",
    pm: "Bart De Wever",
    coalition: ["N-VA", "MR", "Les Engagés", "Vooruit", "CD&V"],
    nickname: "coalition « Arizona »",
  },
  sources: [
    { name: "SPF Intérieur — résultats officiels des élections du 9 juin 2024 (Chambre)", url: "https://resultatselection.belgium.be/fr/election-results/chambre-des-repr%C3%A9sentants/2024/royaume/251712" },
    { name: "Chambre des représentants — fiche « Résultats des élections fédérales du 9 juin 2024 »", url: "https://www.lachambre.be/pdf_sections/pri/fiche/fr_09_02.pdf" },
    { name: "Wikipédia — Commune (Belgique)", url: "https://fr.wikipedia.org/wiki/Commune_(Belgique)" },
    { name: "Wikipédia — Gouvernement De Wever", url: "https://en.wikipedia.org/wiki/De_Wever_government" },
  ],
};
