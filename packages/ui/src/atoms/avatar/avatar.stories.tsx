import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

const meta: Meta<typeof Avatar> = {
  title: "Atoms/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/80?img=12" alt="Foto de perfil" />
      <AvatarFallback>DS</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackInitials: Story = {
  name: "Fallback (iniciais)",
  render: () => (
    <Avatar>
      <AvatarImage src="/imagem-inexistente.png" alt="Douglas Szapak" />
      <AvatarFallback>DS</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackIcon: Story = {
  name: "Fallback (ícone genérico)",
  render: () => (
    <Avatar>
      <AvatarFallback />
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar className="size-6">
        <AvatarFallback className="text-caption">DS</AvatarFallback>
      </Avatar>
      <Avatar className="size-10">
        <AvatarFallback>DS</AvatarFallback>
      </Avatar>
      <Avatar className="size-16">
        <AvatarFallback className="text-body-lg">DS</AvatarFallback>
      </Avatar>
    </div>
  ),
};
