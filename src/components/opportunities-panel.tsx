"use client";

import { useMemo, useState } from "react";
import { Opportunity } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { opportunitiesToCsv } from "@/lib/csv";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  CONFIDENCE_LABELS,
  SOURCE_LABELS,
  priorityBadgeVariant,
  statusBadgeVariant,
} from "@/lib/labels";
import { Download, ExternalLink, Phone } from "lucide-react";

const ALL = "__all__";

function downloadCsv(opportunities: Opportunity[], searchId: string) {
  const csv = opportunitiesToCsv(opportunities);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `oportunidades-${searchId.slice(0, 8)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

type SortKey = "priority" | "qualityScore" | "name";

const PRIORITY_RANK: Record<Opportunity["priority"], number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

type Props = {
  opportunities: Opportunity[];
  searchId: string;
};

export function OpportunitiesPanel({ opportunities, searchId }: Props) {
  const [neighborhoodFilter, setNeighborhoodFilter] = useState(ALL);
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [priorityFilter, setPriorityFilter] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [selected, setSelected] = useState<Opportunity | null>(null);

  const neighborhoods = useMemo(
    () =>
      Array.from(new Set(opportunities.map((o) => o.neighborhood).filter(Boolean))) as string[],
    [opportunities]
  );

  const categories = useMemo(
    () => Array.from(new Set(opportunities.map((o) => o.category))),
    [opportunities]
  );

  const filtered = useMemo(() => {
    let list = opportunities;
    if (neighborhoodFilter !== ALL) list = list.filter((o) => o.neighborhood === neighborhoodFilter);
    if (categoryFilter !== ALL) list = list.filter((o) => o.category === categoryFilter);
    if (statusFilter !== ALL) list = list.filter((o) => o.status === statusFilter);
    if (priorityFilter !== ALL) list = list.filter((o) => o.priority === priorityFilter);

    const sorted = [...list].sort((a, b) => {
      if (sortKey === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (sortKey === "qualityScore") return (a.qualityScore ?? 999) - (b.qualityScore ?? 999);
      return a.name.localeCompare(b.name, "pt-BR");
    });

    return sorted;
  }, [opportunities, neighborhoodFilter, categoryFilter, statusFilter, priorityFilter, sortKey]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="flex flex-wrap gap-3">
          <FilterSelect
            label="Bairro"
            value={neighborhoodFilter}
            onChange={setNeighborhoodFilter}
            options={neighborhoods.map((n) => ({ value: n, label: n }))}
          />
          <FilterSelect
            label="Categoria"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <FilterSelect
            label="Prioridade"
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <FilterSelect
            label="Ordenar por"
            value={sortKey}
            onChange={(v) => setSortKey(v as SortKey)}
            options={[
              { value: "priority", label: "Prioridade" },
              { value: "qualityScore", label: "Nota de qualidade" },
              { value: "name", label: "Nome" },
            ]}
            allowAll={false}
          />
        </div>

        <Button
          variant="outline"
          className="gap-2"
          onClick={() => downloadCsv(opportunities, searchId)}
        >
          <Download className="size-4" />
          Exportar CSV
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} de {opportunities.length} oportunidades exibidas
      </p>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Bairro / Endereço</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Qualidade</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Confiança</TableHead>
              <TableHead className="text-right">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Nenhuma oportunidade corresponde aos filtros selecionados.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((o) => (
              <TableRow key={o.id} className="cursor-pointer" onClick={() => setSelected(o)}>
                <TableCell className="font-medium">
                  {o.name}
                  {o.website && (
                    <a
                      href={o.website}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-1.5 inline-flex text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{o.category}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {[o.neighborhood, o.address].filter(Boolean).join(" — ") || "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {o.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3.5" /> {o.phone}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(o.status)}>{STATUS_LABELS[o.status]}</Badge>
                </TableCell>
                <TableCell>{o.qualityScore ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={priorityBadgeVariant(o.priority)}>{PRIORITY_LABELS[o.priority]}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {CONFIDENCE_LABELS[o.confidence]}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(o); }}>
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 text-sm">
                <DetailRow label="Categoria" value={selected.category} />
                <DetailRow
                  label="Endereço"
                  value={[selected.neighborhood, selected.address, selected.city, selected.state]
                    .filter(Boolean)
                    .join(", ")}
                />
                <DetailRow label="Telefone" value={selected.phone ?? "Não disponível"} />
                <DetailRow
                  label="Site"
                  value={
                    selected.website ? (
                      <a href={selected.website} target="_blank" rel="noreferrer" className="underline">
                        {selected.website}
                      </a>
                    ) : (
                      "Nenhum encontrado"
                    )
                  }
                />
                <DetailRow label="Status" value={STATUS_LABELS[selected.status]} />
                <DetailRow label="Nota de qualidade" value={selected.qualityScore ?? "Não aplicável"} />
                <DetailRow
                  label="Principais problemas"
                  value={
                    selected.qualityReasons.length ? (
                      <ul className="list-disc pl-4 space-y-0.5">
                        {selected.qualityReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    ) : (
                      "Nenhum problema identificado"
                    )
                  }
                />
                <DetailRow label="Prioridade" value={PRIORITY_LABELS[selected.priority]} />
                <DetailRow label="Confiança da análise" value={CONFIDENCE_LABELS[selected.confidence]} />
                <DetailRow label="Fonte dos dados" value={SOURCE_LABELS[selected.source]} />
                <DetailRow
                  label="Última verificação"
                  value={new Date(selected.lastCheckedAt).toLocaleString("pt-BR")}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2">{value}</span>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allowAll = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allowAll?: boolean;
}) {
  const labelByValue = new Map(options.map((o) => [o.value, o.label]));
  if (allowAll) labelByValue.set(ALL, "Todos");

  return (
    <div className="grid gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger size="sm" className="min-w-[160px]">
          <SelectValue>{(v: string) => labelByValue.get(v) ?? v}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allowAll && <SelectItem value={ALL}>Todos</SelectItem>}
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
