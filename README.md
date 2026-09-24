# Godzilla — Portfolio

Portfolio pessoal full stack, com identidade visual dark/tecnológica inspirada em
kaiju. Este repositório é a base do projeto: frontend e backend funcionando
localmente, prontos para evoluir.

> Estágio atual: fundação do projeto — estrutura, identidade visual, testes
> (Jest + Cypress) e o conteúdo da homepage (skills, projetos, experiência)
> persistido em MongoDB e servido pela API — mais um Design System interno
> completo (`@godzilla/ui`: Atomic Design, tokens, dark mode, i18n, a11y,
> Storybook) construído no mesmo monorepo, ainda não consumido pela homepage.
> Sem autenticação, painel admin ou outras funcionalidades de negócio ainda —
> isso vem em etapas futuras.

## Stack

**Monorepo**

- [pnpm workspaces](https://pnpm.io/workspaces)
- TypeScript em todos os pacotes

**Frontend** (`apps/web`)

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- ESLint

**Backend** (`apps/api`)

- NestJS 11
- Node.js + TypeScript
- API REST
- MongoDB + Mongoose (`@nestjs/mongoose`)

**Kaiju Stocks** (`apps/web` → rota `/stocks`)

- Sistema embutido no site, publicado no mesmo deploy (como o `/design-system`): `localhost:3000/stocks`
- Consome `@godzilla/ui` (Card, Table, Chart, Badge, SearchInput); layout raiz próprio em `src/app/stocks/`
- Cotações via [brapi](https://brapi.dev), buscadas no servidor com cache de 5 min
- Gráficos com Recharts, através do `Chart` do Design System (padrão shadcn/ui)
- Sem `BRAPI_TOKEN` a listagem funciona inteira, mas o histórico só sai para PETR4, VALE3, ITUB4 e MGLU3 — token grátis em brapi.dev (ver `apps/web/.env.example`)

**Banco de dados**

- MongoDB, rodando localmente via Docker Compose

**Compartilhado** (`packages/shared`)

- Tipos TypeScript usados tanto pelo frontend quanto pelo backend

**Design System** (`packages/ui` + `packages/tokens` + `packages/icons` + `packages/i18n`)

- `@godzilla/ui` — biblioteca de componentes (Atomic Design), consumida pela homepage e documentada no Storybook — ver [Design System (`@godzilla/ui`)](#design-system-godzillaui)
- Turborepo orquestra build/lint/test/typecheck de todos os pacotes do monorepo

## Estrutura do monorepo

```
.
├── apps/
│   ├── web/              # Frontend Next.js
│   │   ├── cypress/
│   │   │   ├── e2e/            # Specs de E2E (fluxos do usuário)
│   │   │   ├── fixtures/       # Dados de apoio para os testes (quando houver)
│   │   │   └── support/        # Setup global do Cypress
│   │   ├── src/
│   │   │   ├── app/            # Rotas (App Router): [lang]/ (portfólio) e stocks/ (Kaiju Stocks)
│   │   │   ├── components/     # Componentes de UI, layout e seções
│   │   │   └── lib/            # Integração com a API (com teste unitário)
│   │   ├── jest.config.ts
│   │   ├── cypress.config.ts
│   │   └── .env.example
│   │
│   ├── api/                # Backend NestJS
│   │   ├── src/
│   │   │   ├── health/         # Módulo de health check (com teste unitário)
│   │   │   ├── skills/         # Módulo skills (Mongoose)
│   │   │   ├── projects/       # Módulo projects (Mongoose)
│   │   │   ├── experience/     # Módulo experience (Mongoose)
│   │   │   ├── seed.ts         # Popula o MongoDB com o conteúdo da homepage
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── .env.example
│   │
│   ├── storybook/          # Documentação viva do Design System
│   │   └── .storybook/         # main.ts, preview.tsx (tema, i18n, a11y)
│   │
│   └── playground/         # App Vite consumindo @godzilla/ui como um projeto externo
│       └── src/
│
├── packages/
│   ├── shared/             # Tipos compartilhados (HealthResponse, SkillGroup, Project, ExperienceItem)
│   ├── ui/                 # @godzilla/ui — biblioteca de componentes (Atomic Design)
│   │   └── src/
│   │       ├── atoms/          # Button, Input, Label, Checkbox, Switch, Badge, Avatar, Spinner, Separator, Typography
│   │       ├── molecules/      # FormField, SearchInput
│   │       ├── organisms/      # Card, Chart (Recharts), Dialog, Table, Tabs, Toast
│   │       ├── theme/          # ThemeProvider (light/dark/system)
│   │       ├── lib/            # cn() (clsx + tailwind-merge)
│   │       └── styles/         # globals.css (importa os tokens)
│   ├── tokens/             # @godzilla/tokens — design tokens (CSS vars + TS)
│   ├── icons/              # @godzilla/icons — reexport curado de lucide-react
│   ├── i18n/                # @godzilla/i18n — pt-BR / en-US / es-ES
│   ├── eslint-config/      # @godzilla/eslint-config — flat config compartilhada
│   └── typescript-config/  # @godzilla/typescript-config — tsconfigs base
│
├── .github/workflows/ci.yml  # install → lint → typecheck → test → build
├── docker-compose.yml     # MongoDB para desenvolvimento local
├── package.json           # Scripts raiz do monorepo
├── turbo.json              # Pipeline do Turborepo (build/dev/lint/test/typecheck)
├── pnpm-workspace.yaml
├── tsconfig.json           # tsconfig base, estendido pelos pacotes
└── README.md
```

## Pré-requisitos

- Node.js 20+
- pnpm 9+ (`corepack enable` habilita a versão correta automaticamente)

## Instalação

```bash
pnpm install
```

## Variáveis de ambiente

Cada app tem um `.env.example` com as variáveis necessárias. Copie para `.env.local`
(web) ou `.env` (api) e ajuste se necessário.

**`apps/web/.env.example`**

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**`apps/api/.env.example`**

```
API_PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/portfolio
```

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

> No Windows, use `127.0.0.1` em vez de `localhost` na `MONGODB_URI` — o driver
> do MongoDB pode tentar resolver `localhost` como IPv6 (`::1`) e falhar ao
> conectar na porta publicada pelo Docker.

## Banco de dados (MongoDB)

O conteúdo da homepage (skills, projetos, experiência) é servido pela API a
partir do MongoDB — não é mais conteúdo estático no frontend.

Suba o banco localmente com Docker:

```bash
pnpm docker:up      # inicia o MongoDB (docker compose up -d)
pnpm seed           # popula skills, projects e experience com o conteúdo atual
pnpm docker:down    # para o container quando terminar
```

O seed (`apps/api/src/seed.ts`) apaga e recria as três coleções com os dados
definidos no próprio script — é a fonte da verdade do conteúdo hoje. Rode-o
sempre que quiser resetar o banco para esse estado conhecido.

## Executando localmente

Com o MongoDB no ar (`pnpm docker:up` + `pnpm seed`, uma vez), rode frontend e
backend juntos a partir da raiz:

```bash
pnpm dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001](http://localhost:3001)

Rodar separadamente, se preferir:

```bash
pnpm dev:web   # apenas o frontend, porta 3000
pnpm dev:api   # apenas o backend, porta 3001
```

O frontend não quebra se a API ou o MongoDB estiverem fora do ar: as seções
dinâmicas (skills, projetos, experiência) simplesmente renderizam vazias nesse
caso — ver [Decisões arquiteturais](#decisões-arquiteturais).

### Testando a integração

A homepage exibe um indicador de status da API no rodapé, obtido via
`GET /health`. Com os dois serviços rodando, ele deve mostrar **"API online"**.

Testar a API diretamente:

```bash
curl http://localhost:3001/health
# {"status":"ok"}
```

## Build

```bash
pnpm build
```

`turbo run build` builda todo o monorepo respeitando as dependências entre
pacotes (`packages/shared`, `packages/tokens/icons/i18n/ui`, depois
`apps/web`, `apps/api`, `apps/storybook`). Para buildar só uma parte:

```bash
pnpm --filter web build
pnpm storybook:build     # equivalente a: turbo run build --filter=storybook
```

## Lint / Typecheck

```bash
pnpm lint         # turbo run lint — eslint em todos os pacotes
pnpm typecheck     # turbo run typecheck — tsc --noEmit em todos os pacotes
```

## Design System (`@godzilla/ui`)

Design System interno completo — Atomic Design, tokens, dark mode, i18n
(pt-BR/en-US/es-ES) e acessibilidade WAI-ARIA — construído dentro deste
mesmo monorepo para ser reutilizável por qualquer app futura, não só o
`apps/web` atual (que, por enquanto, ainda não o consome — ver
[Próximos passos](#próximos-passos-do-design-system)).

### Arquitetura e decisões

- **Turborepo + pnpm workspaces**, não apenas pnpm puro: com 5 pacotes novos
  (`ui`, `tokens`, `icons`, `i18n` + 2 pacotes de config) somados aos 3
  originais, orquestrar build/lint/test/typecheck manualmente já não escala.
  O `turbo.json` declara as dependências entre tasks (`build` depende do
  `^build` das dependências) e cacheia localmente — rebuilds incrementais
  ficam quase instantâneos.
- **`packages/ui` distribuído como código-fonte**, sem passo de build (tsup,
  etc.): como o pacote só é consumido *dentro* deste monorepo (não é
  publicado no npm), cada app consumidora (Next.js, Vite) já transpila
  TypeScript/TSX de pacotes do workspace nativamente. Isso elimina uma classe
  inteira de bugs de "esqueci de rodar o build do pacote" e mantém HMR
  funcionando através dos pacotes. O script `build` de cada pacote roda
  `tsc --noEmit` — funciona como gate de qualidade (e como task do Turbo),
  não como geração de artefato.
- **Tailwind CSS v4** (CSS-first, `@theme`), igual ao `apps/web`: os tokens
  em `packages/tokens/src/theme.css` definem `:root`/`.dark` com as CSS
  variables e um bloco `@theme inline` que mapeia cada uma para um namespace
  do Tailwind (`--color-primary` → `bg-primary`/`text-primary`, `--text-h1` →
  `text-h1`, etc.) — o mesmo padrão usado pelo shadcn/ui v4. Como o Tailwind
  v4 não escaneia `node_modules` por padrão, cada app consumidora precisa de
  um `@source "<path>/packages/ui/src/**/*.{ts,tsx}";` no próprio CSS (ver
  [Consumindo o Design System](#consumindo-o-design-system)).
- **shadcn/ui como referência, não como cópia**: os componentes seguem a
  mesma filosofia (Radix primitives + CVA + Tailwind + `cn()`), mas
  organizados por Atomic Design (não por um diretório `components/ui` plano)
  e com i18n interno de fábrica — algo que o shadcn/ui não tem, já que ele é
  pensado para ser copiado dentro de um único app.
- **Vitest + Testing Library + `vitest-axe`** para `packages/ui` (não Jest,
  como `apps/web`/`apps/api`): Vitest compartilha o mesmo motor (Vite) usado
  pelo Storybook e pelo `playground`, então a configuração de CSS/aliases não
  precisa ser duplicada em duas ferramentas diferentes — e é consistente com
  a decisão já registrada no README de configurar testes por pacote, não na
  raiz.
- **i18n com Context/Provider própria**, não `react-i18next`: o vocabulário
  interno dos componentes é pequeno e fixo (~14 strings — "Fechar",
  "Próximo", "Nenhum resultado encontrado", etc.), então uma biblioteca de
  i18n completa seria peso morto. `@godzilla/i18n` é só um `Record<Locale,
  Dictionary>` + Context — trivial de auditar e de estender.
- **Toast via `@radix-ui/react-toast`**, não a lib `sonner`: mantém a
  filosofia "primitives Radix bem tipados" consistente em todos os
  organisms, em vez de misturar duas fontes diferentes de comportamento de
  acessibilidade/animação.

### Atomic Design

```
packages/ui/src/
├── atoms/       Button, Input, Label, Checkbox, Switch, Badge, Avatar,
│                Spinner, Separator, Typography
├── molecules/   FormField (Label + controle + description/erro, com toda a
│                fiação de aria-describedby/aria-invalid automática),
│                SearchInput
├── organisms/   Card, Dialog, Tabs, Toast (+ Toaster/useToast)
├── theme/       ThemeProvider / useTheme (light/dark/system)
├── lib/         cn() — clsx + tailwind-merge
└── styles/      globals.css (importa @godzilla/tokens/theme.css)
```

Cada componente vive na própria pasta (`button/button.tsx`,
`button.stories.tsx`, `button.test.tsx`, `index.ts`) — nunca um arquivo
gigante com múltiplos componentes. `Templates` e `Pages` (AuthLayout,
DashboardLayout, telas de exemplo) não foram implementados nesta rodada por
escopo — ver [Próximos passos](#próximos-passos-do-design-system).

### Design Tokens

`packages/tokens/src/theme.css` é a fonte única de verdade visual: cores
(`--background`, `--primary`, `--destructive`, `--success`...), tipografia
(`--text-display` até `--text-overline`), radius, z-index semântico
(`--z-modal`, `--z-toast`...), transições e tamanhos de controle/ícone. Nenhum
componente usa cor, tamanho de fonte ou espaçamento cru — sempre a
utility/token correspondente (`bg-primary`, `text-h2`, `rounded-lg`). O mesmo
arquivo tem um espelho em TypeScript (`packages/tokens/src/index.ts`) para
lógica JS que precisa dos valores (breakpoints para `matchMedia`, z-index em
cálculos, etc.).

### Tipografia

```tsx
<Typography variant="display">Título de destaque</Typography>
<Typography variant="h1">Dashboard</Typography>
<Typography variant="body">Texto padrão.</Typography>
<Typography variant="caption">Legenda</Typography>
```

Escala completa: `display`, `h1`–`h4`, `body-lg`, `body`, `body-sm`,
`caption`, `label`, `overline`. Cada variante já define elemento semântico
padrão (`h1`→`<h1>`, `body`→`<p>`, `caption`→`<span>`), sobrescrevível com
`as` (estilo de uma variante, semântica de outra) ou `asChild` (via Radix
Slot).

### Dark mode

```tsx
import { ThemeProvider, useTheme } from "@godzilla/ui";

<ThemeProvider defaultTheme="system">
  <App />
</ThemeProvider>;

const { resolvedTheme, toggleTheme } = useTheme();
```

`ThemeProvider` alterna a classe `.dark` em `<html>` (persistida em
`localStorage`) — é essa classe que ativa o bloco `.dark { --background: ...
}` em `theme.css`. Para apps com SSR (Next.js), injete `themeInitScript`
(exportado por `@godzilla/ui`) num `<script>` no `<head>` para aplicar o tema
salvo antes da hidratação e evitar flash de tema errado.

### Acessibilidade

Todo componente interativo é construído sobre um primitive Radix
(`@radix-ui/react-*`) — focus trap e devolução de foco no `Dialog`,
navegação por setas nas `Tabs`, `aria-checked="mixed"` no `Checkbox`
indeterminado, etc. — em vez de reimplementar esses padrões manualmente.
`FormField` gera `id`/`aria-describedby`/`aria-invalid`/`aria-required`
automaticamente a partir do `error`/`description`/`required` passados. O
addon `@storybook/addon-a11y` roda axe-core em cada story (`a11y.test:
"error"` — falha o build do Storybook em violações), e os testes mais
importantes (`Button`, `Checkbox`, `FormField`, `Dialog`, `Tabs`) têm
asserções de teclado e um teste de `vitest-axe` cada.

### Internacionalização

```tsx
import { I18nProvider } from "@godzilla/ui";

<I18nProvider locale="en-US">
  <App />
</I18nProvider>;
```

Fora de um `I18nProvider`, os componentes caem no locale padrão (`pt-BR`) em
vez de quebrar — importante porque `@godzilla/ui` precisa funcionar mesmo em
apps que ainda não configuraram i18n. Locales disponíveis: `pt-BR`, `en-US`,
`es-ES` (`packages/i18n/src/locales/*.ts`).

**Adicionar um novo idioma** (ex.: `fr-FR`):

1. Criar `packages/i18n/src/locales/fr-FR.ts` implementando a interface
   `Dictionary` (as ~14 strings: `loading`, `next`, `previous`, `search`,
   `cancel`, `confirm`, `close`, `noResults`, `select`, `clear`, `required`,
   `optional`, `error`, `retry`).
2. Adicionar `"fr-FR"` ao array `locales` em `packages/i18n/src/dictionary.ts`.
3. Registrar no mapa `dictionaries` em `packages/i18n/src/context.tsx`.

Nenhuma outra mudança é necessária — todo componente que usa `useTranslation()`
passa a suportar o novo locale automaticamente.

### Storybook

```bash
pnpm storybook          # dev, em http://localhost:6006
pnpm storybook:build    # build estático (storybook-static/)
```

Cada componente tem sua própria `*.stories.tsx` ao lado do componente
(convenção: `Default`, variantes, tamanhos, estados — `disabled`, `loading`,
erro — e, quando relevante, um caso de uso real). A toolbar do Storybook
troca tema (light/dark, via `@storybook/addon-themes`) e locale (pt-BR/en-US/
es-ES, via um `globalType` customizado) sem precisar editar a story. O painel
"Accessibility" (`@storybook/addon-a11y`) audita cada story com axe-core.

### Testes

```bash
pnpm --filter @godzilla/ui test         # roda uma vez
pnpm --filter @godzilla/ui test:watch   # modo watch
```

Vitest + Testing Library + `vitest-axe`, cobrindo os componentes mais
críticos (`Button`, `Checkbox`, `FormField`, `Dialog`, `Tabs`): renderização,
variantes, eventos, estados (disabled/loading/indeterminate), navegação por
teclado (Tab/Enter/Espaço/Setas/Escape) e zero violações de acessibilidade
via axe. Os demais componentes (puramente apresentacionais — `Badge`,
`Avatar`, `Separator`...) têm story mas não teste dedicado, pelo mesmo
critério já documentado para o restante do projeto: teste o que tem
comportamento, não o que é só marcação.

### Consumindo o Design System

```bash
pnpm --filter <sua-app> add @godzilla/ui workspace:*
```

No CSS da app (ex.: `globals.css`), importe os estilos do pacote e diga ao
Tailwind onde encontrar as classes usadas pelos componentes (necessário
porque `@godzilla/ui` fica fora do diretório da app):

```css
@import "tailwindcss";
@import "@godzilla/ui/styles.css";
@source "../../../packages/ui/src/**/*.{ts,tsx}"; /* ajuste o path relativo */
```

E use os componentes normalmente:

```tsx
import { Button, Card, Input, Dialog, FormField, ThemeProvider, I18nProvider } from "@godzilla/ui";

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider locale="pt-BR">
        <Button variant="destructive" size="sm">
          Excluir
        </Button>
      </I18nProvider>
    </ThemeProvider>
  );
}
```

`apps/playground` (Vite + React puro, sem nenhuma dependência de Next.js) é
exatamente essa configuração já funcionando — prova de que o pacote está de
fato desacoplado:

```bash
pnpm playground   # http://localhost:5173
```

### Criando um novo componente

1. Decida o nível de Atomic Design (`atoms`/`molecules`/`organisms`) e crie
   `packages/ui/src/<nível>/<nome>/`.
2. `<nome>.tsx` — use um primitive Radix quando o componente tiver estado ou
   comportamento de teclado/foco não trivial; use tokens (`bg-primary`,
   `text-h4`, etc.) via `cn()`, nunca valores soltos; use CVA
   (`class-variance-authority`) para variantes/tamanhos, seguindo o padrão de
   `button.tsx`; puxe strings internas de `useTranslation()` (`@godzilla/i18n`)
   em vez de hardcode.
3. `index.ts` — reexporte o componente e seus types.
4. `<nome>.stories.tsx` — pelo menos `Default` + variantes + estados
   relevantes (disabled/loading/erro).
5. `<nome>.test.tsx` (se o componente tiver comportamento, não só marcação) —
   renderização, eventos, teclado, `vitest-axe`.
6. Reexporte em `packages/ui/src/index.ts`.

### Próximos passos do Design System

Fora do escopo desta rodada (o pedido original cobria ~40 componentes,
Templates e Pages completas; priorizou-se profundidade — qualidade total —
em vez de amplitude total):

- Mais componentes (`Textarea`, `Select`, `Combobox`, `DatePicker`,
  `Accordion`, `Tooltip`, `Popover`, `DataTable`, `Sheet`, `Command`,
  `Breadcrumb`, `Pagination`...), seguindo exatamente o padrão acima.
- `templates/` (`AuthLayout`, `DashboardLayout`, `AdminLayout`, `ErrorLayout`)
  e `pages/` de exemplo (Login, Dashboard, 404) no Storybook.
- Migrar `apps/web` para consumir `@godzilla/ui` nas seções da homepage
  (hoje elas têm estilos próprios, anteriores ao Design System).
- Changesets (versionamento) caso o pacote passe a ser publicado fora deste
  monorepo no futuro.

## Estratégia de testes

Dois níveis, cada um com uma responsabilidade clara:

```
Jest    → unitários / regras de negócio / services / utilitários (isolado, rápido)
Cypress → fluxos reais do usuário na interface (navegador, ponta a ponta)
```

Não existe (nem deve existir) sobreposição entre os dois: o que já é validado de
forma isolada pelo Jest não é reexaminado pelo Cypress, e vice-versa. A suíte é
propositalmente pequena — prioriza testes que agregam valor real, não cobertura
por cobertura.

### Jest — testes unitários

- **`apps/api/src/health/health.controller.spec.ts`** — verifica que
  `GET /health` retorna `{ status: "ok" }`. É a única regra de negócio que existe
  hoje no backend; novos módulos (quando criados com lógica real) devem seguir o
  mesmo padrão, com o `.spec.ts` ao lado do `.service.ts`/`.controller.ts`.
- **`apps/web/src/lib/api.test.ts`** — testa `getHealth()` (sucesso e erro) e
  `getSkills()`/`getProjects()`/`getExperience()`: URL correta chamada e,
  principalmente, que uma falha de rede é engolida e vira lista vazia em vez de
  derrubar a página (fazendo mock de `fetch`, sem rede real). Esse
  comportamento de fallback é a única lógica não-trivial do frontend hoje, por
  isso é o que está coberto.

Os services do backend (`SkillsService`, `ProjectsService`, `ExperienceService`)
não têm `.spec.ts`: são leitura pura (`find().lean()` + seleção de campos), sem
nenhuma regra de negócio a validar — testá-los seria coverage por coverage. O
mesmo vale para os componentes React da homepage, puramente apresentacionais.
Esse tipo de comportamento (renderização, navegação) é responsabilidade do
Cypress.

Executar:

```bash
pnpm test              # roda uma vez em todos os pacotes que têm testes
pnpm test:watch        # modo watch (api + web em paralelo)
pnpm test:coverage     # com relatório de cobertura

# individualmente
pnpm --filter api test
pnpm --filter web test
```

Coverage é gerado normalmente (via `--coverage`), mas **sem threshold mínimo
configurado** — a prioridade é qualidade sobre percentual, e não faz sentido
perseguir número em uma base de código ainda pequena.

### Cypress — testes end-to-end

**`apps/web/cypress/e2e/homepage.cy.ts`** cobre os três fluxos que realmente
existem na homepage hoje:

```
Homepage
  ├── deve carregar corretamente        (hero renderiza: título + subtítulo)
  ├── deve navegar para projetos        (clique no CTA → seção de projetos visível)
  └── deve navegar para contato         (clique no menu → seção de contato visível)
```

Não há testes de formulário de contato (ainda não existe) nem testes repetindo
o que o Jest já garante (ex.: o texto exato retornado pela API). As asserções
verificam apenas a navegação/estrutura (seção correta fica visível), não o
conteúdo dinâmico em si: as seções de skills/projetos/experiência são Server
Components que buscam dados no servidor Next.js durante o SSR — `cy.intercept`
atua na rede do navegador e não enxerga essa chamada, então mockar esse dado no
Cypress não é possível sem infraestrutura extra. Validar que o dado certo saiu
do MongoDB é responsabilidade do Jest (na função de fetch) e da checagem manual
via `pnpm dev` + `pnpm docker:up`. Quando surgirem funcionalidades reais
(formulário, etc.), novos specs devem seguir o mesmo critério: poucos testes,
de alto valor, cobrindo comportamento do usuário.

Executar:

```bash
pnpm test:e2e                     # sobe o Next.js e roda o Cypress headless (start-server-and-test)
pnpm --filter web cypress:open    # abre a interface do Cypress para desenvolvimento dos specs
pnpm --filter web cypress:run     # roda headless contra um servidor já em execução
```

### Preparado para CI (não implementado agora)

A ordem de execução já reflete o pipeline que uma CI (GitHub Actions ou
similar) deveria rodar no futuro:

```
lint → test (unitário) → build → test:e2e
```

Os scripts da raiz (`pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e`) já
funcionam de forma isolada e nessa ordem — falta apenas o workflow do CI em si,
que será adicionado quando fizer sentido.

## Deploy do frontend na Vercel

O backend NestJS **não** é hospedado na Vercel nesta etapa — ele é desacoplado
e deve rodar em outra plataforma (Railway, Render, Fly.io, EC2, etc.) quando
chegar a hora.

Para o frontend:

1. Importe o repositório na Vercel.
2. Em **Project Settings → General → Root Directory**, defina `apps/web`. A
   Vercel detecta automaticamente o `pnpm-workspace.yaml` na raiz e instala as
   dependências do monorepo corretamente.
3. Em **Project Settings → Environment Variables**, adicione:
   - `NEXT_PUBLIC_API_URL` → URL pública da API em produção (ex.:
     `https://api.seu-dominio.com`)
4. Deploy. O framework (Next.js) e o comando de build são detectados
   automaticamente.

## Decisões arquiteturais

- **pnpm workspaces** em vez de Turborepo/Nx: o monorepo tem apenas dois apps e
  um pacote compartilhado — ferramentas de build orquestrado seriam
  overengineering nesta fase.
- **`packages/shared`** existe apenas para tipos (ex.: `HealthResponse`),
  evitando duplicação entre frontend e backend sem introduzir lógica
  compartilhada prematuramente.
- **NestJS sem banco/ORM/auth**: a estrutura modular do Nest (`HealthModule`)
  já deixa claro onde novos módulos entram, sem adicionar infraestrutura que
  ainda não é usada.
- **Tailwind CSS 4** usa configuração via CSS (`@theme` em `globals.css`) em
  vez de `tailwind.config.js` — é o modelo atual do framework.
- **NestJS 11 em vez do 12**: a v12 (recém-lançada) migrou todos os pacotes
  (`@nestjs/core`, `@nestjs/common`, etc.) para ESM puro (`"type": "module"`),
  o que quebra a integração padrão com Jest/ts-jest e exigiria configuração
  experimental (`--experimental-vm-modules`, tsconfig dedicado para ESM) só
  para rodar testes. A v11 é CJS, estável, madura e é o que a documentação
  oficial e o `nest generate` ainda assumem — a escolha mais simples e
  profissional dado que testes automatizados são um requisito.
- **Jest configurado por app, não na raiz**: cada app tem necessidades de
  transform/ambiente diferentes (`ts-jest` + Node no backend,
  `next/jest` no frontend) — configuração compartilhada geraria mais
  acoplamento do que benefício para dois projetos tão distintos.
- **`start-server-and-test`** no `test:e2e` do frontend: evita o passo manual
  de "suba o servidor, depois rode o Cypress" e já deixa o comando pronto para
  rodar sem intervenção em CI.
- **MongoDB via Docker Compose, sem ODM extra além do Mongoose**: `@nestjs/mongoose`
  é a integração oficial do Nest, com `.lean()` + mapeamento explícito de campos
  nos services (não expõe `_id`/`__v` do Mongo na resposta da API). Um único
  serviço no `docker-compose.yml`, sem autenticação — é banco local de
  desenvolvimento, não produção.
- **`getContent()` no frontend nunca lança erro** (`apps/web/src/lib/api.ts`):
  ao contrário de `getHealth()` (que precisa saber se a API está no ar),
  `getSkills`/`getProjects`/`getExperience` engolem falhas de rede e retornam
  lista vazia. Sem isso, `next build`/`pnpm build` quebraria sempre que rodado
  sem o MongoDB/API ativos (CI, ambiente de build da Vercel antes do backend
  existir, etc.) — o backend é deliberadamente desacoplado, então o frontend
  não pode depender dele estar de pé para simplesmente compilar.
- **`seed.ts` como fonte da verdade do conteúdo**, não um script único
  executado uma vez: ele apaga e recria as coleções a cada execução, propositalmente
  simples (sem migrations) porque o conteúdo ainda é editado por código, não por
  um painel admin.
