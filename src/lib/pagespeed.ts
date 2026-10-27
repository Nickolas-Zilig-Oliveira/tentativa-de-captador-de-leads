import { PageSpeedResult } from "@/lib/types";

// Integração opcional com Google PageSpeed Insights.
// Só é usada se GOOGLE_PAGESPEED_API_KEY estiver configurada no ambiente.
// Sem a chave, a ferramenta usa apenas as métricas heurísticas em
// src/lib/qualityScore.ts e informa isso claramente na interface.
const PAGESPEED_URL =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export async function fetchPageSpeed(
  url: string
): Promise<PageSpeedResult | null> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) return null;

  try {
    const endpoint = new URL(PAGESPEED_URL);
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("key", apiKey);
    endpoint.searchParams.set("strategy", "MOBILE");
    for (const cat of ["PERFORMANCE", "ACCESSIBILITY", "SEO", "BEST_PRACTICES"]) {
      endpoint.searchParams.append("category", cat);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch(endpoint.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    const categories = data?.lighthouseResult?.categories ?? {};

    const toScore = (val: unknown): number | null =>
      typeof val === "number" ? Math.round(val * 100) : null;

    return {
      performance: toScore(categories.performance?.score),
      accessibility: toScore(categories.accessibility?.score),
      seo: toScore(categories.seo?.score),
      bestPractices: toScore(categories["best-practices"]?.score),
    };
  } catch {
    return null;
  }
}
