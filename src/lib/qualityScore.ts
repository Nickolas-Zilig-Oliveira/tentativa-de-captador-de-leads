import { WebsiteCheckResult } from "@/lib/types";

// Pontuação de qualidade (0-100) baseada apenas em sinais mensuráveis.
// Pesos documentados abaixo — não há avaliação estética subjetiva aqui.
// Critérios heurísticos (usados quando não há PageSpeed Insights):
//   HTTPS ativo              -> 15 pts
//   Tempo de resposta         -> até 15 pts (rápido), 7 (médio), 0 (lento)
//   Meta viewport (mobile)    -> 25 pts
//   Título da página          -> 10 pts
//   Meta descrição (SEO)      -> 10 pts
//   Informações de contato    -> 25 pts
// Se o PageSpeed Insights estiver disponível (chave configurada), o score
// final combina 60% PageSpeed (performance/acessibilidade/SEO/boas práticas)
// e 40% heurística, pois o PageSpeed mede fatores reais de desempenho que
// o fetch simples não cobre (ex.: imagens não otimizadas, JS bloqueante).
export type QualityResult = {
  score: number;
  issues: string[];
};

export function computeQualityScore(check: WebsiteCheckResult): QualityResult {
  const issues: string[] = [];
  let heuristic = 0;

  if (check.https) {
    heuristic += 15;
  } else {
    issues.push("Site não usa HTTPS");
  }

  if (check.responseTimeMs !== null) {
    if (check.responseTimeMs < 1500) heuristic += 15;
    else if (check.responseTimeMs < 3000) heuristic += 7;
    else issues.push(`Site lento (${check.responseTimeMs}ms para responder)`);
  }

  if (check.hasViewportMeta) {
    heuristic += 25;
  } else if (check.hasViewportMeta === false) {
    issues.push("Sem adaptação para dispositivos móveis (meta viewport ausente)");
  }

  if (check.hasTitle) {
    heuristic += 10;
  } else if (check.hasTitle === false) {
    issues.push("Página sem título (tag <title>)");
  }

  if (check.hasMetaDescription) {
    heuristic += 10;
  } else if (check.hasMetaDescription === false) {
    issues.push("Sem meta descrição (prejudica SEO)");
  }

  if (check.hasContactInfo) {
    heuristic += 25;
  } else if (check.hasContactInfo === false) {
    issues.push("Telefone/contato não encontrado facilmente na página");
  }

  let finalScore = heuristic;

  if (check.pagespeed) {
    const values = [
      check.pagespeed.performance,
      check.pagespeed.accessibility,
      check.pagespeed.seo,
      check.pagespeed.bestPractices,
    ].filter((v): v is number => v !== null);

    if (values.length > 0) {
      const avgPagespeed = values.reduce((a, b) => a + b, 0) / values.length;
      finalScore = Math.round(0.6 * avgPagespeed + 0.4 * heuristic);

      if (check.pagespeed.performance !== null && check.pagespeed.performance < 50) {
        issues.push(`Desempenho baixo no PageSpeed Insights (${check.pagespeed.performance}/100)`);
      }
      if (check.pagespeed.accessibility !== null && check.pagespeed.accessibility < 50) {
        issues.push(`Problemas de acessibilidade no PageSpeed Insights (${check.pagespeed.accessibility}/100)`);
      }
    }
  }

  return { score: Math.max(0, Math.min(100, finalScore)), issues };
}
