/**
 * Department reference data: name, region code, and prefecture coordinates.
 *
 * Two uses:
 *  1. populate the department / region pickers in the UI,
 *  2. provide a fallback coordinate when an offer has no lat/lon
 *     (roughly 5-10% of France Travail offers ship without geolocation).
 */

export interface DepartmentInfo {
  code: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
}

export const REGIONS: { code: string; name: string }[] = [
  { code: "84", name: "Auvergne-Rhône-Alpes" },
  { code: "27", name: "Bourgogne-Franche-Comté" },
  { code: "53", name: "Bretagne" },
  { code: "24", name: "Centre-Val de Loire" },
  { code: "94", name: "Corse" },
  { code: "44", name: "Grand Est" },
  { code: "32", name: "Hauts-de-France" },
  { code: "11", name: "Île-de-France" },
  { code: "28", name: "Normandie" },
  { code: "75", name: "Nouvelle-Aquitaine" },
  { code: "76", name: "Occitanie" },
  { code: "52", name: "Pays de la Loire" },
  { code: "93", name: "Provence-Alpes-Côte d'Azur" },
  { code: "01", name: "Guadeloupe" },
  { code: "02", name: "Martinique" },
  { code: "03", name: "Guyane" },
  { code: "04", name: "La Réunion" },
  { code: "06", name: "Mayotte" },
];

export const DEPARTMENTS: DepartmentInfo[] = [
  { code: "01", name: "Ain", region: "84", lat: 46.2, lon: 5.23 },
  { code: "02", name: "Aisne", region: "32", lat: 49.57, lon: 3.62 },
  { code: "03", name: "Allier", region: "84", lat: 46.34, lon: 3.33 },
  { code: "04", name: "Alpes-de-Haute-Provence", region: "93", lat: 44.09, lon: 6.24 },
  { code: "05", name: "Hautes-Alpes", region: "93", lat: 44.56, lon: 6.08 },
  { code: "06", name: "Alpes-Maritimes", region: "93", lat: 43.7, lon: 7.26 },
  { code: "07", name: "Ardèche", region: "84", lat: 44.74, lon: 4.6 },
  { code: "08", name: "Ardennes", region: "44", lat: 49.77, lon: 4.72 },
  { code: "09", name: "Ariège", region: "76", lat: 42.96, lon: 1.61 },
  { code: "10", name: "Aube", region: "44", lat: 48.3, lon: 4.08 },
  { code: "11", name: "Aude", region: "76", lat: 43.21, lon: 2.35 },
  { code: "12", name: "Aveyron", region: "76", lat: 44.35, lon: 2.58 },
  { code: "13", name: "Bouches-du-Rhône", region: "93", lat: 43.3, lon: 5.37 },
  { code: "14", name: "Calvados", region: "28", lat: 49.18, lon: -0.37 },
  { code: "15", name: "Cantal", region: "84", lat: 44.93, lon: 2.44 },
  { code: "16", name: "Charente", region: "75", lat: 45.65, lon: 0.16 },
  { code: "17", name: "Charente-Maritime", region: "75", lat: 46.16, lon: -1.15 },
  { code: "18", name: "Cher", region: "24", lat: 47.08, lon: 2.4 },
  { code: "19", name: "Corrèze", region: "75", lat: 45.16, lon: 1.53 },
  { code: "2A", name: "Corse-du-Sud", region: "94", lat: 41.93, lon: 8.74 },
  { code: "2B", name: "Haute-Corse", region: "94", lat: 42.7, lon: 9.45 },
  { code: "21", name: "Côte-d'Or", region: "27", lat: 47.32, lon: 5.04 },
  { code: "22", name: "Côtes-d'Armor", region: "53", lat: 48.51, lon: -2.77 },
  { code: "23", name: "Creuse", region: "75", lat: 46.17, lon: 1.87 },
  { code: "24", name: "Dordogne", region: "75", lat: 45.18, lon: 0.72 },
  { code: "25", name: "Doubs", region: "27", lat: 47.24, lon: 6.02 },
  { code: "26", name: "Drôme", region: "84", lat: 44.93, lon: 4.89 },
  { code: "27", name: "Eure", region: "28", lat: 49.02, lon: 1.15 },
  { code: "28", name: "Eure-et-Loir", region: "24", lat: 48.44, lon: 1.49 },
  { code: "29", name: "Finistère", region: "53", lat: 48.39, lon: -4.49 },
  { code: "30", name: "Gard", region: "76", lat: 43.84, lon: 4.36 },
  { code: "31", name: "Haute-Garonne", region: "76", lat: 43.6, lon: 1.44 },
  { code: "32", name: "Gers", region: "76", lat: 43.65, lon: 0.59 },
  { code: "33", name: "Gironde", region: "75", lat: 44.84, lon: -0.58 },
  { code: "34", name: "Hérault", region: "76", lat: 43.61, lon: 3.88 },
  { code: "35", name: "Ille-et-Vilaine", region: "53", lat: 48.11, lon: -1.68 },
  { code: "36", name: "Indre", region: "24", lat: 46.81, lon: 1.69 },
  { code: "37", name: "Indre-et-Loire", region: "24", lat: 47.39, lon: 0.69 },
  { code: "38", name: "Isère", region: "84", lat: 45.19, lon: 5.72 },
  { code: "39", name: "Jura", region: "27", lat: 46.67, lon: 5.55 },
  { code: "40", name: "Landes", region: "75", lat: 43.89, lon: -0.5 },
  { code: "41", name: "Loir-et-Cher", region: "24", lat: 47.59, lon: 1.33 },
  { code: "42", name: "Loire", region: "84", lat: 45.44, lon: 4.39 },
  { code: "43", name: "Haute-Loire", region: "84", lat: 45.04, lon: 3.88 },
  { code: "44", name: "Loire-Atlantique", region: "52", lat: 47.22, lon: -1.55 },
  { code: "45", name: "Loiret", region: "24", lat: 47.9, lon: 1.9 },
  { code: "46", name: "Lot", region: "76", lat: 44.45, lon: 1.44 },
  { code: "47", name: "Lot-et-Garonne", region: "75", lat: 44.2, lon: 0.62 },
  { code: "48", name: "Lozère", region: "76", lat: 44.52, lon: 3.5 },
  { code: "49", name: "Maine-et-Loire", region: "52", lat: 47.47, lon: -0.55 },
  { code: "50", name: "Manche", region: "28", lat: 49.11, lon: -1.09 },
  { code: "51", name: "Marne", region: "44", lat: 49.25, lon: 4.03 },
  { code: "52", name: "Haute-Marne", region: "44", lat: 48.11, lon: 5.14 },
  { code: "53", name: "Mayenne", region: "52", lat: 48.07, lon: -0.77 },
  { code: "54", name: "Meurthe-et-Moselle", region: "44", lat: 48.69, lon: 6.18 },
  { code: "55", name: "Meuse", region: "44", lat: 48.77, lon: 5.17 },
  { code: "56", name: "Morbihan", region: "53", lat: 47.66, lon: -2.76 },
  { code: "57", name: "Moselle", region: "44", lat: 49.12, lon: 6.18 },
  { code: "58", name: "Nièvre", region: "27", lat: 46.99, lon: 3.16 },
  { code: "59", name: "Nord", region: "32", lat: 50.63, lon: 3.06 },
  { code: "60", name: "Oise", region: "32", lat: 49.42, lon: 2.83 },
  { code: "61", name: "Orne", region: "28", lat: 48.43, lon: 0.09 },
  { code: "62", name: "Pas-de-Calais", region: "32", lat: 50.43, lon: 2.83 },
  { code: "63", name: "Puy-de-Dôme", region: "84", lat: 45.78, lon: 3.09 },
  { code: "64", name: "Pyrénées-Atlantiques", region: "75", lat: 43.3, lon: -0.37 },
  { code: "65", name: "Hautes-Pyrénées", region: "76", lat: 43.23, lon: 0.07 },
  { code: "66", name: "Pyrénées-Orientales", region: "76", lat: 42.7, lon: 2.9 },
  { code: "67", name: "Bas-Rhin", region: "44", lat: 48.58, lon: 7.75 },
  { code: "68", name: "Haut-Rhin", region: "44", lat: 47.75, lon: 7.34 },
  { code: "69", name: "Rhône", region: "84", lat: 45.76, lon: 4.84 },
  { code: "70", name: "Haute-Saône", region: "27", lat: 47.62, lon: 6.15 },
  { code: "71", name: "Saône-et-Loire", region: "27", lat: 46.78, lon: 4.85 },
  { code: "72", name: "Sarthe", region: "52", lat: 48.0, lon: 0.2 },
  { code: "73", name: "Savoie", region: "84", lat: 45.57, lon: 5.92 },
  { code: "74", name: "Haute-Savoie", region: "84", lat: 45.9, lon: 6.13 },
  { code: "75", name: "Paris", region: "11", lat: 48.8566, lon: 2.3522 },
  { code: "76", name: "Seine-Maritime", region: "28", lat: 49.44, lon: 1.1 },
  { code: "77", name: "Seine-et-Marne", region: "11", lat: 48.54, lon: 2.66 },
  { code: "78", name: "Yvelines", region: "11", lat: 48.8, lon: 2.13 },
  { code: "79", name: "Deux-Sèvres", region: "75", lat: 46.32, lon: -0.46 },
  { code: "80", name: "Somme", region: "32", lat: 49.89, lon: 2.3 },
  { code: "81", name: "Tarn", region: "76", lat: 43.93, lon: 2.15 },
  { code: "82", name: "Tarn-et-Garonne", region: "76", lat: 44.02, lon: 1.35 },
  { code: "83", name: "Var", region: "93", lat: 43.12, lon: 5.93 },
  { code: "84", name: "Vaucluse", region: "93", lat: 43.95, lon: 4.81 },
  { code: "85", name: "Vendée", region: "52", lat: 46.67, lon: -1.43 },
  { code: "86", name: "Vienne", region: "75", lat: 46.58, lon: 0.34 },
  { code: "87", name: "Haute-Vienne", region: "75", lat: 45.83, lon: 1.26 },
  { code: "88", name: "Vosges", region: "44", lat: 48.17, lon: 6.45 },
  { code: "89", name: "Yonne", region: "27", lat: 47.8, lon: 3.57 },
  { code: "90", name: "Territoire de Belfort", region: "27", lat: 47.64, lon: 6.86 },
  { code: "91", name: "Essonne", region: "11", lat: 48.63, lon: 2.44 },
  { code: "92", name: "Hauts-de-Seine", region: "11", lat: 48.89, lon: 2.24 },
  { code: "93", name: "Seine-Saint-Denis", region: "11", lat: 48.91, lon: 2.44 },
  { code: "94", name: "Val-de-Marne", region: "11", lat: 48.79, lon: 2.46 },
  { code: "95", name: "Val-d'Oise", region: "11", lat: 49.05, lon: 2.1 },
  { code: "971", name: "Guadeloupe", region: "01", lat: 16.24, lon: -61.53 },
  { code: "972", name: "Martinique", region: "02", lat: 14.6, lon: -61.07 },
  { code: "973", name: "Guyane", region: "03", lat: 4.94, lon: -52.33 },
  { code: "974", name: "La Réunion", region: "04", lat: -20.88, lon: 55.45 },
  { code: "976", name: "Mayotte", region: "06", lat: -12.78, lon: 45.23 },
];

const byCode = new Map(DEPARTMENTS.map((d) => [d.code, d]));

export function getDepartment(code: string | null | undefined): DepartmentInfo | undefined {
  if (!code) return undefined;
  return byCode.get(code.toUpperCase());
}

export function departmentsOfRegion(regionCode: string): string[] {
  return DEPARTMENTS.filter((d) => d.region === regionCode).map((d) => d.code);
}

/**
 * Derive the department code from a France Travail location label
 * ("69 - LYON 03", "974 - SAINT DENIS") or from a postal code.
 */
export function departmentFromLabel(label?: string | null, postalCode?: string | null): string | null {
  if (label) {
    const m = label.match(/^\s*(9[7]\d|2[AB]|\d{2})\s*-/i);
    if (m) return m[1].toUpperCase();
  }
  if (postalCode) {
    if (/^9[78]\d/.test(postalCode)) return postalCode.slice(0, 3);
    const two = postalCode.slice(0, 2);
    if (two === "20") return "2A"; // Corsica postal codes do not map 1:1
    if (byCode.has(two)) return two;
  }
  return null;
}
