import { X, Building2, MapPin, Clock, Euro, Users, ExternalLink, BadgeCheck, Compass } from "lucide-react";
import type { Job } from "@shared/types";
import { CONTRACT_GROUPS } from "@shared/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const COLORS = Object.fromEntries(CONTRACT_GROUPS.map((g) => [g.id, g.color]));

export function relativeDate(iso: string | null) {
  if (!iso) return "date inconnue";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 31) return `il y a ${days} jours`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

function Row({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-foreground/90">{children}</span>
    </div>
  );
}

export default function JobDetail({ job, onClose }: { job: Job; onClose: () => void }) {
  const color = COLORS[job.contractGroup] ?? "#94a3b8";

  return (
    <aside
      className="pointer-events-auto flex h-full w-full flex-col border-l border-border bg-card md:w-[380px]"
      data-testid="panel-job-detail"
    >
      <div className="flex items-start gap-3 border-b border-border p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${color}1f`, color }}
              data-testid="badge-contract"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              {job.contractLabel ?? job.contractGroup}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {job.id}
            </span>
          </div>
          <h2 className="text-base font-semibold leading-snug" data-testid="text-job-title">
            {job.title}
          </h2>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          aria-label="Fermer le détail de l'offre"
          data-testid="button-close-detail"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          <div className="space-y-2.5">
            <Row icon={Building2}>{job.company ?? "Entreprise non communiquée"}</Row>
            <Row icon={MapPin}>
              {job.locationLabel}
              {job.approximateLocation && (
                <span className="ml-1.5 text-xs text-muted-foreground">(position approchée)</span>
              )}
            </Row>
            {job.workingTime && <Row icon={Clock}>{job.workingTime}</Row>}
            {job.salary && <Row icon={Euro}>{job.salary}</Row>}
            {job.experience && <Row icon={BadgeCheck}>{job.experience}</Row>}
            {job.positions && job.positions > 1 && <Row icon={Users}>{job.positions} postes à pourvoir</Row>}
            {job.romeLabel && (
              <Row icon={Compass}>
                {job.romeLabel}{" "}
                <span className="font-mono text-xs text-muted-foreground">{job.romeCode}</span>
              </Row>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Descriptif du poste
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {job.description ?? "Aucun descriptif fourni par le recruteur."}
            </p>
          </div>
        </div>
      </ScrollArea>

      <div className="space-y-2 border-t border-border p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Publiée {relativeDate(job.createdAt)}</span>
          <span>{job.source}</span>
        </div>
        <Button asChild className="w-full" data-testid="link-apply">
          <a href={job.url ?? "#"} target="_blank" rel="noreferrer noopener">
            Voir l'offre complète
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </aside>
  );
}
