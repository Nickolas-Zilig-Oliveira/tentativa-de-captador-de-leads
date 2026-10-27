import { NextRequest, NextResponse } from "next/server";
import { getOpportunitiesBySearchId } from "@/lib/db";
import { opportunitiesToCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const searchId = req.nextUrl.searchParams.get("searchId");
  if (!searchId) {
    return NextResponse.json({ error: "searchId é obrigatório" }, { status: 400 });
  }

  const opportunities = getOpportunitiesBySearchId(searchId);
  if (opportunities.length === 0) {
    return NextResponse.json({ error: "Nenhum resultado encontrado para essa busca" }, { status: 404 });
  }

  const csv = opportunitiesToCsv(opportunities);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="oportunidades-${searchId.slice(0, 8)}.csv"`,
    },
  });
}
