import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "../../test/test-utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

function TestTabs() {
  return (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Conta</TabsTrigger>
        <TabsTrigger value="password">Senha</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Conteúdo da conta</TabsContent>
      <TabsContent value="password">Conteúdo da senha</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("mostra o painel da aba ativa por padrão", () => {
    renderWithProviders(<TestTabs />);
    expect(screen.getByText("Conteúdo da conta")).toBeVisible();
    expect(screen.queryByText("Conteúdo da senha")).not.toBeInTheDocument();
  });

  it("troca de aba ao clicar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestTabs />);

    await user.click(screen.getByRole("tab", { name: "Senha" }));
    expect(screen.getByText("Conteúdo da senha")).toBeVisible();
    expect(screen.getByRole("tab", { name: "Senha" })).toHaveAttribute("aria-selected", "true");
  });

  it("navega entre abas via teclado (setas)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestTabs />);

    const accountTab = screen.getByRole("tab", { name: "Conta" });
    accountTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Senha" })).toHaveFocus();
    expect(screen.getByText("Conteúdo da senha")).toBeVisible();
  });

  it("não possui violações de acessibilidade", async () => {
    const { container } = renderWithProviders(<TestTabs />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
