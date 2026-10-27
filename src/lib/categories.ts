// Segmentos comerciais oferecidos na busca, mapeados para tags do OpenStreetMap.
// Cada segmento pode corresponder a múltiplas combinações chave=valor do OSM.
export type OsmTagFilter = { key: string; value?: string };

export type Segment = {
  id: string;
  label: string;
  tags: OsmTagFilter[];
};

export const SEGMENTS: Segment[] = [
  {
    id: "restaurantes",
    label: "Restaurantes e alimentação",
    tags: [
      { key: "amenity", value: "restaurant" },
      { key: "amenity", value: "fast_food" },
      { key: "amenity", value: "cafe" },
      { key: "amenity", value: "bar" },
      { key: "amenity", value: "pub" },
      { key: "shop", value: "bakery" },
    ],
  },
  {
    id: "barbearias",
    label: "Barbearias",
    tags: [{ key: "shop", value: "hairdresser" }],
  },
  {
    id: "saloes_beleza",
    label: "Salões de beleza e estética",
    tags: [
      { key: "shop", value: "beauty" },
      { key: "shop", value: "cosmetics" },
      { key: "shop", value: "massage" },
    ],
  },
  {
    id: "clinicas",
    label: "Clínicas e saúde",
    tags: [
      { key: "amenity", value: "clinic" },
      { key: "amenity", value: "doctors" },
      { key: "healthcare", value: "clinic" },
      { key: "healthcare", value: "centre" },
    ],
  },
  {
    id: "dentistas",
    label: "Dentistas",
    tags: [
      { key: "amenity", value: "dentist" },
      { key: "healthcare", value: "dentist" },
    ],
  },
  {
    id: "oficinas",
    label: "Oficinas mecânicas",
    tags: [
      { key: "shop", value: "car_repair" },
      { key: "shop", value: "motorcycle_repair" },
      { key: "shop", value: "tyres" },
    ],
  },
  {
    id: "lojas",
    label: "Lojas e comércio em geral",
    tags: [
      { key: "shop", value: "clothes" },
      { key: "shop", value: "shoes" },
      { key: "shop", value: "supermarket" },
      { key: "shop", value: "convenience" },
      { key: "shop", value: "furniture" },
      { key: "shop", value: "electronics" },
      { key: "shop", value: "hardware" },
      { key: "shop", value: "gift" },
      { key: "shop", value: "variety_store" },
      { key: "shop", value: "department_store" },
      { key: "shop", value: "pet" },
      { key: "shop", value: "florist" },
    ],
  },
  {
    id: "academias",
    label: "Academias e estúdios",
    tags: [
      { key: "leisure", value: "fitness_centre" },
      { key: "sport", value: "yoga" },
    ],
  },
  {
    id: "imobiliarias",
    label: "Imobiliárias",
    tags: [{ key: "office", value: "estate_agent" }],
  },
  {
    id: "prestadores_servicos",
    label: "Prestadores de serviços e escritórios",
    tags: [
      { key: "office", value: "lawyer" },
      { key: "office", value: "accountant" },
      { key: "office", value: "company" },
      { key: "office", value: "it" },
      { key: "craft", value: "electrician" },
      { key: "craft", value: "plumber" },
      { key: "craft", value: "carpenter" },
      { key: "craft", value: "photographer" },
    ],
  },
  {
    id: "veterinarias",
    label: "Clínicas veterinárias / pet shops",
    tags: [
      { key: "amenity", value: "veterinary" },
      { key: "shop", value: "pet" },
    ],
  },
];

export const ALL_SEGMENTS_ID = "todos";

export function getSegmentById(id: string): Segment | undefined {
  return SEGMENTS.find((s) => s.id === id);
}

export function resolveTagFilters(segmentId: string): OsmTagFilter[] {
  if (segmentId === ALL_SEGMENTS_ID) {
    return SEGMENTS.flatMap((s) => s.tags);
  }
  return getSegmentById(segmentId)?.tags ?? [];
}
