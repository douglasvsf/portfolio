import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "../../test/test-utils";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";

function TestSheet() {
  return (
    <Sheet>
      <SheetTrigger>Abrir menu</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Navegação</SheetTitle>
          <SheetDescription>Seções do site</SheetDescription>
        </SheetHeader>
        <nav>
          <SheetClose asChild>
            <a href="#sobre">Sobre</a>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

describe("Sheet", () => {
  it("abre pelo trigger como dialog com título acessível", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestSheet />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(screen.getByRole("dialog", { name: "Navegação" })).toBeInTheDocument();
  });

  it("fecha pelo botão X (rótulo traduzido), por Esc e ao clicar num link", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestSheet />);

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    await user.click(screen.getByRole("link", { name: "Sobre" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("não tem violações de acessibilidade aberto", async () => {
    const user = userEvent.setup();
    const { baseElement } = renderWithProviders(<TestSheet />);
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(await axe(baseElement)).toHaveNoViolations();
  });
});
