# Godzilla — Portfolio

Portfolio pessoal full stack, com identidade visual dark/tecnológica inspirada em
kaiju. Este repositório é a base do projeto: frontend e backend funcionando
localmente, prontos para evoluir.

> Estágio atual: fundação do projeto (estrutura, integração básica frontend↔API
> e identidade visual). Sem banco de dados, autenticação ou funcionalidades de
> negócio ainda — isso vem em etapas futuras.

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

- NestJS 12
- Node.js + TypeScript
- API REST

**Compartilhado** (`packages/shared`)

- Tipos TypeScript usados tanto pelo frontend quanto pelo backend

## Estrutura do monorepo

```
.
├── apps/
│   ├── web/              # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/            # Rotas (App Router)
│   │   │   ├── components/     # Componentes de UI, layout e seções
│   │   │   ├── data/           # Conteúdo fictício da homepage
│   │   │   └── lib/            # Integração com a API
│   │   └── .env.example
│   │
│   └── api/               # Backend NestJS
│       ├── src/
│       │   ├── health/         # Módulo de health check
│       │   ├── app.module.ts
│       │   └── main.ts
│       └── .env.example
│
├── packages/
│   └── shared/            # Tipos compartilhados (ex.: HealthResponse)
│
├── package.json           # Scripts raiz do monorepo
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
```

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

## Executando localmente

Rodar frontend e backend juntos, a partir da raiz:

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

Builda `packages/shared`, `apps/web` e `apps/api`, nessa ordem (o backend e o
frontend dependem dos tipos compartilhados).

## Lint

```bash
pnpm lint
```

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
