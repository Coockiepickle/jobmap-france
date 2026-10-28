/**
 * Persistance de la fermeture du guide d'accueil.
 *
 * Le site est déployé sur Vercel (navigateur normal) où localStorage est fiable.
 * Dans les contextes où le stockage est bloqué (iframe sandbox), l'accès est
 * enveloppé dans un try/catch : la lecture renvoie simplement "non lu" et le
 * guide s'affiche à chaque chargement — aucun crash possible.
 */

const KEY = "jobmap-guide-dismissed-v1";

export function isGuideDismissed(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markGuideDismissed(): void {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // Stockage indisponible : on ignore, le guide réapparaîtra au prochain chargement.
  }
}
