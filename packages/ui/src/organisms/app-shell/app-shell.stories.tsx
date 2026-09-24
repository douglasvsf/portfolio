import type { Meta, StoryObj } from "@storybook/react";
import { AppBrand, AppFooter, AppHeader, appContainerClassName, appNavLinkClassName } from "./app-shell";
import { Badge } from "../../atoms/badge/badge";

const meta: Meta<typeof AppHeader> = {
  title: "Organisms/AppShell",
  component: AppHeader,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof AppHeader>;

const nav = (
  <nav className="hidden gap-6 font-mono text-body-sm text-muted-foreground md:flex">
    {["Sobre", "Projetos", "Contato"].map((label) => (
      <a key={label} href={`#${label.toLowerCase()}`} className={appNavLinkClassName}>
        {label}
      </a>
    ))}
  </nav>
);

export const Default: Story = {
  name: "Header + conteúdo + footer",
  render: () => (
    <div className="flex min-h-[420px] flex-col">
      <AppHeader brand={<AppBrand href="#content">GODZILLA.DEV</AppBrand>} nav={nav} skipToContent={{ label: "Pular para o conteúdo" }} />
      <main id="content" className={`${appContainerClassName} flex-1 py-8 text-muted-foreground`}>
        Conteúdo alinhado com header e footer (mesmo container).
      </main>
      <AppFooter
        aside={
          <a href="#content" className={appNavLinkClassName}>
            Design System
          </a>
        }
      >
        © 2026 Douglas Szapak. Todos os direitos reservados.
      </AppFooter>
    </div>
  ),
};

export const SystemVariant: Story = {
  name: "Caso real — sistema embutido",
  render: () => (
    <AppHeader
      brand={
        <AppBrand href="#content">
          <span>
            KAIJU<span className="text-primary">/STOCKS</span>
          </span>
        </AppBrand>
      }
      actions={
        <div className="flex items-center gap-3 font-mono text-body-sm text-muted-foreground">
          <Badge variant="outline">Demo</Badge>
          <a href="#content" className={appNavLinkClassName}>
            ← Portfólio
          </a>
        </div>
      }
    />
  ),
};
