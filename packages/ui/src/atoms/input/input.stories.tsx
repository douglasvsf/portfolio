import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "Atoms/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { placeholder: "seu@email.com" },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: (args) => <Input {...args} className="w-72" />,
};

export const States: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <Input placeholder="default" />
      <Input placeholder="disabled" disabled />
      <Input defaultValue="readonly" readOnly />
      <Input placeholder="inválido" invalid defaultValue="valor incorreto" />
    </div>
  ),
};

export const WithValue: Story = {
  args: { defaultValue: "douglas@example.com" },
  render: (args) => <Input {...args} className="w-72" />,
};
