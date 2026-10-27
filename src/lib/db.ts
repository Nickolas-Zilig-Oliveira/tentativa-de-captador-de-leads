import Database from "better-sqlite3";
import fs from "fs";
import os from "os";
import path from "path";
import { Opportunity, SearchParams } from "@/lib/types";

// Persistência local simples em SQLite (arquivo único, sem servidor de banco).
// Guarda o histórico de buscas para fins de auditoria/depuração.
// Em serverless (Vercel), o filesystem do projeto é somente leitura, então
// usamos /tmp — funciona, mas não é garantido persistir entre invocações
// diferentes. Por isso a exportação de CSV é feita no navegador (ver
// opportunities-panel.tsx), sem depender deste banco.
const DB_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), "leads.db")
  : path.join(process.cwd(), "data", "leads.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS searches (
      id TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      neighborhood TEXT,
      segment_id TEXT NOT NULL,
      limit_requested INTEGER NOT NULL,
      total_found INTEGER NOT NULL,
      coverage_note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      search_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      neighborhood TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      phone TEXT,
      website TEXT,
      status TEXT NOT NULL,
      quality_score INTEGER,
      quality_reasons TEXT,
      priority TEXT NOT NULL,
      confidence TEXT NOT NULL,
      source TEXT NOT NULL,
      last_checked_at TEXT NOT NULL,
      FOREIGN KEY (search_id) REFERENCES searches(id)
    );

    CREATE INDEX IF NOT EXISTS idx_opportunities_search ON opportunities(search_id);
  `);

  return db;
}

export function saveSearch(
  searchId: string,
  params: SearchParams,
  totalFound: number,
  coverageNote: string
) {
  const database = getDb();
  database
    .prepare(
      `INSERT INTO searches (id, city, state, neighborhood, segment_id, limit_requested, total_found, coverage_note, created_at)
       VALUES (@id, @city, @state, @neighborhood, @segmentId, @limit, @totalFound, @coverageNote, @createdAt)`
    )
    .run({
      id: searchId,
      city: params.city,
      state: params.state,
      neighborhood: params.neighborhood ?? null,
      segmentId: params.segmentId,
      limit: params.limit,
      totalFound,
      coverageNote,
      createdAt: new Date().toISOString(),
    });
}

export function saveOpportunities(opportunities: Opportunity[]) {
  const database = getDb();
  const insert = database.prepare(
    `INSERT OR REPLACE INTO opportunities
      (id, search_id, name, category, neighborhood, address, city, state, phone, website, status, quality_score, quality_reasons, priority, confidence, source, last_checked_at)
     VALUES
      (@id, @searchId, @name, @category, @neighborhood, @address, @city, @state, @phone, @website, @status, @qualityScore, @qualityReasons, @priority, @confidence, @source, @lastCheckedAt)`
  );

  const insertMany = database.transaction((items: Opportunity[]) => {
    for (const o of items) {
      insert.run({
        ...o,
        qualityReasons: JSON.stringify(o.qualityReasons),
      });
    }
  });

  insertMany(opportunities);
}

export function getOpportunitiesBySearchId(searchId: string): Opportunity[] {
  const database = getDb();
  const rows = database
    .prepare(`SELECT * FROM opportunities WHERE search_id = ?`)
    .all(searchId) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: row.id as string,
    searchId: row.search_id as string,
    name: row.name as string,
    category: row.category as string,
    neighborhood: row.neighborhood as string | null,
    address: row.address as string | null,
    city: row.city as string,
    state: row.state as string,
    phone: row.phone as string | null,
    website: row.website as string | null,
    status: row.status as Opportunity["status"],
    qualityScore: row.quality_score as number | null,
    qualityReasons: JSON.parse((row.quality_reasons as string) ?? "[]"),
    priority: row.priority as Opportunity["priority"],
    confidence: row.confidence as Opportunity["confidence"],
    source: row.source as Opportunity["source"],
    lastCheckedAt: row.last_checked_at as string,
  }));
}
