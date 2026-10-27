import { RawBusiness } from "@/lib/types";

// Integração opcional com a Places API (New) do Google.
// Só é ativada se GOOGLE_PLACES_API_KEY estiver definida no .env.local.
// Sem a chave, a busca usa apenas o Overpass/OpenStreetMap (gratuito) e a
// interface informa que a cobertura pode estar incompleta.
//
// Custo: a Places API é paga acima da cota gratuita mensal do Google Cloud.
// Antes de ativar em produção, configure limites de orçamento no Google
// Cloud Console. Esta função já aplica um teto de requisições por busca
// (MAX_PAGES) para controlar o consumo.
const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const MAX_PAGES = 3; // cada página = 1 requisição paga, até 20 resultados

type PlacesApiResult = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  location?: { latitude: number; longitude: number };
  primaryType?: string;
};

type PlacesApiResponse = {
  places?: PlacesApiResult[];
  nextPageToken?: string;
};

export function isGooglePlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY);
}

export async function searchGooglePlaces(
  textQuery: string,
  segmentId: string,
  city: string,
  state: string
): Promise<RawBusiness[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const results: RawBusiness[] = [];
  let pageToken: string | undefined;
  let page = 0;

  do {
    const body: Record<string, unknown> = { textQuery };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch(TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.location,places.primaryType,nextPageToken",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Google Places respondeu ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as PlacesApiResponse;

    for (const place of data.places ?? []) {
      if (!place.displayName?.text || !place.location) continue;
      results.push({
        sourceId: place.id,
        source: "google_places",
        name: place.displayName.text,
        category: place.primaryType ?? "outro",
        segmentId,
        neighborhood: null,
        address: place.formattedAddress ?? null,
        city,
        state,
        phone: place.nationalPhoneNumber ?? null,
        website: place.websiteUri ?? null,
        lat: place.location.latitude,
        lon: place.location.longitude,
      });
    }

    pageToken = data.nextPageToken;
    page += 1;

    // Google exige um pequeno intervalo antes do nextPageToken ficar válido.
    if (pageToken) await new Promise((r) => setTimeout(r, 2000));
  } while (pageToken && page < MAX_PAGES);

  return results;
}
