# Design System (`@godzilla/ui`)

Design System interno completo — Atomic Design, tokens, dark mode, i18n
(pt-BR/en-US/es-ES) e acessibilidade WAI-ARIA — construído dentro deste
mesmo monorepo para ser reutilizável por qualquer app futura, não só o
`apps/web` atual (que, por enquanto, ainda não o consome — ver
[Próximos passos](#próximos-passos-do-design-system)).

## Arquitetura e decisões

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

## Atomic Design

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

## Design Tokens

`packages/tokens/src/theme.css` é a fonte única de verdade visual: cores
(`--background`, `--primary`, `--destructive`, `--success`...), tipografia
(`--text-display` até `--text-overline`), radius, z-index semântico
(`--z-modal`, `--z-toast`...), transições e tamanhos de controle/ícone. Nenhum
componente usa cor, tamanho de fonte ou espaçamento cru — sempre a
utility/token correspondente (`bg-primary`, `text-h2`, `rounded-lg`). O mesmo
arquivo tem um espelho em TypeScript (`packages/tokens/src/index.ts`) para
lógica JS que precisa dos valores (breakpoints para `matchMedia`, z-index em
cálculos, etc.).

## Tipografia

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

## Dark mode

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

## Acessibilidade

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

## Internacionalização

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

## Storybook

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

## Testes

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

## Consumindo o Design System

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

## Criando um novo componente

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

## Próximos passos do Design System

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
