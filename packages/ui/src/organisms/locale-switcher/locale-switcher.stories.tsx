import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { Locale } from "@godzilla/i18n";
import { LocaleSwitcher, type LocaleSwitcherProps } from "./locale-switcher";

function Controlled(args: LocaleSwitcherProps) {
  const [locale, setLocale] = useState<Locale>(args.value);
  return (
    <LocaleSwitcher
      {...args}
      value={locale}
      onValueChange={(next) => {
        setLocale(next);
        args.onValueChange(next);
      }}
    />
  );
}

const meta: Meta<typeof LocaleSwitcher> = {
  title: "Organisms/LocaleSwitcher",
  component: LocaleSwitcher,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    variant: { control: "inline-radio", options: ["flags", "menu"] },
    value: { control: "inline-radio", options: ["pt-BR", "en-US", "es-ES"] },
  },
  args: { value: "pt-BR", variant: "flags", showLabel: false, onValueChange: () => {} },
  render: (args) => <Controlled {...args} />,
};

export default meta;
type Story = StoryObj<typeof LocaleSwitcher>;

export const Flags: Story = {};

export const FlagsWithLabel: Story = { args: { showLabel: true } };

export const Menu: Story = { args: { variant: "menu" } };
