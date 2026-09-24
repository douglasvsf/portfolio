import type { Meta, StoryObj } from "@storybook/react";
import { Menu } from "@godzilla/icons";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import { Button } from "../../atoms/button/button";

const meta: Meta<typeof SheetContent> = {
  title: "Organisms/Sheet",
  component: SheetContent,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof SheetContent>;

const links = ["Sobre", "Skills", "Projetos", "Contato"];

export const Default: Story = {
  name: "Caso real — menu mobile",
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Abrir menu">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>GODZILLA.DEV</SheetTitle>
          <SheetDescription>Navegação</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 font-mono">
          {links.map((link) => (
            <SheetClose key={link} asChild>
              <a href={`#${link.toLowerCase()}`} className="rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground">
                {link}
              </a>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  ),
};

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Abrir à esquerda</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Painel lateral esquerdo.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
