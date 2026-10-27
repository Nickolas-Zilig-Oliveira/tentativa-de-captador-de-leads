import { Priority, WebsiteStatus } from "@/lib/types";

// Classificação de prioridade comercial: considera gravidade comprovada
// dos problemas e a confiança da conclusão. Nunca afirma intenção de compra,
// apenas prioriza onde a oportunidade é mais provável e mais bem evidenciada.
export function classifyPriority(
  status: WebsiteStatus,
  confidence: "alta" | "media" | "baixa",
  qualityScore: number | null
): Priority {
  if (status === "sem_site_detectado") {
    return confidence === "alta" ? "alta" : "media";
  }

  if (status === "site_com_problemas") {
    if (qualityScore === null) return "media";
    if (qualityScore < 40) return "alta";
    if (qualityScore < 70) return "media";
    return "baixa";
  }

  if (status === "inconclusivo") {
    return "baixa";
  }

  // site_ok
  return "baixa";
}
