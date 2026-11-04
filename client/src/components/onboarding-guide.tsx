import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isGuideDismissed, markGuideDismissed } from "@/lib/guide-storage";
import {
  MapIcon,
  Search,
  SlidersHorizontal,
  MousePointerClick,
  Info,
  HelpCircle,
} from "lucide-react";

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    icon: MapIcon,
    title: "Bienvenue sur la carte de l'emploi",
    body: (
      <>
        <p>
          Ce site présente les <strong>offres d'emploi actives en France</strong>{" "}
          (données France&nbsp;Travail) sur une carte interactive. Chaque point
          correspond à une offre géolocalisée, regroupée en clusters lorsque la
          carte est dézoomée.
        </p>
        <p>
          Les offres sont actualisées à chaque recherche et proviennent de
          l'API Offres d'emploi v2 de France&nbsp;Travail.
        </p>
      </>
    ),
  },
  {
    icon: SlidersHorizontal,
    title: "Filtrer les offres",
    body: (
      <>
        <p>Le panneau de gauche (ou le bouton réglages sur mobile) permet de :</p>
        <ul>
          <li>rechercher par <strong>mots-clés</strong> (métier, compétence, entreprise) ;</li>
          <li>
            filtrer par <strong>type de contrat</strong> : alternance, CDI, CDD,
            intérim — chaque filtre affiche le nombre d'offres correspondantes ;
          </li>
          <li>
            filtrer par <strong>domaine d'emploi</strong> (restauration,
            informatique, hôtellerie…), avec les domaines officiels France
            Travail ;
          </li>
          <li>
            restreindre à une <strong>région</strong> ou des{" "}
            <strong>départements</strong> précis, et régler la fraîcheur de
            publication et le volume maximum d'offres.
          </li>
        </ul>
      </>
    ),
  },
  {
    icon: Search,
    title: "Rechercher",
    body: (
      <>
        <p>
          Tapez votre recherche (ex. « développeur », « boulanger », « Lyon »)
          dans le champ de recherche puis validez. La carte se met à jour
          automatiquement et zoome sur les résultats.
        </p>
        <p>
          Les compteurs sous chaque type de contrat indiquent combien d'offres
          sont actuellement affichées sur la carte.
        </p>
      </>
    ),
  },
  {
    icon: MousePointerClick,
    title: "Explorer la carte",
    body: (
      <>
        <p>
          Cliquez sur un <strong>cluster</strong> (cercle coloré) pour zoomer sur
          une zone. L'anneau du cluster montre la répartition des contrats
          (alternance, CDI, CDD, intérim).
        </p>
        <p>
          Cliquez sur un <strong>marqueur</strong> individuel pour ouvrir le
          panneau de détail : employeur, lieu, salaire, description complète et
          lien direct vers l'offre sur France&nbsp;Travail.
        </p>
      </>
    ),
  },
  {
    icon: Info,
    title: "Bon à savoir",
    body: (
      <>
        <p>
          Le nombre d'offres affichées est plafonné par le « volume max » que
          vous choisissez : la carte montre un échantillon des offres les plus
          récentes correspondant à vos filtres.
        </p>
        <p>
          Vous pouvez rouvrir ce guide à tout moment avec le bouton{" "}
          <strong>?</strong> dans la barre du haut. Bonne recherche&nbsp;!
        </p>
      </>
    ),
  },
];

interface OnboardingGuideProps {
  open: boolean;
  onClose: () => void;
}

export default function OnboardingGuide({ open, onClose }: OnboardingGuideProps) {
  const [step, setStep] = useState(0);

  // À chaque réouverture, on repart de la première étape.
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="z-[1500] max-h-[85dvh] overflow-y-auto sm:max-w-lg"
        data-testid="dialog-onboarding"
      >
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
              {current.body}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 pt-1" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted",
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-guide-skip">
            Passer
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                data-testid="button-guide-prev"
              >
                Précédent
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={onClose} data-testid="button-guide-finish">
                Commencer
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                data-testid="button-guide-next"
              >
                Suivant
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Bouton "?" du header : rouvre le guide. */
export function GuideButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      aria-label="Guide d'utilisation"
      title="Guide d'utilisation"
      data-testid="button-guide-open"
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
}
