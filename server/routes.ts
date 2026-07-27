import type { Express, Request } from "express";
import type { Server } from "node:http";
import { z } from "zod";
import type { ApiStatus, ContractGroup, Job, JobsResponse } from "@shared/types";
import { DEPARTMENTS, REGIONS, departmentsOfRegion } from "./geo.js";
import {
  SCOPE,
  criteriaForGroup,
  hasCredentials,
  normalizeOffer,
  searchOffers,
  type SearchCriteria,
} from "./francetravail.js";
import { searchDemoOffers } from "./demo.js";

const listParam = (value: unknown): string[] =>
  String(value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const querySchema = z.object({
  departements: z.string().optional(),
  regions: z.string().optional(),
  contrats: z.string().optional(),
  motsCles: z.string().optional(),
  publieeDepuis: z.coerce.number().int().min(1).max(31).optional(),
  limit: z.coerce.number().int().min(50).max(1150).optional(),
});

const VALID_GROUPS: ContractGroup[] = ["alternance", "CDI", "CDD", "interim"];

/** Short-lived response cache — the France Travail API is rate limited. */
const cache = new Map<string, { at: number; payload: JobsResponse }>();
const CACHE_TTL = 3 * 60 * 1000;

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/status", (_req, res) => {
    const status: ApiStatus = {
      credentialsConfigured: hasCredentials(),
      mode: hasCredentials() ? "france-travail" : "demo",
      tokenScope: SCOPE,
    };
    res.json(status);
  });

  /** Department + region reference data for the pickers. */
  app.get("/api/referentiel", (_req, res) => {
    res.json({ departments: DEPARTMENTS, regions: REGIONS });
  });

  /**
   * GET /api/jobs
   *   ?departements=69,38&regions=11&contrats=alternance,CDI&motsCles=devops
   *   &publieeDepuis=31&limit=300
   *
   * One France Travail query is issued per contract group (alternance is a
   * dedicated flag, not a contract code), then results are merged and deduped.
   */
  app.get("/api/jobs", async (req: Request, res, next) => {
    try {
      const parsed = querySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ message: "Paramètres invalides", issues: parsed.error.issues });
      }
      const q = parsed.data;

      const departments = listParam(q.departements);
      const regions = listParam(q.regions);
      const contracts = (listParam(q.contrats) as ContractGroup[]).filter((c) =>
        VALID_GROUPS.includes(c),
      );
      const groups: ContractGroup[] = contracts.length ? contracts : VALID_GROUPS;
      const keywords = q.motsCles?.trim() || null;
      const publishedWithinDays = q.publieeDepuis ?? null;
      const totalLimit = q.limit ?? 400;
      const maxPerGroup = Math.max(50, Math.ceil(totalLimit / groups.length));

      const cacheKey = JSON.stringify({
        departments,
        regions,
        groups,
        keywords,
        publishedWithinDays,
        maxPerGroup,
      });
      const hit = cache.get(cacheKey);
      if (hit && Date.now() - hit.at < CACHE_TTL) return res.json(hit.payload);

      // The API accepts one region per call — expand extra regions into departments.
      const [primaryRegion, ...extraRegions] = regions;
      const expandedDepartments = new Set(departments);
      for (const r of extraRegions) for (const d of departmentsOfRegion(r)) expandedDepartments.add(d);

      const base: SearchCriteria = {
        departments: Array.from(expandedDepartments),
        regions: primaryRegion ? [primaryRegion] : [],
        keywords,
        publishedWithinDays,
        limit: maxPerGroup,
      };

      const live = hasCredentials();
      const warnings: string[] = [];
      const availableByGroup: Record<string, number> = {};
      const byId = new Map<string, Job>();
      let dropped = 0;

      for (const group of groups) {
        const criteria = criteriaForGroup(group, base);
        try {
          const { offers, total } = live
            ? await searchOffers(criteria)
            : searchDemoOffers(criteria);
          availableByGroup[group] = total;

          for (const offer of offers) {
            const job = normalizeOffer(offer);
            if (!job) {
              dropped++;
              continue;
            }
            // An offer can match two queries (e.g. an alternance CDD): keep the
            // alternance classification, which is the more specific one.
            const existing = byId.get(job.id);
            if (!existing || job.contractGroup === "alternance") byId.set(job.id, job);
          }
        } catch (err) {
          availableByGroup[group] = 0;
          warnings.push(`${group}: ${(err as Error).message}`);
        }
      }

      const jobs = Array.from(byId.values()).sort((a, b) =>
        (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
      );

      const payload: JobsResponse = {
        jobs,
        meta: {
          mode: live ? "france-travail" : "demo",
          total: Object.values(availableByGroup).reduce((s, n) => s + n, 0),
          plotted: jobs.length,
          dropped,
          availableByGroup,
          query: {
            departments: Array.from(expandedDepartments),
            regions,
            contracts: groups,
            keywords,
            publishedWithinDays,
            maxPerGroup,
          },
          warnings,
          fetchedAt: new Date().toISOString(),
        },
      };

      cache.set(cacheKey, { at: Date.now(), payload });
      res.json(payload);
    } catch (err) {
      next(err);
    }
  });

  return httpServer;
}
