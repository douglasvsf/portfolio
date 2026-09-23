import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

const meta: Meta<typeof Tabs> = {
  title: "Organisms/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList>
        <TabsTrigger value="account">Conta</TabsTrigger>
        <TabsTrigger value="password">Senha</TabsTrigger>
        <TabsTrigger value="disabled" disabled>
          Indisponível
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="text-body-sm text-muted-foreground">
        Atualize as informações da sua conta aqui.
      </TabsContent>
      <TabsContent value="password" className="text-body-sm text-muted-foreground">
        Altere sua senha aqui. Use as setas do teclado para navegar entre as abas.
      </TabsContent>
      <TabsContent value="disabled" className="text-body-sm text-muted-foreground">
        Conteúdo indisponível.
      </TabsContent>
    </Tabs>
  ),
};
