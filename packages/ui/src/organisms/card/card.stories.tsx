import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";
import { Button } from "../../atoms/button/button";
import { Badge } from "../../atoms/badge/badge";

const meta: Meta<typeof Card> = {
  title: "Organisms/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
        <CardDescription>Gerencie como você recebe alertas.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-muted-foreground">
          Você tem 3 notificações não lidas.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Ver todas</Button>
        <Button size="sm" variant="ghost">
          Marcar como lidas
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const RealWorldUseCase: Story = {
  name: "Caso real — card de projeto",
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Modernização Discovery</CardTitle>
          <Badge variant="success">Concluído</Badge>
        </div>
        <CardDescription>Migração de WordPress/PHP para Next.js e Node.js.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Badge variant="outline">Next.js</Badge>
        <Badge variant="outline">Node.js</Badge>
        <Badge variant="outline">Jest</Badge>
      </CardContent>
    </Card>
  ),
};
