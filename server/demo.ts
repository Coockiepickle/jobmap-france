/**
 * Offline dataset used when FT_CLIENT_ID / FT_CLIENT_SECRET are absent.
 *
 * It emits objects in the exact `RawOffer` shape returned by
 * /partenaire/offresdemploi/v2/offres/search, so the normalization,
 * filtering and clustering code paths are identical to production.
 * Generation is deterministic (seeded PRNG) so reloads are stable.
 */

import type { RawOffer, SearchCriteria } from "./francetravail.js";
import { DEPARTMENTS, departmentsOfRegion } from "./geo.js";

interface City {
  name: string;
  dep: string;
  postal: string;
  lat: number;
  lon: number;
  /** relative weight — bigger metro areas get more offers */
  weight: number;
}

const CITIES: City[] = [
  { name: "PARIS 08", dep: "75", postal: "75008", lat: 48.8721, lon: 2.3128, weight: 12 },
  { name: "PARIS 12", dep: "75", postal: "75012", lat: 48.8402, lon: 2.3874, weight: 8 },
  { name: "PARIS 15", dep: "75", postal: "75015", lat: 48.8412, lon: 2.3, weight: 7 },
  { name: "BOULOGNE-BILLANCOURT", dep: "92", postal: "92100", lat: 48.8352, lon: 2.2409, weight: 6 },
  { name: "NANTERRE", dep: "92", postal: "92000", lat: 48.892, lon: 2.2069, weight: 5 },
  { name: "SAINT-DENIS", dep: "93", postal: "93200", lat: 48.9362, lon: 2.3574, weight: 5 },
  { name: "MONTREUIL", dep: "93", postal: "93100", lat: 48.8638, lon: 2.4485, weight: 3 },
  { name: "CRETEIL", dep: "94", postal: "94000", lat: 48.7904, lon: 2.4556, weight: 3 },
  { name: "VERSAILLES", dep: "78", postal: "78000", lat: 48.8014, lon: 2.1301, weight: 3 },
  { name: "EVRY-COURCOURONNES", dep: "91", postal: "91000", lat: 48.6238, lon: 2.4295, weight: 3 },
  { name: "CERGY", dep: "95", postal: "95000", lat: 49.0361, lon: 2.0631, weight: 3 },
  { name: "MEAUX", dep: "77", postal: "77100", lat: 48.9603, lon: 2.8783, weight: 2 },
  { name: "LYON 03", dep: "69", postal: "69003", lat: 45.7532, lon: 4.8574, weight: 8 },
  { name: "VILLEURBANNE", dep: "69", postal: "69100", lat: 45.7719, lon: 4.8902, weight: 4 },
  { name: "GRENOBLE", dep: "38", postal: "38000", lat: 45.1885, lon: 5.7245, weight: 5 },
  { name: "SAINT-ETIENNE", dep: "42", postal: "42000", lat: 45.4397, lon: 4.3872, weight: 3 },
  { name: "ANNECY", dep: "74", postal: "74000", lat: 45.8992, lon: 6.1294, weight: 3 },
  { name: "CHAMBERY", dep: "73", postal: "73000", lat: 45.5646, lon: 5.9178, weight: 2 },
  { name: "CLERMONT-FERRAND", dep: "63", postal: "63000", lat: 45.7772, lon: 3.087, weight: 3 },
  { name: "VALENCE", dep: "26", postal: "26000", lat: 44.9334, lon: 4.8924, weight: 2 },
  { name: "MARSEILLE 02", dep: "13", postal: "13002", lat: 43.3038, lon: 5.3663, weight: 7 },
  { name: "AIX-EN-PROVENCE", dep: "13", postal: "13100", lat: 43.5297, lon: 5.4474, weight: 4 },
  { name: "NICE", dep: "06", postal: "06000", lat: 43.7009, lon: 7.2683, weight: 5 },
  { name: "TOULON", dep: "83", postal: "83000", lat: 43.1242, lon: 5.928, weight: 3 },
  { name: "AVIGNON", dep: "84", postal: "84000", lat: 43.9493, lon: 4.8055, weight: 2 },
  { name: "TOULOUSE", dep: "31", postal: "31000", lat: 43.6045, lon: 1.444, weight: 7 },
  { name: "MONTPELLIER", dep: "34", postal: "34000", lat: 43.6109, lon: 3.8767, weight: 5 },
  { name: "NIMES", dep: "30", postal: "30000", lat: 43.8367, lon: 4.3601, weight: 3 },
  { name: "PERPIGNAN", dep: "66", postal: "66000", lat: 42.6986, lon: 2.8956, weight: 2 },
  { name: "BORDEAUX", dep: "33", postal: "33000", lat: 44.8378, lon: -0.5792, weight: 6 },
  { name: "PAU", dep: "64", postal: "64000", lat: 43.2951, lon: -0.3708, weight: 2 },
  { name: "LA ROCHELLE", dep: "17", postal: "17000", lat: 46.1603, lon: -1.1511, weight: 2 },
  { name: "LIMOGES", dep: "87", postal: "87000", lat: 45.8336, lon: 1.2611, weight: 2 },
  { name: "POITIERS", dep: "86", postal: "86000", lat: 46.5802, lon: 0.3404, weight: 2 },
  { name: "NANTES", dep: "44", postal: "44000", lat: 47.2184, lon: -1.5536, weight: 6 },
  { name: "ANGERS", dep: "49", postal: "49000", lat: 47.4784, lon: -0.5632, weight: 3 },
  { name: "LE MANS", dep: "72", postal: "72000", lat: 48.0061, lon: 0.1996, weight: 2 },
  { name: "LA ROCHE-SUR-YON", dep: "85", postal: "85000", lat: 46.6705, lon: -1.4269, weight: 2 },
  { name: "RENNES", dep: "35", postal: "35000", lat: 48.1173, lon: -1.6778, weight: 5 },
  { name: "BREST", dep: "29", postal: "29200", lat: 48.3904, lon: -4.4861, weight: 3 },
  { name: "LORIENT", dep: "56", postal: "56100", lat: 47.7482, lon: -3.3702, weight: 2 },
  { name: "SAINT-BRIEUC", dep: "22", postal: "22000", lat: 48.5144, lon: -2.7653, weight: 2 },
  { name: "LILLE", dep: "59", postal: "59000", lat: 50.6292, lon: 3.0573, weight: 6 },
  { name: "ROUBAIX", dep: "59", postal: "59100", lat: 50.6942, lon: 3.1746, weight: 3 },
  { name: "AMIENS", dep: "80", postal: "80000", lat: 49.8941, lon: 2.2958, weight: 3 },
  { name: "ARRAS", dep: "62", postal: "62000", lat: 50.291, lon: 2.7778, weight: 2 },
  { name: "BEAUVAIS", dep: "60", postal: "60000", lat: 49.4295, lon: 2.0807, weight: 2 },
  { name: "STRASBOURG", dep: "67", postal: "67000", lat: 48.5734, lon: 7.7521, weight: 5 },
  { name: "MULHOUSE", dep: "68", postal: "68100", lat: 47.7508, lon: 7.3359, weight: 3 },
  { name: "METZ", dep: "57", postal: "57000", lat: 49.1193, lon: 6.1757, weight: 3 },
  { name: "NANCY", dep: "54", postal: "54000", lat: 48.6921, lon: 6.1844, weight: 3 },
  { name: "REIMS", dep: "51", postal: "51100", lat: 49.2583, lon: 4.0317, weight: 3 },
  { name: "ROUEN", dep: "76", postal: "76000", lat: 49.4432, lon: 1.0999, weight: 4 },
  { name: "CAEN", dep: "14", postal: "14000", lat: 49.1829, lon: -0.3707, weight: 3 },
  { name: "LE HAVRE", dep: "76", postal: "76600", lat: 49.4944, lon: 0.1079, weight: 3 },
  { name: "DIJON", dep: "21", postal: "21000", lat: 47.322, lon: 5.0415, weight: 3 },
  { name: "BESANCON", dep: "25", postal: "25000", lat: 47.238, lon: 6.0243, weight: 3 },
  { name: "ORLEANS", dep: "45", postal: "45000", lat: 47.9029, lon: 1.9093, weight: 3 },
  { name: "TOURS", dep: "37", postal: "37000", lat: 47.3941, lon: 0.6848, weight: 3 },
  { name: "BOURGES", dep: "18", postal: "18000", lat: 47.081, lon: 2.3988, weight: 2 },
  { name: "AJACCIO", dep: "2A", postal: "20000", lat: 41.9192, lon: 8.7386, weight: 1 },
  { name: "BASTIA", dep: "2B", postal: "20200", lat: 42.7028, lon: 9.4509, weight: 1 },
  { name: "SAINT-DENIS", dep: "974", postal: "97400", lat: -20.8823, lon: 55.4504, weight: 2 },
  { name: "POINTE-A-PITRE", dep: "971", postal: "97110", lat: 16.2412, lon: -61.5335, weight: 1 },
  { name: "FORT-DE-FRANCE", dep: "972", postal: "97200", lat: 14.6161, lon: -61.0588, weight: 1 },
  { name: "CAYENNE", dep: "973", postal: "97300", lat: 4.9224, lon: -52.3135, weight: 1 },
];

interface Role {
  title: string;
  rome: string;
  romeLabel: string;
  salary: [number, number];
}

const ROLES: Role[] = [
  { title: "Administrateur systèmes et réseaux", rome: "M1801", romeLabel: "Administration de systèmes d'information", salary: [32, 48] },
  { title: "Ingénieur DevOps", rome: "M1805", romeLabel: "Études et développement informatique", salary: [42, 62] },
  { title: "Développeur Full Stack", rome: "M1805", romeLabel: "Études et développement informatique", salary: [36, 55] },
  { title: "Technicien support informatique", rome: "I1401", romeLabel: "Maintenance informatique et bureautique", salary: [24, 32] },
  { title: "Data analyst", rome: "M1403", romeLabel: "Études et prospectives socio-économiques", salary: [38, 52] },
  { title: "Chef de projet SI", rome: "M1806", romeLabel: "Conseil et maîtrise d'ouvrage en SI", salary: [45, 65] },
  { title: "Comptable général", rome: "M1203", romeLabel: "Comptabilité", salary: [30, 42] },
  { title: "Assistant(e) commercial(e)", rome: "D1401", romeLabel: "Assistanat commercial", salary: [24, 30] },
  { title: "Conducteur de ligne de production", rome: "H2701", romeLabel: "Pilotage d'installation énergétique", salary: [26, 34] },
  { title: "Technicien de maintenance industrielle", rome: "I1304", romeLabel: "Installation et maintenance d'équipements industriels", salary: [28, 38] },
  { title: "Infirmier(ère) diplômé(e) d'État", rome: "J1502", romeLabel: "Coordination de services médicaux", salary: [28, 36] },
  { title: "Aide-soignant(e)", rome: "J1501", romeLabel: "Soins d'hygiène, de confort du patient", salary: [22, 27] },
  { title: "Serveur / Serveuse de restaurant", rome: "G1803", romeLabel: "Service en restauration", salary: [21, 26] },
  { title: "Cuisinier(ère)", rome: "G1602", romeLabel: "Personnel de cuisine", salary: [23, 30] },
  { title: "Préparateur de commandes", rome: "N1103", romeLabel: "Magasinage et préparation de commandes", salary: [21, 25] },
  { title: "Chauffeur poids lourd", rome: "N4101", romeLabel: "Conduite de transport de marchandises", salary: [25, 32] },
  { title: "Électricien du bâtiment", rome: "F1602", romeLabel: "Électricité bâtiment", salary: [24, 34] },
  { title: "Maçon", rome: "F1703", romeLabel: "Maçonnerie", salary: [23, 32] },
  { title: "Conseiller clientèle bancaire", rome: "C1206", romeLabel: "Gestion de clientèle bancaire", salary: [30, 40] },
  { title: "Chargé(e) de recrutement", rome: "M1502", romeLabel: "Développement des ressources humaines", salary: [30, 40] },
];

const COMPANIES = [
  "GROUPE ALTIMA", "SOLUTIS SERVICES", "CENTRE HOSPITALIER RÉGIONAL", "TRANSPORTS DUBREUIL",
  "ELIA INDUSTRIES", "NOVATECH CONSEIL", "MAISON LEROY", "ATLAS LOGISTIQUE",
  "BÂTIRAMA CONSTRUCTION", "CAISSE RÉGIONALE MUTUELLE", "OPTIMA RETAIL", "SYNERGIE INTERIM",
  "LABEYRIE FINE FOODS", "TECHNIPLAST SAS", "GROUPE VERTUO", "AGENCE PROXIM'EMPLOI",
];

const CONTRACTS: { code: string; label: string; nature: string; weight: number; alternance?: boolean }[] = [
  { code: "CDI", label: "Contrat à durée indéterminée", nature: "E1", weight: 40 },
  { code: "CDD", label: "Contrat à durée déterminée", nature: "E1", weight: 25 },
  { code: "MIS", label: "Mission intérimaire", nature: "E1", weight: 18 },
  { code: "CDD", label: "Contrat d'apprentissage", nature: "E2", weight: 12, alternance: true },
  { code: "CDD", label: "Contrat de professionnalisation", nature: "FS", weight: 5, alternance: true },
];

/** Mulberry32 — small deterministic PRNG. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T extends { weight: number }>(items: T[], r: number): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let acc = r * total;
  for (const item of items) {
    acc -= item.weight;
    if (acc <= 0) return item;
  }
  return items[items.length - 1];
}

const DESCRIPTION = (role: Role, city: string, contract: string) =>
  `Dans le cadre de son développement, notre structure recrute un(e) ${role.title} sur le secteur de ${city}.

Vos missions principales :
- Prendre en charge les activités liées au poste dans le respect des procédures internes
- Assurer le suivi et le reporting de votre activité auprès de votre responsable
- Participer à l'amélioration continue des process de l'équipe
- Travailler en lien étroit avec les services support

Profil recherché :
- Formation ou expérience en lien direct avec le poste
- Autonomie, rigueur et sens du collectif
- La maîtrise des outils métiers est un plus

Conditions : ${contract}, prise de poste dès que possible. Mutuelle d'entreprise, titres restaurant et prise en charge partielle des frais de transport.

(Jeu de données de démonstration — aucune offre réelle.)`;

/** Build the demo corpus in `RawOffer` format. */
export function buildDemoOffers(count = 900): RawOffer[] {
  const rand = rng(20260727);
  const offers: RawOffer[] = [];
  const weightedCities = CITIES.flatMap((c) => Array(c.weight).fill(c) as City[]);

  for (let i = 0; i < count; i++) {
    const city = weightedCities[Math.floor(rand() * weightedCities.length)];
    const role = ROLES[Math.floor(rand() * ROLES.length)];
    const contract = pickWeighted(CONTRACTS, rand());
    const company = COMPANIES[Math.floor(rand() * COMPANIES.length)];

    const spread = 0.075;
    const lat = city.lat + (rand() - 0.5) * spread;
    const lon = city.lon + (rand() - 0.5) * spread * 1.4;

    const daysAgo = Math.floor(rand() * 30);
    const created = new Date(Date.now() - daysAgo * 86400000 - Math.floor(rand() * 86400000));

    const low = role.salary[0] + Math.round(rand() * 3);
    const high = Math.max(low + 2, role.salary[1] - Math.round(rand() * 4));
    const title = contract.alternance ? `${role.title} (${contract.label})` : role.title;

    offers.push({
      id: `DEMO${String(i).padStart(4, "0")}`,
      intitule: title,
      description: DESCRIPTION(role, city.name, contract.label),
      dateCreation: created.toISOString(),
      dateActualisation: created.toISOString(),
      lieuTravail: {
        libelle: `${city.dep} - ${city.name}`,
        latitude: Number(lat.toFixed(5)),
        longitude: Number(lon.toFixed(5)),
        codePostal: city.postal,
        commune: city.name,
      },
      romeCode: role.rome,
      romeLibelle: role.romeLabel,
      appellationlibelle: role.title,
      entreprise: { nom: rand() > 0.12 ? company : undefined },
      typeContrat: contract.code,
      typeContratLibelle: contract.label,
      natureContrat: contract.nature,
      alternance: Boolean(contract.alternance),
      experienceLibelle: ["Débutant accepté", "1 an d'expérience exigé", "3 ans d'expérience souhaités"][
        Math.floor(rand() * 3)
      ],
      salaire: {
        libelle: contract.alternance
          ? "Selon la grille légale de l'alternance"
          : `Annuel de ${low}000,00 € à ${high}000,00 €`,
      },
      dureeTravailLibelle: rand() > 0.25 ? "35H Travail en journée" : "Temps partiel - 24H",
      nombrePostes: 1 + Math.floor(rand() * 3),
      origineOffre: {
        origine: rand() > 0.75 ? "2" : "1",
        urlOrigine: "https://candidat.francetravail.fr/offres/emploi",
      },
    });
  }

  return offers;
}

let cache: RawOffer[] | null = null;

/** Apply the same criteria the live API would, against the demo corpus. */
export function searchDemoOffers(criteria: SearchCriteria): { offers: RawOffer[]; total: number } {
  cache = cache ?? buildDemoOffers();
  let list = cache;

  const deps = new Set<string>(criteria.departments ?? []);
  for (const region of criteria.regions ?? []) {
    for (const d of departmentsOfRegion(region)) deps.add(d);
  }
  if (deps.size) {
    list = list.filter((o) => {
      const dep = o.lieuTravail?.libelle?.split(" - ")[0]?.trim();
      return dep ? deps.has(dep) : false;
    });
  }

  if (criteria.alternance) {
    list = list.filter((o) => o.alternance);
  } else if (criteria.typeContrat?.length) {
    const codes = new Set(criteria.typeContrat);
    list = list.filter((o) => !o.alternance && codes.has(o.typeContrat ?? ""));
  }

  if (criteria.keywords) {
    // Accent-insensitive match so "developpeur" also finds "Développeur"
    // (the live France Travail API normalises keywords server-side).
    const fold = (v: string) =>
      v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const needles = fold(criteria.keywords).split(/\s+/).filter(Boolean);
    list = list.filter((o) => {
      const haystack = fold(
        [o.intitule, o.romeLibelle, o.entreprise?.nom, o.description]
          .filter(Boolean)
          .join(" "),
      );
      return needles.every((n) => haystack.includes(n));
    });
  }

  if (criteria.publishedWithinDays) {
    const cutoff = Date.now() - criteria.publishedWithinDays * 86400000;
    list = list.filter((o) => new Date(o.dateCreation ?? 0).getTime() >= cutoff);
  }

  const total = list.length;
  return { offers: list.slice(0, criteria.limit ?? 300), total };
}

export const DEMO_DEPARTMENT_CODES = Array.from(new Set(CITIES.map((c) => c.dep))).filter((c) =>
  DEPARTMENTS.some((d) => d.code === c),
);
