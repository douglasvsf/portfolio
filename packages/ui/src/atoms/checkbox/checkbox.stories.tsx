import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox } from "./checkbox";
import { Label } from "../label/label";

const meta: Meta<typeof Checkbox> = {
  title: "Atoms/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Aceito os termos de uso</Label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="checked" defaultChecked />
      <Label htmlFor="checked">Marcado por padrão</Label>
    </div>
  ),
};

export const Indeterminate: Story = {
  render: () => {
    function IndeterminateDemo() {
      const [checked, setChecked] = useState<boolean | "indeterminate">("indeterminate");
      return (
        <div className="flex items-center gap-2">
          <Checkbox id="indeterminate" checked={checked} onCheckedChange={setChecked} />
          <Label htmlFor="indeterminate">Selecionar todos (parcial)</Label>
        </div>
      );
    }
    return <IndeterminateDemo />;
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="disabled-unchecked" disabled />
        <Label htmlFor="disabled-unchecked">Desabilitado (desmarcado)</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked">Desabilitado (marcado)</Label>
      </div>
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="invalid" invalid />
      <Label htmlFor="invalid">Campo obrigatório não marcado</Label>
    </div>
  ),
};
