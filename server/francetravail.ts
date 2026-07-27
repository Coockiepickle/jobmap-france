/**
 * France Travail "Offres d'emploi v2" integration.
 *
 * Docs: https://francetravail.io/data/api/offres-emploi
 *   Token endpoint : POST https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire
 *   Scopes         : "api_offresdemploiv2 o2dsoffre"
 *   Search endpoint: GET  https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search
 *
 * Setup: create an app on francetravail.io, subscribe to "Offres d'emploi v2",
 * then export FT_CLIENT_ID / FT_CLIENT_SECRET (see .env.example).
 *
 * API constraints handled here:
 *  - client_credentials token, ~25 min lifetime -> cached in-process
 *  - `range` window is 150 offers max per call, first index <= 1000 (so 1150 max per query)
 *  - rate limit is a few calls/second -> requests are serialized with a small delay
 *  - `typeContrat` accepts a comma separated list (CDI, CDD, MIS, SAI, ...)
 *  - alternance is NOT a typeContrat: it is the `alternance=true` flag
 *    (natureContrat E2 = apprentissage, FS/E1 = professionnalisation),
 *    so each contract group is fetched as its own query and merged.
 */

import type { ContractGroup, Job } from "@shared/types";
import { departmentFromLabel, getDepartment } from "./geo.js";

const TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const SEARCH_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";
export const SCOPE = "api_offresdemploiv2 o2dsoffre";

const PAGE_SIZE = 150; // hard API maximum per call
const MAX_FIRST_INDEX = 1000; // hard API maximum for the range start

export function hasCredentials(): boolean {
  return Boolean(process.env.FT_CLIENT_ID && process.env.FT_CLIENT_SECRET);
}

/* ------------------------------------------------------------------ */
/* OAuth2 client credentials                                           */
/* ------------------------------------------------------------------ */

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.FT_CLIENT_ID ?? "",
    client_secret: process.env.FT_CLIENT_SECRET ?? "",
    scope: SCOPE,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`France Travail token request failed (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 1500) * 1000,
  };
  return cachedToken.value;
}

/* ------------------------------------------------------------------ */
/* Raw search                                                          */
/* ------------------------------------------------------------------ */

export interface RawOffer {
  id: string;
  intitule?: string;
  description?: string;
  dateCreation?: string;
  dateActualisation?: string;
  lieuTravail?: {
    libelle?: string;
    latitude?: number | string;
    longitude?: number | string;
    codePostal?: string;
    commune?: string;
  };
  romeCode?: string;
  romeLibelle?: string;
  appellationlibelle?: string;
  entreprise?: { nom?: string; logo?: string; url?: string };
  typeContrat?: string;
  typeContratLibelle?: string;
  natureContrat?: string;
  experienceLibelle?: string;
  salaire?: { libelle?: string; commentaire?: string };
  dureeTravailLibelle?: string;
  alternance?: boolean;
  nombrePostes?: number;
  origineOffre?: { origine?: string; urlOrigine?: string };
}

export interface SearchCriteria {
  /** INSEE department codes, e.g. ["69", "38"] */
  departments?: string[];
  /** INSEE region codes, e.g. ["11"] — the API accepts a single region per call */
  regions?: string[];
  /** France Travail contract codes, e.g. ["CDI", "CDD", "MIS"] */
  typeContrat?: string[];
  /** true -> only apprenticeship / professionalisation contracts */
  alternance?: boolean;
  keywords?: string | null;
  /** 1, 3, 7, 14 or 31 */
  publishedWithinDays?: number | null;
  /** how many offers to pull for this criteria set (capped at 1150 by the API) */
  limit?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One `/offres/search` call. Returns the page of offers plus the total available. */
async function searchPage(
  criteria: SearchCriteria,
  from: number,
  size: number,
): Promise<{ offers: RawOffer[]; total: number }> {
  const token = await getAccessToken();
  const params = new URLSearchParams();

  if (criteria.departments?.length) params.set("departement", criteria.departments.join(","));
  if (criteria.regions?.length) params.set("region", criteria.regions.join(","));
  if (criteria.typeContrat?.length) params.set("typeContrat", criteria.typeContrat.join(","));
  if (criteria.alternance) params.set("alternance", "true");
  if (criteria.keywords) params.set("motsCles", criteria.keywords);
  if (criteria.publishedWithinDays) params.set("publieeDepuis", String(criteria.publishedWithinDays));
  params.set("sort", "1"); // 1 = sort by date, most recent first
  params.set("range", `${from}-${from + size - 1}`);

  const res = await fetch(`${SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  // 204 = valid query, zero results.
  if (res.status === 204) return { offers: [], total: 0 };
  if (!res.ok) {
    throw new Error(`France Travail search failed (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as { resultats?: RawOffer[] };
  // Content-Range looks like "offres 0-149/2534"
  const contentRange = res.headers.get("Content-Range") ?? "";
  const total = Number(contentRange.split("/")[1]) || json.resultats?.length || 0;

  return { offers: json.resultats ?? [], total };
}

/** Paginated search across the 150-offer windows, respecting the API rate limit. */
export async function searchOffers(
  criteria: SearchCriteria,
): Promise<{ offers: RawOffer[]; total: number }> {
  const limit = Math.min(criteria.limit ?? 300, MAX_FIRST_INDEX + PAGE_SIZE);
  const collected: RawOffer[] = [];
  let total = 0;
  let from = 0;

  while (collected.length < limit && from <= MAX_FIRST_INDEX) {
    const size = Math.min(PAGE_SIZE, limit - collected.length);
    const page = await searchPage(criteria, from, size);
    total = page.total || total;
    collected.push(...page.offers);

    if (page.offers.length < size || collected.length >= total) break;
    from += size;
    await sleep(120); // stay under the documented rate limit
  }

  return { offers: collected.slice(0, limit), total: total || collected.length };
}

/* ------------------------------------------------------------------ */
/* Normalization                                                       */
/* ------------------------------------------------------------------ */

/** Contract codes the API exposes, grouped into the four UI buckets. */
export const CONTRACT_CODES: Record<Exclude<ContractGroup, "alternance" | "autre">, string[]> = {
  CDI: ["CDI"],
  CDD: ["CDD", "DDI", "CCE"],
  interim: ["MIS", "TTI"],
};

export function contractGroupOf(offer: {
  typeContrat?: string | null;
  natureContrat?: string | null;
  alternance?: boolean;
}): ContractGroup {
  // Referential `naturesContrats`: E1 = contrat de travail classique,
  // E2 = contrat d'apprentissage, FS = contrat de professionnalisation.
  const nature = (offer.natureContrat ?? "").toUpperCase();
  const isAlternance =
    offer.alternance === true ||
    nature.startsWith("E2") ||
    nature.startsWith("FS") ||
    /alternance|apprentissage|professionnalisation/i.test(offer.natureContrat ?? "");
  if (isAlternance) return "alternance";

  const code = (offer.typeContrat ?? "").toUpperCase();
  if (CONTRACT_CODES.CDI.includes(code)) return "CDI";
  if (CONTRACT_CODES.CDD.includes(code)) return "CDD";
  if (CONTRACT_CODES.interim.includes(code)) return "interim";
  return "autre";
}

/** Deterministic jitter so co-located offers do not stack on one pixel. */
function jitter(seed: string, amplitude = 0.045): [number, number] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const a = ((h >>> 0) % 1000) / 1000;
  const b = ((h >>> 10) % 1000) / 1000;
  return [(a - 0.5) * amplitude * 2, (b - 0.5) * amplitude * 2];
}

/** Raw offer -> `Job`, or null when the offer cannot be placed on the map. */
export function normalizeOffer(offer: RawOffer): Job | null {
  const lieu = offer.lieuTravail ?? {};
  const label = lieu.libelle ?? "";
  const department = departmentFromLabel(label, lieu.codePostal);

  let lat = typeof lieu.latitude === "string" ? parseFloat(lieu.latitude) : lieu.latitude;
  let lon = typeof lieu.longitude === "string" ? parseFloat(lieu.longitude) : lieu.longitude;
  let approximate = false;

  if (!Number.isFinite(lat as number) || !Number.isFinite(lon as number)) {
    const dep = getDepartment(department);
    if (!dep) return null; // no coordinates and no department -> not mappable
    const [dLat, dLon] = jitter(offer.id);
    lat = dep.lat + dLat;
    lon = dep.lon + dLon;
    approximate = true;
  }

  const group = contractGroupOf(offer);

  return {
    id: offer.id,
    title: offer.intitule ?? offer.appellationlibelle ?? "Offre sans intitulé",
    company: offer.entreprise?.nom ?? null,
    locationLabel: label || (getDepartment(department)?.name ?? "France"),
    city: lieu.commune ?? null,
    postalCode: lieu.codePostal ?? null,
    department,
    lat: lat as number,
    lon: lon as number,
    approximateLocation: approximate,
    contractCode: offer.typeContrat ?? null,
    contractLabel: offer.typeContratLibelle ?? offer.typeContrat ?? null,
    contractGroup: group,
    isAlternance: group === "alternance",
    romeCode: offer.romeCode ?? null,
    romeLabel: offer.romeLibelle ?? null,
    experience: offer.experienceLibelle ?? null,
    workingTime: offer.dureeTravailLibelle ?? null,
    salary: offer.salaire?.libelle ?? offer.salaire?.commentaire ?? null,
    positions: offer.nombrePostes ?? null,
    description: offer.description ? offer.description.slice(0, 1800) : null,
    createdAt: offer.dateCreation ?? null,
    updatedAt: offer.dateActualisation ?? null,
    url:
      offer.origineOffre?.urlOrigine ??
      `https://candidat.francetravail.fr/offres/recherche/detail/${offer.id}`,
    source: offer.origineOffre?.origine === "2" ? "Partenaire" : "France Travail",
  };
}

/** Build the per-group criteria set for a UI filter selection. */
export function criteriaForGroup(group: ContractGroup, base: SearchCriteria): SearchCriteria {
  if (group === "alternance") return { ...base, alternance: true };
  if (group === "autre") return { ...base };
  return { ...base, typeContrat: CONTRACT_CODES[group] };
}
