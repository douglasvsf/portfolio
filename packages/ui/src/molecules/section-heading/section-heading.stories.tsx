import type { Meta, StoryObj } from "@storybook/react";
import { SectionHeading } from "./section-heading";

const meta: Meta<typeof SectionHeading> = {
  title: "Molecules/SectionHeading",
  component: SectionHeading,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: { as: { control: "inline-radio", options: ["h1", "h2", "h3"] } },
  args: {
    index: "03",
    title: "Projetos",
    description: "Iniciativas que liderei ou das quais fiz parte ao longo da carreira.",
  },
};

export default meta;
type Story = StoryObj<typeof SectionHeading>;

export const Default: Story = {};

export const WithoutIndex: Story = { args: { index: undefined } };

export const TitleOnly: Story = { args: { description: undefined } };
