import { randomUUID } from "crypto";
import { Opportunity, RawBusiness, WebsiteStatus } from "@/lib/types";
import { checkWebsite } from "@/lib/websiteCheck";
import { computeQualityScore } from "@/lib/qualityScore";
import { classifyPriority } from "@/lib/priority";
import { tryGuessDomain } from "@/lib/domainGuess";

export async function classifyBusiness(
  business: RawBusiness,
  searchId: string
): Promise<Opportunity> {
  const now = new Date().toISOString();

  if (business.website) {
    const check = await checkWebsite(business.website);

    if (!check.reachable) {
      return {
        id: randomUUID(),
        searchId,
        name: business.name,
        category: business.category,
        neighborhood: business.neighborhood,
        address: business.address,
        city: business.city,
        state: business.state,
        phone: business.phone,
        website: business.website,
        status: "inconclusivo",
        qualityScore: null,
        qualityReasons: [
          check.error ?? "Site informado não respondeu (possível site inacessível)",
        ],
        priority: classifyPriority("inconclusivo", "media", null),
        confidence: "media",
        source: business.source,
        lastCheckedAt: now,
      };
    }

    const { score, issues } = computeQualityScore(check);
    const status: WebsiteStatus = issues.length > 0 && score < 85 ? "site_com_problemas" : "site_ok";

    return {
      id: randomUUID(),
      searchId,
      name: business.name,
      category: business.category,
      neighborhood: business.neighborhood,
      address: business.address,
      city: business.city,
      state: business.state,
      phone: business.phone,
      website: business.website,
      status,
      qualityScore: score,
      qualityReasons: issues,
      priority: classifyPriority(status, "alta", score),
      confidence: "alta",
      source: business.source,
      lastCheckedAt: now,
    };
  }

  // Sem site informado pela fonte: tenta uma segunda verificação leve
  // antes de concluir ausência de site (ver src/lib/domainGuess.ts).
  const guess = await tryGuessDomain(business.name);

  if (guess.found && guess.url) {
    return {
      id: randomUUID(),
      searchId,
      name: business.name,
      category: business.category,
      neighborhood: business.neighborhood,
      address: business.address,
      city: business.city,
      state: business.state,
      phone: business.phone,
      website: guess.url,
      status: "inconclusivo",
      qualityScore: null,
      qualityReasons: [
        "Possível site encontrado por tentativa de domínio (não confirmado pela fonte oficial) — confira manualmente",
      ],
      priority: classifyPriority("inconclusivo", "media", null),
      confidence: "media",
      source: business.source,
      lastCheckedAt: now,
    };
  }

  return {
    id: randomUUID(),
    searchId,
    name: business.name,
    category: business.category,
    neighborhood: business.neighborhood,
    address: business.address,
    city: business.city,
    state: business.state,
    phone: business.phone,
    website: null,
    status: "sem_site_detectado",
    qualityScore: null,
    qualityReasons: [
      "Nenhum site informado na fonte de dados e nenhum domínio provável respondeu",
    ],
    priority: classifyPriority("sem_site_detectado", "alta", null),
    confidence: "alta",
    source: business.source,
    lastCheckedAt: now,
  };
}
