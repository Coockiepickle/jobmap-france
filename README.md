# Carte de l'emploi · France Travail

Interactive map of active job offers in France, built on the **France Travail "Offres d'emploi v2"** API with **Leaflet + OpenStreetMap** tiles. Offers are clustered by geolocation, filterable by contract family (alternance, CDI, CDD, intérim), and each marker opens a detail panel.

- Clustered markers (`leaflet.markercluster`) whose ring shows the contract mix of the cluster
- Dynamic filters: contract family, department (101 incl. DOM), region (18), keywords, publication freshness, max volume
- Detail sidebar: employer, location, working time, salary, experience, ROME code, full description, link to the original offer
- Runs with **zero credentials** on a deterministic demo dataset (~900 offers) through the exact same code path, then switches to live data as soon as API keys are present

## 1. Getting France Travail credentials

1. Create an account on [francetravail.io](https://francetravail.io/).
2. Create an application, then subscribe it to the **"Offres d'emploi v2"** API.
3. Copy the `identifiant client` (looks like `PAR_xxxxx_yyyyy`) and the `clé secrète`.
4. Copy `.env.example` to `.env` and fill in:

```bash
FT_CLIENT_ID=PAR_xxxxx_yyyyy
FT_CLIENT_SECRET=your_secret
```

Restart the server. The header badge switches from `Jeu de démonstration` to `API France Travail`, and `GET /api/status` reports `mode: "france-travail"`.

## 1bis. CARTO basemap API key

CARTO's raster basemap tiles (`basemaps.cartocdn.com`) now require a free API key — without it the map still works but every tile shows an "API key required" watermark.

1. Request a free key at [carto.com/basemaps/apikey](https://carto.com/basemaps/apikey/) (instant, no approval queue, no CARTO account needed, free up to 5M tile requests/month).
2. Add it to `.env` (must keep the `VITE_` prefix so Vite exposes it to the browser bundle):

```bash
VITE_CARTO_API_KEY=your_carto_key
```

3. On Vercel, add `VITE_CARTO_API_KEY` as a Project Environment Variable (Production + Preview) and redeploy — Vite bakes it into the build at build time, so a redeploy is required after adding or changing it.

## 2. API integration (server/francetravail.ts)

### OAuth2 (client credentials)

```
POST https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id=<FT_CLIENT_ID>
client_secret=<FT_CLIENT_SECRET>
scope=api_offresdemploiv2 o2dsoffre
```

The token (`expires_in` ≈ 1500 s) is cached in memory and refreshed 60 s before expiry.

### Offer search

```
GET https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search
Authorization: Bearer <token>
```

Parameters used by this prototype:

| Param           | Usage in the app                                                      |
| --------------- | --------------------------------------------------------------------- |
| `departement`   | comma-separated INSEE department codes (`69,38,2A,974`)                |
| `region`        | one INSEE region code per call — extra regions are expanded to departments |
| `typeContrat`   | `CDI`, `CDD`, `DDI`, `CCE`, `MIS`, `TTI`                               |
| `alternance`    | `true` for the alternance family (apprentissage + professionnalisation) |
| `motsCles`      | free-text keywords                                                     |
| `publieeDepuis` | `1`, `3`, `7`, `14`, `31` days                                         |
| `sort`          | `1` (most recent first)                                                |
| `range`         | `from-to` pagination window                                            |

Documented constraints handled in the client:

- **150 offers max per call**, first index of `range` must stay ≤ 1000 → hard ceiling of 1150 offers per query
- **HTTP 204** means "no result" (empty body, not an error)
- **HTTP 206** is a partial content success; `Content-Range` carries the total count
- Rate limit around 3 requests/second → sequential paging with a small delay
- One request per selected contract family, results merged and de-duplicated by offer id (alternance classification wins over CDD/CDI when an offer matches both)

### Geolocation

`lieuTravail.latitude/longitude` is used when present. When the employer only published a department (`libelle` like `"69 - LYON"`), the offer is snapped to the prefecture coordinates with a deterministic hash-based jitter so markers do not stack, and the job is flagged `approximateLocation: true`.

## 3. Internal HTTP API

| Endpoint           | Description                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `GET /api/status`  | credential state, mode (`demo` / `france-travail`), OAuth scope                                     |
| `GET /api/referentiel` | 101 departments (code, name, prefecture lat/lon, region) and 18 regions                          |
| `GET /api/jobs`    | `departements`, `regions`, `contrats`, `motsCles`, `publieeDepuis`, `limit` — returns normalized jobs + meta |

Example:

```bash
curl "http://localhost:5000/api/jobs?departements=69,38&contrats=alternance,CDI&publieeDepuis=7&limit=400"
curl "http://localhost:5000/api/jobs?regions=76&contrats=interim&motsCles=logistique"
```

Response shape (`shared/types.ts`):

```ts
{
  jobs: Job[];                       // id, title, company, city, lat, lon, contractGroup, salary, description, url…
  meta: {
    mode: "demo" | "france-travail";
    total: number;                   // offers available for the query
    plotted: number;                 // offers returned and mapped
    dropped: number;                 // offers without usable geolocation
    availableByGroup: Record<ContractGroup, number>;
    warnings: string[];
    fetchedAt: string;
  }
}
```

Responses are cached in memory for 3 minutes per query signature.

## 4. Project layout

```
shared/types.ts          Job / JobsResponse / ContractGroup + contract colors
server/francetravail.ts  OAuth2, paginated search, offer normalization, contract classification
server/geo.ts            101 departments + 18 regions with prefecture coordinates
server/demo.ts           deterministic demo corpus in the raw API shape
server/routes.ts         /api/status, /api/referentiel, /api/jobs
client/src/pages/home.tsx        layout, filters, stats, legend, mobile sheet
client/src/components/job-map.tsx    Leaflet map, cluster icons, marker selection
client/src/components/job-detail.tsx detail panel
```

## 5. Deploying to Vercel

The project deploys as a static client (`dist/public`) plus a single serverless function that mounts the same Express routes:

- `vercel.json` sets `buildCommand: npm run build` and `outputDirectory: dist/public`.
- `api/[...all].ts` is a catch-all Vercel Function that lazily calls `registerRoutes()` from `server/routes.ts` and forwards every `/api/*` request into it.
- Add `FT_CLIENT_ID` / `FT_CLIENT_SECRET` as Environment Variables in the Vercel project settings to switch it out of demo mode in production.

```bash
npx vercel link
npx vercel deploy --prod
```

Note: because the root `package.json` has `"type": "module"`, Node's native ESM loader (used by Vercel Functions, unlike Vite's bundler resolution) requires explicit `.js` extensions on relative imports — that's why `server/*.ts` and `api/[...all].ts` import siblings as `"./geo.js"`, `"./francetravail.js"`, etc. even though the source files are `.ts`.

## 6. Running

```bash
npm install
npm run dev     # http://localhost:5000
npm run build   # dist/public (client) + dist/index.cjs (server)
```

## Attribution

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, tiles by [CARTO](https://carto.com/attributions). Job data © [France Travail — Offres d'emploi v2](https://francetravail.io/data/api/offres-emploi). Republishing offers requires compliance with the France Travail API terms of use.
