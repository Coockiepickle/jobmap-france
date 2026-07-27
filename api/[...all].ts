// Vercel Serverless Function entry point.
//
// Vercel builds every file under /api into its own function. This catch-all
// segment ("[...all].ts") receives every request under /api/* (status,
// referentiel, jobs) and forwards it into the same Express app used by the
// local dev/production server (server/index.ts), minus the static-file and
// Vite middleware which Vercel's static hosting already handles for the
// built client in dist/public.
import "dotenv/config";
import express from "express";
import type { Server } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { registerRoutes } from "../server/routes.js";

const app = express();

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

// `registerRoutes` only forwards its first argument through as a return
// value — it never calls any Server methods on it — so a stub is safe here.
// There is no long-running `http.Server` in a serverless function.
let ready: Promise<unknown> | null = null;
function init() {
  if (!ready) {
    ready = registerRoutes({} as Server, app)
      .then(() => {
        app.use((err: any, _req: any, res: any, next: any) => {
          const status = err.status || err.statusCode || 500;
          console.error("Internal Server Error:", err);
          if (res.headersSent) return next(err);
          res.status(status).json({ message: err.message || "Internal Server Error" });
        });
      })
      .catch((err) => {
        ready = null; // allow retry on next invocation instead of caching a rejection forever
        throw err;
      });
  }
  return ready;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await init();
    app(req as any, res as any);
  } catch (err: any) {
    console.error("api handler crashed", err);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ message: err?.message ?? "unknown error", stack: err?.stack ?? null }));
  }
}
