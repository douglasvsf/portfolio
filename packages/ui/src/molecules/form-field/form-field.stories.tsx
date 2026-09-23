import type { Meta, StoryObj } from "@storybook/react";
import { FormField } from "./form-field";
import { Input } from "../../atoms/input/input";

const meta: Meta<typeof FormField> = {
  title: "Molecules/FormField",
  component: FormField,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Nome completo">
        <Input placeholder="Douglas Vinicius" />
      </FormField>
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="E-mail" required description="Usaremos apenas para contato.">
        <Input type="email" placeholder="seu@email.com" />
      </FormField>
    </div>
  ),
};

export const Optional: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Empresa" optional>
        <Input placeholder="Opcional" />
      </FormField>
    </div>
  ),
};

export const ErrorState: Story = {
  name: "Error",
  render: () => (
    <div className="w-80">
      <FormField label="E-mail" required error="Informe um e-mail válido.">
        <Input type="email" defaultValue="douglas@" />
      </FormField>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="ID do usuário" description="Gerado automaticamente.">
        <Input defaultValue="usr_a1b2c3" disabled />
      </FormField>
    </div>
  ),
};
