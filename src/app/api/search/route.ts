import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { geocodeArea } from "@/lib/datasources/geocode";
import { searchOverpass } from "@/lib/datasources/overpass";
import { isGooglePlacesConfigured, searchGooglePlaces } from "@/lib/datasources/googlePlaces";
import { resolveTagFilters, getSegmentById, ALL_SEGMENTS_ID, SEGMENTS } from "@/lib/categories";
import { dedupeBusinesses } from "@/lib/dedupe";
import { classifyBusiness } from "@/lib/classify";
import { mapWithConcurrency } from "@/lib/concurrency";
import { saveSearch, saveOpportunities } from "@/lib/db";
import { RawBusiness, SearchMeta } from "@/lib/types";

const requestSchema = z.object({
  city: z.string().min(2),
  state: z.string().min(2).max(2),
  neighborhood: z.string().optional(),
  segmentId: z.string().min(1),
  limit: z.number().int().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const params = parsed.data;
  const startedAt = Date.now();

  const geo = await geocodeArea(params.city, params.state, params.neighborhood).catch(
    (err) => {
      throw new Error(`Falha ao localizar a região: ${(err as Error).message}`);
    }
  );

  if (!geo) {
    return NextResponse.json(
      { error: "Não foi possível localizar essa cidade/bairro. Verifique a grafia." },
      { status: 404 }
    );
  }

  const tagFilters = resolveTagFilters(params.segmentId);
  if (tagFilters.length === 0) {
    return NextResponse.json({ error: "Segmento inválido" }, { status: 400 });
  }

  let rawBusinesses: RawBusiness[] = [];
  const sourceNotes: string[] = [];

  try {
    rawBusinesses = await searchOverpass(
      geo.boundingBox,
      tagFilters,
      params.segmentId,
      params.city,
      params.state.toUpperCase()
    );
    sourceNotes.push(`OpenStreetMap: ${rawBusinesses.length} estabelecimentos encontrados na área.`);
  } catch (err) {
    console.error("Falha ao consultar Overpass:", err);
    sourceNotes.push(`OpenStreetMap indisponível no momento: ${(err as Error).message}`);
  }

  if (isGooglePlacesConfigured()) {
    try {
      const segmentLabel =
        params.segmentId === ALL_SEGMENTS_ID
          ? "comércios"
          : getSegmentById(params.segmentId)?.label ?? "comércios";
      const place = params.neighborhood
        ? `${params.neighborhood}, ${params.city} - ${params.state}`
        : `${params.city} - ${params.state}`;
      const googleResults = await searchGooglePlaces(
        `${segmentLabel} em ${place}`,
        params.segmentId,
        params.city,
        params.state.toUpperCase()
      );
      rawBusinesses = rawBusinesses.concat(googleResults);
      sourceNotes.push(`Google Places: ${googleResults.length} estabelecimentos encontrados.`);
    } catch (err) {
      sourceNotes.push(`Google Places indisponível: ${(err as Error).message}`);
    }
  } else {
    sourceNotes.push(
      "Google Places não configurado (defina GOOGLE_PLACES_API_KEY para ampliar a cobertura)."
    );
  }

  const deduped = dedupeBusinesses(rawBusinesses);
  const totalFound = deduped.length;
  const limited = deduped.slice(0, params.limit);

  const searchId = randomUUID();

  const opportunities = await mapWithConcurrency(limited, 5, (business) =>
    classifyBusiness(business, searchId)
  );

  const limitNote =
    totalFound > params.limit
      ? ` Encontramos ${totalFound} estabelecimentos na área, mas apenas ${params.limit} foram analisados (limite da busca). Aumente o limite ou refine o bairro para ver mais.`
      : "";
  const coverageNote = `Cobertura baseada nas fontes disponíveis (${sourceNotes.join(" ")}). Pode não representar 100% dos estabelecimentos reais da região.${limitNote}`;

  try {
    saveSearch(searchId, params, totalFound, coverageNote);
    saveOpportunities(opportunities);
  } catch (err) {
    // Persistência é apenas para histórico/depuração — a exportação CSV
    // roda no navegador e não depende disto, então uma falha aqui não deve
    // derrubar a busca (ex.: filesystem somente leitura em serverless).
    console.error("Falha ao salvar histórico da busca:", err);
  }

  const meta: SearchMeta = {
    searchId,
    totalFound,
    totalReturned: opportunities.length,
    coverageNote,
    elapsedMs: Date.now() - startedAt,
  };

  return NextResponse.json({ meta, opportunities, segments: SEGMENTS });
}
