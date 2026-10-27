// Geocodificação via Nominatim (OpenStreetMap), gratuito.
// Respeita a política de uso: 1 requisição por segundo, com User-Agent identificável.

export type BoundingBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type GeocodeResult = {
  displayName: string;
  lat: number;
  lon: number;
  boundingBox: BoundingBox;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT =
  "captador-de-leads/0.1 (uso pessoal; contato: nadanick2@gmail.com)";

let lastRequestAt = 0;

async function throttle() {
  const minIntervalMs = 1100;
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < minIntervalMs) {
    await new Promise((r) => setTimeout(r, minIntervalMs - elapsed));
  }
  lastRequestAt = Date.now();
}

export async function geocodeArea(
  city: string,
  state: string,
  neighborhood?: string
): Promise<GeocodeResult | null> {
  const queryParts = [neighborhood, city, state, "Brasil"].filter(Boolean);
  const q = queryParts.join(", ");

  await throttle();

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Nominatim respondeu ${res.status}`);
  }

  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    boundingbox: [string, string, string, string];
  }>;

  if (!data.length) return null;

  const item = data[0];
  const [south, north, west, east] = item.boundingbox.map(Number);

  return {
    displayName: item.display_name,
    lat: Number(item.lat),
    lon: Number(item.lon),
    boundingBox: { south, west, north, east },
  };
}
