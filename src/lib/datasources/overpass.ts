import { OsmTagFilter } from "@/lib/categories";
import { RawBusiness } from "@/lib/types";
import { BoundingBox } from "@/lib/datasources/geocode";

// Overpass API (OpenStreetMap) — fonte gratuita, sem necessidade de chave.
// Endpoint público oficial. Sujeito a limites de uso; por isso cacheamos
// resultados por cidade/segmento (ver src/lib/db.ts) e limitamos o timeout.
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const REQUEST_TIMEOUT_MS = 25_000;
const USER_AGENT =
  "captador-de-leads/0.1 (uso pessoal; contato: nadanick2@gmail.com)";

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements: OverpassElement[];
};

function buildQuery(bbox: BoundingBox, tags: OsmTagFilter[]): string {
  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const clauses = tags
    .map(({ key, value }) => {
      const tagExpr = value ? `"${key}"="${value}"` : `"${key}"`;
      return `  node[${tagExpr}](${bboxStr});\n  way[${tagExpr}](${bboxStr});`;
    })
    .join("\n");

  return `[out:json][timeout:20];\n(\n${clauses}\n);\nout center tags;`;
}

function extractAddress(tags: Record<string, string>): string | null {
  const street = tags["addr:street"];
  const num = tags["addr:housenumber"];
  if (street) {
    return num ? `${street}, ${num}` : street;
  }
  return null;
}

function extractPhone(tags: Record<string, string>): string | null {
  return (
    tags["contact:phone"] ??
    tags["phone"] ??
    tags["contact:mobile"] ??
    tags["mobile"] ??
    null
  );
}

function extractWebsite(tags: Record<string, string>): string | null {
  const raw =
    tags["contact:website"] ??
    tags["website"] ??
    tags["url"] ??
    tags["contact:url"] ??
    null;
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) {
    return `https://${raw}`;
  }
  return raw;
}

function pickCategoryLabel(tags: Record<string, string>): string {
  const candidateKeys = ["amenity", "shop", "office", "craft", "leisure", "healthcare", "sport"];
  for (const key of candidateKeys) {
    if (tags[key]) return `${key}:${tags[key]}`;
  }
  return "outro";
}

export async function searchOverpass(
  bbox: BoundingBox,
  tags: OsmTagFilter[],
  segmentId: string,
  city: string,
  state: string
): Promise<RawBusiness[]> {
  const query = buildQuery(bbox, tags);

  // O servidor público do Overpass costuma devolver 502/504 quando está
  // sobrecarregado (não é um erro da nossa aplicação). Tentamos uma vez
  // mais após um pequeno intervalo antes de desistir.
  const RETRYABLE_STATUS = new Set([502, 503, 504]);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 3000));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(OVERPASS_URL, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
          Accept: "*/*",
        },
        signal: controller.signal,
      });
    } catch (err) {
      lastError = err as Error;
      continue;
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      lastError = new Error(`Overpass respondeu ${res.status}: ${bodyText.slice(0, 300)}`);
      if (RETRYABLE_STATUS.has(res.status) && attempt === 0) continue;
      throw lastError;
    }

    const data = (await res.json()) as OverpassResponse;
    return parseOverpassResponse(data, segmentId, city, state);
  }

  throw lastError ?? new Error("Falha desconhecida ao consultar Overpass");
}

function parseOverpassResponse(
  data: OverpassResponse,
  segmentId: string,
  city: string,
  state: string
): RawBusiness[] {

  const businesses: RawBusiness[] = [];
  for (const el of data.elements) {
    const tagsObj = el.tags ?? {};
    const name = tagsObj["name"];
    if (!name) continue; // sem nome não é um lead utilizável

    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat === undefined || lon === undefined) continue;

    businesses.push({
      sourceId: `${el.type}/${el.id}`,
      source: "osm_overpass",
      name,
      category: pickCategoryLabel(tagsObj),
      segmentId,
      neighborhood: tagsObj["addr:suburb"] ?? tagsObj["addr:neighbourhood"] ?? null,
      address: extractAddress(tagsObj),
      city,
      state,
      phone: extractPhone(tagsObj),
      website: extractWebsite(tagsObj),
      lat,
      lon,
    });
  }

  return businesses;
}
