import type { Meta, StoryObj } from "@storybook/react";
import { Check, ArrowRight } from "@godzilla/icons";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Atoms/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
    },
  },
  args: {
    children: "Salvar",
    variant: "default",
    size: "md",
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="default">
        Default
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
      <Button {...args} size="icon" aria-label="Confirmar">
        <Check />
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        Continuar <ArrowRight />
      </>
    ),
  },
};

export const Loading: Story = {
  args: { loading: true, children: "Salvando" },
};

export const LoadingIconOnly: Story = {
  args: { loading: true, size: "icon", children: <Check /> },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const AsChildLink: Story = {
  name: "asChild (renderiza como <a>)",
  render: (args) => (
    <Button {...args} asChild>
      <a href="#projetos">Ver projetos</a>
    </Button>
  ),
};
