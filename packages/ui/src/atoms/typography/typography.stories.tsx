import type { Meta, StoryObj } from "@storybook/react";
import { Typography } from "./typography";

const meta: Meta<typeof Typography> = {
  title: "Atoms/Typography",
  component: Typography,
  tags: ["autodocs"],
  args: { children: "Dashboard" },
};

export default meta;
type Story = StoryObj<typeof Typography>;

export const Default: Story = {};

export const Scale: Story = {
  name: "Escala completa",
  render: () => (
    <div className="flex flex-col gap-4">
      <Typography variant="display">Display</Typography>
      <Typography variant="h1">Heading 1</Typography>
      <Typography variant="h2">Heading 2</Typography>
      <Typography variant="h3">Heading 3</Typography>
      <Typography variant="h4">Heading 4</Typography>
      <Typography variant="body-lg">Body Large — texto de destaque em parágrafos.</Typography>
      <Typography variant="body">Body — texto padrão de parágrafos e conteúdo.</Typography>
      <Typography variant="body-sm">Body Small — texto secundário.</Typography>
      <Typography variant="caption">Caption — legendas e metadados.</Typography>
      <Typography variant="label">Label — rótulos de formulário.</Typography>
      <Typography variant="overline">Overline — categoria / seção</Typography>
    </div>
  ),
};

export const CustomElement: Story = {
  name: "Elemento customizado (as)",
  render: () => (
    <Typography variant="h2" as="h1">
      Estilo de H2, mas semanticamente um H1
    </Typography>
  ),
};
