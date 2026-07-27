import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import type { Job, ContractGroup } from "@shared/types";
import { CONTRACT_GROUPS } from "@shared/types";

const GROUP_COLOR: Record<string, string> = Object.fromEntries(
  CONTRACT_GROUPS.map((g) => [g.id, g.color]),
);
GROUP_COLOR.autre = "#94a3b8";

const FRANCE_CENTER: L.LatLngExpression = [46.6, 2.4];

interface Props {
  jobs: Job[];
  selectedId: string | null;
  onSelect: (job: Job) => void;
  dark: boolean;
  /** changes when the query changes — triggers a re-fit of the viewport */
  fitKey: string;
}

function markerIcon(group: ContractGroup, active: boolean) {
  const color = GROUP_COLOR[group] ?? GROUP_COLOR.autre;
  return L.divIcon({
    className: "ft-marker",
    html: `<span class="ft-pin${active ? " ft-pin--active" : ""}" style="--pin:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/** Cluster badge: size by count, ring segments by contract mix. */
function clusterIcon(cluster: any) {
  const children: L.Marker[] = cluster.getAllChildMarkers();
  const count = children.length;
  const tally = new Map<string, number>();
  for (const child of children) {
    const g = (child.options as any).contractGroup ?? "autre";
    tally.set(g, (tally.get(g) ?? 0) + 1);
  }

  let acc = 0;
  const stops: string[] = [];
  for (const [group, n] of Array.from(tally.entries()).sort((a, b) => b[1] - a[1])) {
    const from = (acc / count) * 100;
    acc += n;
    const to = (acc / count) * 100;
    stops.push(`${GROUP_COLOR[group] ?? GROUP_COLOR.autre} ${from}% ${to}%`);
  }

  const size = count < 10 ? 38 : count < 50 ? 46 : count < 200 ? 54 : 62;
  const label = count > 999 ? `${(count / 1000).toFixed(1)}k` : String(count);

  return L.divIcon({
    className: "ft-cluster",
    html: `<div class="ft-cluster__ring" style="background:conic-gradient(${stops.join(",")})">
             <span class="ft-cluster__count">${label}</span>
           </div>`,
    iconSize: L.point(size, size),
  });
}

export default function JobMap({ jobs, selectedId, onSelect, dark, fitKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  const tileUrl = dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  // Init once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, {
      center: FRANCE_CENTER,
      zoom: 6,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    tileRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &middot; tuiles <a href="https://carto.com/attributions">CARTO</a> &middot; données <a href="https://francetravail.io/data/api/offres-emploi">France Travail</a>',
    }).addTo(map);

    const cluster = new (L as any).MarkerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 55,
      chunkedLoading: true,
      iconCreateFunction: clusterIcon,
    });
    map.addLayer(cluster);
    clusterRef.current = cluster;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Theme-aware basemap
  useEffect(() => {
    tileRef.current?.setUrl(tileUrl);
  }, [tileUrl]);

  const jobsKey = useMemo(() => jobs.map((j) => j.id).join("|"), [jobs]);

  // Sync markers
  useEffect(() => {
    const cluster = clusterRef.current;
    const map = mapRef.current;
    if (!cluster || !map) return;

    cluster.clearLayers();
    markersRef.current.clear();

    const markers = jobs.map((job) => {
      const marker = L.marker([job.lat, job.lon], {
        icon: markerIcon(job.contractGroup, false),
        title: job.title,
        contractGroup: job.contractGroup,
        riseOnHover: true,
      } as any);
      marker.on("click", () => selectRef.current(job));
      marker.bindTooltip(
        `<strong>${escapeHtml(job.title)}</strong><br>${escapeHtml(job.company ?? job.locationLabel)}`,
        { direction: "top", offset: L.point(0, -10), opacity: 1, className: "ft-tooltip" },
      );
      markersRef.current.set(job.id, marker);
      return marker;
    });

    cluster.addLayers(markers);

    if (markers.length) {
      // Overseas departments would stretch the viewport across the Atlantic:
      // fit on metropolitan France when it holds most of the results.
      const metro = jobs.filter(
        (j) => j.lat > 41 && j.lat < 51.6 && j.lon > -5.6 && j.lon < 9.9,
      );
      const target = metro.length >= jobs.length * 0.6 ? metro : jobs;
      const bounds = L.latLngBounds(target.map((j) => [j.lat, j.lon] as [number, number]));
      map.fitBounds(bounds.pad(0.12), { animate: true, maxZoom: 12 });
    } else {
      map.setView(FRANCE_CENTER, 6);
    }
  }, [jobsKey, fitKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight + reveal the selected offer
  useEffect(() => {
    const cluster = clusterRef.current;
    const map = mapRef.current;
    if (!cluster || !map) return;

    markersRef.current.forEach((marker, id) => {
      const job = jobs.find((j) => j.id === id);
      if (!job) return;
      marker.setIcon(markerIcon(job.contractGroup, id === selectedId));
      marker.setZIndexOffset(id === selectedId ? 1000 : 0);
    });

    if (!selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (marker) {
      cluster.zoomToShowLayer(marker, () => {
        map.panTo(marker.getLatLng(), { animate: true });
      });
    }
  }, [selectedId, jobsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="h-full w-full" data-testid="map-container" />;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
