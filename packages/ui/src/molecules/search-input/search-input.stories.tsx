import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SearchInput } from "./search-input";

const meta: Meta<typeof SearchInput> = {
  title: "Molecules/SearchInput",
  component: SearchInput,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState("");
      return (
        <SearchInput
          className="w-80"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClear={() => setValue("")}
        />
      );
    }
    return <Demo />;
  },
};

export const WithValue: Story = {
  name: "Com valor (botão de limpar)",
  render: () => {
    function Demo() {
      const [value, setValue] = useState("react");
      return (
        <SearchInput
          className="w-80"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClear={() => setValue("")}
        />
      );
    }
    return <Demo />;
  },
};

export const Disabled: Story = {
  render: () => <SearchInput className="w-80" disabled placeholder="Busca desabilitada" />,
};
