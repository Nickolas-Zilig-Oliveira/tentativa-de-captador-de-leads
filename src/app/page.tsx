"use client";

import { useState } from "react";
import { SearchForm, SearchFormValues } from "@/components/search-form";
import { OpportunitiesPanel } from "@/components/opportunities-panel";
import { Opportunity, SearchMeta } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AlertTriangle, SearchX } from "lucide-react";

type ResultState = {
  meta: SearchMeta;
  opportunities: Opportunity[];
} | null;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(values: SearchFormValues) {
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao buscar oportunidades");
      }

      setResult({ meta: data.meta, opportunities: data.opportunities });
      toast.success(`${data.opportunities.length} oportunidades encontradas`);
    } catch (err) {
      setResult(null);
      setError((err as Error).message);
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Localizador de Oportunidades
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Encontre comércios da sua região sem site próprio detectado, ou com sites
          que têm problemas reais e verificáveis — para priorizar sua prospecção de
          criação e reformulação de sites.
        </p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <SearchForm onSearch={handleSearch} loading={loading} />
        </CardContent>
      </Card>

      {loading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!loading && error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 flex items-start gap-3 text-sm">
            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Não foi possível concluir a busca</p>
              <p className="text-muted-foreground mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && searched && result && result.opportunities.length === 0 && (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center gap-2 text-center py-12">
            <SearchX className="size-8 text-muted-foreground" />
            <p className="font-medium">Nenhum estabelecimento encontrado nessa área</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Tente ampliar a cidade, remover o filtro de bairro ou escolher
              &quot;Todos os segmentos&quot;.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && result && result.opportunities.length > 0 && (
        <div className="flex flex-col gap-4">
          <Card className="bg-muted/40">
            <CardContent className="pt-6 text-sm text-muted-foreground flex flex-col gap-1">
              <p>
                <strong className="text-foreground">{result.meta.totalFound}</strong> estabelecimentos
                encontrados no total · <strong className="text-foreground">{result.meta.totalReturned}</strong>{" "}
                analisados · busca levou {(result.meta.elapsedMs / 1000).toFixed(1)}s
              </p>
              <p>{result.meta.coverageNote}</p>
            </CardContent>
          </Card>

          <OpportunitiesPanel opportunities={result.opportunities} searchId={result.meta.searchId} />
        </div>
      )}
    </main>
  );
}
