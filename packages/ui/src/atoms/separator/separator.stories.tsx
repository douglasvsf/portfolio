import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./separator";

const meta: Meta<typeof Separator> = {
  title: "Atoms/Separator",
  component: Separator,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-72">
      <p className="text-body-sm">Seção 1</p>
      <Separator className="my-3" />
      <p className="text-body-sm">Seção 2</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3">
      <span className="text-body-sm">Perfil</span>
      <Separator orientation="vertical" />
      <span className="text-body-sm">Configurações</span>
      <Separator orientation="vertical" />
      <span className="text-body-sm">Sair</span>
    </div>
  ),
};
