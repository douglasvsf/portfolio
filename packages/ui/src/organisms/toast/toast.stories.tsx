import type { Meta, StoryObj } from "@storybook/react";
import { Toaster } from "./toaster";
import { toast } from "./use-toast";
import { Button } from "../../atoms/button/button";

const meta: Meta = {
  title: "Organisms/Toast",
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <>
      <Button onClick={() => toast({ title: "Alterações salvas" })}>Mostrar toast</Button>
      <Toaster />
    </>
  ),
};

export const Variants: Story = {
  render: () => (
    <>
      <div className="flex gap-2">
        <Button onClick={() => toast({ title: "Salvo com sucesso", variant: "success" })}>
          Success
        </Button>
        <Button
          variant="destructive"
          onClick={() =>
            toast({ title: "Falha ao salvar", description: "Tente novamente.", variant: "destructive" })
          }
        >
          Destructive
        </Button>
      </div>
      <Toaster />
    </>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <>
      <Button
        onClick={() =>
          toast({
            title: "Convite enviado",
            description: "douglas@example.com receberá um e-mail em instantes.",
          })
        }
      >
        Enviar convite
      </Button>
      <Toaster />
    </>
  ),
};
