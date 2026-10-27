# Localizador de Oportunidades

Ferramenta para encontrar comércios locais que não têm site próprio (ou que têm
sites com problemas reais e verificáveis), para priorizar prospecção comercial
de criação/reformulação de sites.

Não é um CRM nem um SaaS — é uma busca direta: você informa cidade, bairro e
segmento, e a ferramenta devolve uma lista filtrável e exportável de
oportunidades, com evidências e nível de confiança para cada uma.

## Como funciona

1. **Busca de empresas** — usa o [Overpass API](https://overpass-api.de/)
   (OpenStreetMap), gratuito e sem necessidade de chave. Opcionalmente, pode
   usar também a **Places API (New)** do Google para ampliar a cobertura.
2. **Detecção de site** — verifica se a fonte informa um site. Se não informar,
   tenta uma segunda checagem leve (alguns domínios prováveis) antes de
   concluir "sem site". O resultado sempre vem com um nível de confiança
   (alta/média/baixa), nunca como certeza absoluta.
3. **Avaliação de qualidade** — para sites encontrados, verifica HTTPS, tempo
   de resposta, adaptação a dispositivos móveis, título/meta descrição e
   presença de informações de contato. Se `GOOGLE_PAGESPEED_API_KEY` estiver
   configurada, também usa o Google PageSpeed Insights (desempenho,
   acessibilidade, SEO e boas práticas) para uma nota mais completa.
4. **Priorização** — classifica cada oportunidade em alta/média/baixa
   prioridade, com base na gravidade comprovada dos problemas e na confiança
   da conclusão.
5. **Exportação** — gera um CSV (separado por `;`, com acentuação correta)
   pronto para abrir no Excel ou Google Sheets.

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A aplicação funciona
sem nenhuma chave de API — a busca usa apenas o OpenStreetMap.

## Configuração opcional (chaves de API)

Copie `.env.local.example` para `.env.local` e preencha o que quiser usar:

- `GOOGLE_PLACES_API_KEY` — amplia a busca de empresas com a Places API (New)
  do Google. **Tem custo** acima da cota gratuita do Google Cloud; configure
  limites de orçamento no Console antes de usar em produção.
- `GOOGLE_PAGESPEED_API_KEY` — ativa a avaliação de desempenho/SEO real via
  PageSpeed Insights. Gratuita até 25.000 requisições/dia.

Sem essas chaves, a ferramenta funciona normalmente, mas informa claramente
na interface que a cobertura/avaliação pode estar incompleta.

## Limitações conhecidas (importante)

- **Cobertura depende do OpenStreetMap.** Nem toda empresa real está
  cadastrada lá. A interface mostra quantas empresas foram encontradas e
  avisa quando a cobertura pode estar incompleta.
- **Verificação de site é feita só na homepage**, não em todas as páginas do
  site. Por isso não detectamos "links quebrados em qualquer página", apenas
  problemas visíveis na página inicial.
- **"Sem site detectado" não é garantia.** Pode haver um site com domínio não
  previsível que a checagem automática não encontrou. O status sempre vem
  acompanhado do nível de confiança da conclusão.
- A API pública do Overpass pode ser lenta (buscas com "todos os segmentos"
  em cidades grandes podem levar dezenas de segundos). Para produção com
  volume alto, considere hospedar uma instância própria do Overpass ou usar
  a Places API do Google.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui, com SQLite
local (`better-sqlite3`) para guardar o histórico de buscas e permitir a
exportação em CSV.
