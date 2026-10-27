import { Opportunity } from "@/lib/types";

export const STATUS_LABELS: Record<Opportunity["status"], string> = {
  sem_site_detectado: "Sem site detectado",
  site_com_problemas: "Site com problemas",
  site_ok: "Site funcional",
  inconclusivo: "Inconclusivo",
};

export const PRIORITY_LABELS: Record<Opportunity["priority"], string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const CONFIDENCE_LABELS: Record<Opportunity["confidence"], string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const SOURCE_LABELS: Record<Opportunity["source"], string> = {
  osm_overpass: "OpenStreetMap",
  google_places: "Google Places",
};

export function priorityBadgeVariant(priority: Opportunity["priority"]) {
  if (priority === "alta") return "destructive" as const;
  if (priority === "media") return "secondary" as const;
  return "outline" as const;
}

export function statusBadgeVariant(status: Opportunity["status"]) {
  if (status === "sem_site_detectado") return "destructive" as const;
  if (status === "site_com_problemas") return "secondary" as const;
  if (status === "site_ok") return "outline" as const;
  return "secondary" as const;
}
