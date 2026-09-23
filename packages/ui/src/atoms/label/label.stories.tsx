import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./label";
import { Input } from "../input/input";

const meta: Meta<typeof Label> = {
  title: "Atoms/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: { children: "E-mail" },
};

export const AssociatedWithInput: Story = {
  name: "Associado a um Input (htmlFor)",
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="email-story">E-mail</Label>
      <Input id="email-story" placeholder="seu@email.com" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <input type="checkbox" id="terms-story" disabled className="peer" />
      <Label htmlFor="terms-story">Aceito os termos (peer disabled)</Label>
    </div>
  ),
};
