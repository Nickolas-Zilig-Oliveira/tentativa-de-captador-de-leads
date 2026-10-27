import { WebsiteCheckResult } from "@/lib/types";
import { fetchPageSpeed } from "@/lib/pagespeed";

const FETCH_TIMEOUT_MS = 8_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; captador-de-leads/0.1; verificacao de sites publicos)";

// Verificação de homepage apenas (não rastreamos o site inteiro).
// Isso é uma limitação deliberada: medir "links quebrados em todo o site"
// exigiria um crawler completo, fora do escopo desta primeira versão.
export async function checkWebsite(url: string): Promise<WebsiteCheckResult> {
  const result: WebsiteCheckResult = {
    checkedUrl: url,
    reachable: false,
    httpStatus: null,
    https: url.startsWith("https://"),
    responseTimeMs: null,
    hasViewportMeta: null,
    hasTitle: null,
    hasMetaDescription: null,
    hasContactInfo: null,
    pageSizeBytes: null,
    error: null,
    pagespeed: null,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });
    result.responseTimeMs = Date.now() - startedAt;
    result.httpStatus = res.status;
    result.https = res.url.startsWith("https://");
    result.reachable = res.status >= 200 && res.status < 400;

    const html = await res.text();
    result.pageSizeBytes = Buffer.byteLength(html, "utf8");

    result.hasViewportMeta = /<meta[^>]+name=["']viewport["']/i.test(html);
    result.hasTitle = /<title[^>]*>[^<]{3,}<\/title>/i.test(html);
    result.hasMetaDescription = /<meta[^>]+name=["']description["']/i.test(
      html
    );

    const phonePattern = /(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}/;
    const contactKeywords = /(telefone|whatsapp|contato|endere[çc]o|fale conosco)/i;
    result.hasContactInfo =
      phonePattern.test(html) || contactKeywords.test(html);
  } catch (err) {
    result.error =
      err instanceof Error && err.name === "AbortError"
        ? "Tempo limite excedido ao acessar o site"
        : `Falha ao acessar: ${(err as Error).message}`;
  } finally {
    clearTimeout(timeout);
  }

  if (result.reachable) {
    result.pagespeed = await fetchPageSpeed(url);
  }

  return result;
}
