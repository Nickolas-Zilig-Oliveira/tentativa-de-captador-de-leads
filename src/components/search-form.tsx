"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEGMENTS, ALL_SEGMENTS_ID } from "@/lib/categories";
import { BRAZIL_STATES } from "@/lib/states";
import { Search, Loader2 } from "lucide-react";

export type SearchFormValues = {
  city: string;
  state: string;
  neighborhood: string;
  segmentId: string;
  limit: number;
};

type Props = {
  onSearch: (values: SearchFormValues) => void;
  loading: boolean;
};

export function SearchForm({ onSearch, loading }: Props) {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [segmentId, setSegmentId] = useState(ALL_SEGMENTS_ID);
  const [limit, setLimit] = useState(50);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim() || !state) return;
    onSearch({ city: city.trim(), state, neighborhood: neighborhood.trim(), segmentId, limit });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="grid gap-1.5 lg:col-span-2">
        <Label htmlFor="city">Cidade *</Label>
        <Input
          id="city"
          placeholder="Ex: Botucatu"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="state">Estado *</Label>
        <Select value={state} onValueChange={(v) => v && setState(v)}>
          <SelectTrigger id="state" className="w-full">
            <SelectValue placeholder="UF" />
          </SelectTrigger>
          <SelectContent>
            {BRAZIL_STATES.map((uf) => (
              <SelectItem key={uf} value={uf}>
                {uf}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="neighborhood">Bairro (opcional)</Label>
        <Input
          id="neighborhood"
          placeholder="Ex: Centro"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="segment">Segmento</Label>
        <Select value={segmentId} onValueChange={(v) => v && setSegmentId(v)}>
          <SelectTrigger id="segment" className="w-full">
            <SelectValue>
              {(v: string) =>
                v === ALL_SEGMENTS_ID
                  ? "Todos os segmentos"
                  : SEGMENTS.find((s) => s.id === v)?.label ?? v
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SEGMENTS_ID}>Todos os segmentos</SelectItem>
            {SEGMENTS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="limit">Limite de resultados</Label>
        <Input
          id="limit"
          type="number"
          min={1}
          max={200}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
        />
      </div>

      <div className="lg:col-span-6 flex justify-end">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {loading ? "Buscando..." : "Buscar oportunidades"}
        </Button>
      </div>
    </form>
  );
}
