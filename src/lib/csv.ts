import { Opportunity } from "@/lib/types";
import { STATUS_LABELS, PRIORITY_LABELS, CONFIDENCE_LABELS, SOURCE_LABELS } from "@/lib/labels";

function csvEscape(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[;"\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// CSV com separador ";" (padrão do Excel em pt-BR) e BOM UTF-8,
// para preservar acentuação corretamente ao abrir no Excel/Google Sheets.
export function opportunitiesToCsv(opportunities: Opportunity[]): string {
  const headers = [
    "Nome",
    "Categoria",
    "Bairro",
    "Endereço",
    "Cidade",
    "Estado",
    "Telefone",
    "Site",
    "Status",
    "Nota de qualidade",
    "Principais problemas",
    "Prioridade",
    "Confiança",
    "Fonte",
    "Última verificação",
  ];

  const rows = opportunities.map((o) =>
    [
      o.name,
      o.category,
      o.neighborhood,
      o.address,
      o.city,
      o.state,
      o.phone,
      o.website,
      STATUS_LABELS[o.status],
      o.qualityScore,
      o.qualityReasons.join(" | "),
      PRIORITY_LABELS[o.priority],
      CONFIDENCE_LABELS[o.confidence],
      SOURCE_LABELS[o.source],
      new Date(o.lastCheckedAt).toLocaleString("pt-BR"),
    ]
      .map(csvEscape)
      .join(";")
  );

  const bom = "﻿";
  return bom + [headers.join(";"), ...rows].join("\r\n");
}
