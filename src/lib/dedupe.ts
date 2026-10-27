import { RawBusiness } from "@/lib/types";

function normalize(s: string | null): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Remove duplicatas por identificador de fonte e, quando necessário,
// por combinação normalizada de nome + telefone (ou nome + endereço).
export function dedupeBusinesses(items: RawBusiness[]): RawBusiness[] {
  const seenSourceIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const result: RawBusiness[] = [];

  for (const item of items) {
    const sourceKey = `${item.source}:${item.sourceId}`;
    if (seenSourceIds.has(sourceKey)) continue;

    const nameKey = normalize(item.name);
    const phoneKey = normalize(item.phone);
    const addressKey = normalize(item.address);
    const fingerprint = phoneKey
      ? `${nameKey}|${phoneKey}`
      : `${nameKey}|${addressKey}`;

    if (fingerprint !== "|" && seenFingerprints.has(fingerprint)) continue;

    seenSourceIds.add(sourceKey);
    seenFingerprints.add(fingerprint);
    result.push(item);
  }

  return result;
}
