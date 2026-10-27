export type DataSource = "osm_overpass" | "google_places";

export type WebsiteStatus =
  | "sem_site_detectado"
  | "site_com_problemas"
  | "site_ok"
  | "inconclusivo";

export type Priority = "alta" | "media" | "baixa";

export type RawBusiness = {
  sourceId: string;
  source: DataSource;
  name: string;
  category: string;
  segmentId: string;
  neighborhood: string | null;
  address: string | null;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  lat: number;
  lon: number;
};

export type QualityIssue = string;

export type WebsiteCheckResult = {
  checkedUrl: string;
  reachable: boolean;
  httpStatus: number | null;
  https: boolean;
  responseTimeMs: number | null;
  hasViewportMeta: boolean | null;
  hasTitle: boolean | null;
  hasMetaDescription: boolean | null;
  hasContactInfo: boolean | null;
  pageSizeBytes: number | null;
  error: string | null;
  pagespeed: PageSpeedResult | null;
};

export type PageSpeedResult = {
  performance: number | null;
  accessibility: number | null;
  seo: number | null;
  bestPractices: number | null;
};

export type Opportunity = {
  id: string;
  searchId: string;
  name: string;
  category: string;
  neighborhood: string | null;
  address: string | null;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  status: WebsiteStatus;
  qualityScore: number | null;
  qualityReasons: QualityIssue[];
  priority: Priority;
  confidence: "alta" | "media" | "baixa";
  source: DataSource;
  lastCheckedAt: string;
};

export type SearchParams = {
  city: string;
  state: string;
  neighborhood?: string;
  segmentId: string;
  limit: number;
};

export type SearchMeta = {
  searchId: string;
  totalFound: number;
  totalReturned: number;
  coverageNote: string;
  elapsedMs: number;
};
