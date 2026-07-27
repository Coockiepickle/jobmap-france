/**
 * Shared data model between the Express backend and the React client.
 * `Job` is the normalized shape rendered on the map — it is intentionally
 * flatter than the raw France Travail "Offres d'emploi v2" payload.
 */

export type ContractGroup = "alternance" | "CDI" | "CDD" | "interim" | "autre";

export interface Job {
  id: string;
  title: string;
  company: string | null;
  /** Human readable work location, e.g. "69 - LYON 03" */
  locationLabel: string;
  city: string | null;
  postalCode: string | null;
  /** INSEE department code, e.g. "69", "2A", "974" */
  department: string | null;
  lat: number;
  lon: number;
  /** true when coordinates come from a department fallback, not from the API */
  approximateLocation: boolean;
  /** Raw France Travail contract code: CDI, CDD, MIS, SAI, ... */
  contractCode: string | null;
  contractLabel: string | null;
  /** Bucket used by the map filters */
  contractGroup: ContractGroup;
  isAlternance: boolean;
  romeCode: string | null;
  romeLabel: string | null;
  experience: string | null;
  workingTime: string | null;
  salary: string | null;
  positions: number | null;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  url: string | null;
  source: string | null;
}

export interface JobsResponse {
  jobs: Job[];
  meta: {
    /** "france-travail" when the live API answered, "demo" for the offline dataset */
    mode: "france-travail" | "demo";
    total: number;
    plotted: number;
    /** Offers returned by the API that had no usable geolocation at all */
    dropped: number;
    /** Total available per contract group, as reported by each API call */
    availableByGroup: Record<string, number>;
    query: {
      departments: string[];
      regions: string[];
      contracts: ContractGroup[];
      keywords: string | null;
      publishedWithinDays: number | null;
      maxPerGroup: number;
    };
    warnings: string[];
    fetchedAt: string;
  };
}

export interface ApiStatus {
  /** true when FT_CLIENT_ID / FT_CLIENT_SECRET are present in the environment */
  credentialsConfigured: boolean;
  mode: "france-travail" | "demo";
  tokenScope: string;
}

export const CONTRACT_GROUPS: {
  id: ContractGroup;
  label: string;
  /** Tailwind-independent hex used for map markers and legend swatches */
  color: string;
  hint: string;
}[] = [
  { id: "alternance", label: "Alternance", color: "#f59e0b", hint: "Apprentissage & professionnalisation" },
  { id: "CDI", label: "CDI", color: "#2563eb", hint: "Contrat à durée indéterminée" },
  { id: "CDD", label: "CDD", color: "#10b981", hint: "Contrat à durée déterminée" },
  { id: "interim", label: "Intérim", color: "#a855f7", hint: "Mission d'intérim (MIS)" },
];
