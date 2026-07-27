import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  SlidersHorizontal,
  Moon,
  Sun,
  Loader2,
  MapPin,
  AlertTriangle,
  RotateCw,
} from "lucide-react";
import type { ContractGroup, Job, JobsResponse } from "@shared/types";
import { CONTRACT_GROUPS } from "@shared/types";
import JobMap from "@/components/job-map";
import JobDetail, { relativeDate } from "@/components/job-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface DepartmentInfo {
  code: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
}

interface Referentiel {
  departments: DepartmentInfo[];
  regions: { code: string; name: string }[];
}

const COLORS = Object.fromEntries(CONTRACT_GROUPS.map((g) => [g.id, g.color]));

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 text-primary" aria-label="Logo Carte des offres" fill="none">
      <path
        d="M16 3c-4.4 0-8 3.5-8 7.9 0 5.6 6.7 12.9 7.4 13.7.3.4.9.4 1.2 0C17.3 23.8 24 16.5 24 10.9 24 6.5 20.4 3 16 3Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="16" cy="10.8" r="2.8" fill="currentColor" />
      <path d="M6 27.5h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".45" />
    </svg>
  );
}

export default function Home() {
  const [dark, setDark] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // ----- filter state -------------------------------------------------
  const [contracts, setContracts] = useState<ContractGroup[]>(["alternance", "CDI", "CDD", "interim"]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [region, setRegion] = useState<string>("all");
  const [keywordsDraft, setKeywordsDraft] = useState("");
  const [keywords, setKeywords] = useState("");
  const [freshness, setFreshness] = useState("31");
  const [limit, setLimit] = useState("400");
  const [depFilter, setDepFilter] = useState("");
  const [selected, setSelected] = useState<Job | null>(null);

  const { data: ref } = useQuery<Referentiel>({ queryKey: ["/api/referentiel"] });

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (departments.length) p.set("departements", departments.join(","));
    if (region !== "all") p.set("regions", region);
    p.set("contrats", contracts.join(","));
    if (keywords.trim()) p.set("motsCles", keywords.trim());
    if (freshness !== "all") p.set("publieeDepuis", freshness);
    p.set("limit", limit);
    return p.toString();
  }, [departments, region, contracts, keywords, freshness, limit]);

  const { data, isFetching, isError, error, refetch } = useQuery<JobsResponse>({
    queryKey: ["/api/jobs", params],
    queryFn: async () => (await apiRequest("GET", `/api/jobs?${params}`)).json(),
    enabled: contracts.length > 0,
  });

  const jobs = data?.jobs ?? [];
  const meta = data?.meta;

  useEffect(() => {
    if (selected && !jobs.some((j) => j.id === selected.id)) setSelected(null);
  }, [jobs]); // eslint-disable-line react-hooks/exhaustive-deps

  const countByGroup = useMemo(() => {
    const m: Record<string, number> = {};
    for (const j of jobs) m[j.contractGroup] = (m[j.contractGroup] ?? 0) + 1;
    return m;
  }, [jobs]);

  const visibleDepartments = useMemo(() => {
    const list = ref?.departments ?? [];
    const needle = depFilter.trim().toLowerCase();
    return list.filter(
      (d) =>
        (region === "all" || d.region === region) &&
        (!needle || d.name.toLowerCase().includes(needle) || d.code.startsWith(needle)),
    );
  }, [ref, depFilter, region]);

  const toggleContract = (id: ContractGroup) =>
    setContracts((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const toggleDepartment = (code: string) =>
    setDepartments((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  /* ------------------------------------------------------------------ */

  const filters = (
    <div className="flex h-full flex-col">
      <div className="space-y-4 border-b border-border p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setKeywords(keywordsDraft);
          }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keywordsDraft}
            onChange={(e) => setKeywordsDraft(e.target.value)}
            placeholder="Métier, compétence, entreprise…"
            className="pl-9"
            data-testid="input-keywords"
          />
        </form>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Type de contrat
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CONTRACT_GROUPS.map((g) => {
              const on = contracts.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleContract(g.id)}
                  title={g.hint}
                  aria-pressed={on}
                  data-testid={`filter-contract-${g.id}`}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-sm transition-colors hover-elevate",
                    on ? "border-transparent text-foreground" : "border-border text-muted-foreground",
                  )}
                  style={on ? { backgroundColor: `${g.color}22`, boxShadow: `inset 0 0 0 1px ${g.color}66` } : undefined}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: g.color }} />
                    {g.label}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {countByGroup[g.id] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
            Compteurs = offres cartographiées, plafonnées par le volume max.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Publiée depuis
            </p>
            <Select value={freshness} onValueChange={setFreshness}>
              <SelectTrigger data-testid="select-freshness">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">24 heures</SelectItem>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="14">14 jours</SelectItem>
                <SelectItem value="31">31 jours</SelectItem>
                <SelectItem value="all">Toutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Volume max
            </p>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger data-testid="select-limit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="200">200 offres</SelectItem>
                <SelectItem value="400">400 offres</SelectItem>
                <SelectItem value="800">800 offres</SelectItem>
                <SelectItem value="1150">1 150 offres</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Région
          </p>
          <Select
            value={region}
            onValueChange={(v) => {
              setRegion(v);
              setDepartments([]);
            }}
          >
            <SelectTrigger data-testid="select-region">
              <SelectValue placeholder="Toute la France" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toute la France</SelectItem>
              {(ref?.regions ?? []).map((r) => (
                <SelectItem key={r.code} value={r.code}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Départements {departments.length > 0 && `(${departments.length})`}
        </p>
        {departments.length > 0 && (
          <button
            type="button"
            onClick={() => setDepartments([])}
            className="text-xs text-primary hover:underline"
            data-testid="button-clear-departments"
          >
            Effacer
          </button>
        )}
      </div>
      <div className="px-4 pb-2">
        <Input
          value={depFilter}
          onChange={(e) => setDepFilter(e.target.value)}
          placeholder="Filtrer (69, Rhône…)"
          className="h-8 text-sm"
          data-testid="input-department-filter"
        />
      </div>
      <ScrollArea className="min-h-0 flex-1 px-4">
        <div className="space-y-0.5 pb-4">
          {visibleDepartments.map((d) => (
            <label
              key={d.code}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover-elevate"
              data-testid={`checkbox-department-${d.code}`}
            >
              <Checkbox
                checked={departments.includes(d.code)}
                onCheckedChange={() => toggleDepartment(d.code)}
              />
              <span className="font-mono text-xs text-muted-foreground">{d.code}</span>
              <span className="truncate">{d.name}</span>
            </label>
          ))}
          {visibleDepartments.length === 0 && (
            <p className="px-2 py-4 text-sm text-muted-foreground">Aucun département correspondant.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3 md:px-4">
        <Logo />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold leading-tight">
            Carte de l'emploi · France Travail
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Offres actives géolocalisées, filtrables par contrat et territoire
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {meta && (
            <span
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
                meta.mode === "france-travail"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
              )}
              data-testid="status-mode"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {meta.mode === "france-travail" ? "API France Travail" : "Jeu de démonstration"}
            </span>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => refetch()}
            aria-label="Rafraîchir les offres"
            data-testid="button-refresh"
          >
            <RotateCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDark((v) => !v)}
            aria-label="Basculer le thème"
            data-testid="button-theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="lg:hidden" aria-label="Ouvrir les filtres">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="z-[1200] w-[320px] p-0 pt-9">
              {filters}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Filters + results */}
        <div className="hidden w-[340px] shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
          <div className="min-h-0 flex-1">{filters}</div>
        </div>

        {/* Map */}
        <main className="relative isolate min-w-0 flex-1">
          <JobMap
            jobs={jobs}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            dark={dark}
            fitKey={params}
          />

          {/* Stats bar */}
          <div className="pointer-events-none absolute left-3 top-3 z-[500] flex flex-wrap gap-2">
            <div className="pointer-events-auto rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
              {isFetching && !data ? (
                <Skeleton className="h-4 w-40" />
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold tabular-nums" data-testid="text-plotted">
                    {jobs.length}
                  </span>
                  <span className="text-muted-foreground">
                    offres cartographiées{" "}
                    {meta && meta.total > jobs.length && (
                      <>
                        · <span className="font-mono tabular-nums">{meta.total.toLocaleString("fr-FR")}</span>{" "}
                        correspondent aux filtres
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
            {meta && meta.dropped > 0 && (
              <div className="pointer-events-auto rounded-lg border border-border bg-card/95 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
                {meta.dropped} offre(s) sans géolocalisation exploitable
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] hidden rounded-lg border border-border bg-card/95 p-3 text-xs shadow-sm backdrop-blur sm:block">
            <p className="mb-2 font-semibold uppercase tracking-wider text-muted-foreground">
              Offres cartographiées
            </p>
            <ul className="space-y-1.5">
              {CONTRACT_GROUPS.map((g) => (
                <li key={g.id} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                  <span>{g.label}</span>
                  <span className="ml-auto pl-4 font-mono tabular-nums text-muted-foreground">
                    {countByGroup[g.id] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {isFetching && (
            <div className="absolute right-3 top-3 z-[500] flex items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement des offres…
            </div>
          )}

          {isError && (
            <div className="absolute left-1/2 top-1/2 z-[600] w-[min(420px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-destructive/40 bg-card p-4 shadow-lg">
              <div className="mb-2 flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-semibold">Impossible de charger les offres</span>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{(error as Error)?.message}</p>
              <Button size="sm" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          )}

          {contracts.length === 0 && (
            <div className="absolute left-1/2 top-1/2 z-[600] w-[min(380px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-4 text-center shadow-lg">
              <MapPin className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Sélectionnez au moins un type de contrat pour afficher des offres.
              </p>
            </div>
          )}
        </main>

        {/* Detail panel */}
        {selected && (
          <div className="absolute inset-0 z-[700] md:relative md:inset-auto md:z-auto">
            <JobDetail job={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      {/* Footer strip */}
      <footer className="z-20 flex h-8 shrink-0 items-center gap-3 border-t border-border bg-card px-4 text-[11px] text-muted-foreground">
        <span>
          Données&nbsp;:{" "}
          <a
            href="https://francetravail.io/data/api/offres-emploi"
            target="_blank"
            rel="noreferrer noopener"
            className="underline underline-offset-2"
          >
            API Offres d'emploi v2
          </a>{" "}
          · Fond de carte&nbsp;:{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer noopener"
            className="underline underline-offset-2"
          >
            OpenStreetMap
          </a>
        </span>
        {meta && (
          <span className="ml-auto hidden font-mono sm:block">
            maj {relativeDate(meta.fetchedAt)} · {meta.query.contracts.join(" / ")}
          </span>
        )}
      </footer>
    </div>
  );
}
