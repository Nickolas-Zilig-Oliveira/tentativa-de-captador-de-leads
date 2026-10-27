// Quando a fonte não informa um site, tentamos uma verificação adicional
// leve antes de concluir "sem site": testamos alguns domínios prováveis
// (nome do comércio + TLDs comuns no Brasil). Isso não é garantia —
// é só uma segunda checagem rápida e transparente, com timeout curto.
// Se nada responder, aumentamos a confiança de que realmente não há site
// encontrável por esse meio (mas o resultado nunca é "certeza absoluta").

const CANDIDATE_TLDS = [".com.br", ".com"];
const GUESS_TIMEOUT_MS = 4_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; captador-de-leads/0.1; verificacao de dominio)";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "");
}

export type DomainGuessResult = {
  found: boolean;
  url: string | null;
};

export async function tryGuessDomain(name: string): Promise<DomainGuessResult> {
  const slug = slugify(name);
  if (!slug || slug.length < 3) return { found: false, url: null };

  const nameTokens = slug.match(/.{1,}/) ? [slug] : [];

  for (const tld of CANDIDATE_TLDS) {
    const url = `https://www.${slug}${tld}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GUESS_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": USER_AGENT },
      });

      if (res.ok) {
        const html = await res.text();
        const normalizedHtml = html.toLowerCase();
        const matchesName = nameTokens.some((t) => normalizedHtml.includes(t));
        if (matchesName) {
          return { found: true, url };
        }
      }
    } catch {
      // ignora falha de um candidato e tenta o próximo
    } finally {
      clearTimeout(timeout);
    }
  }

  return { found: false, url: null };
}
