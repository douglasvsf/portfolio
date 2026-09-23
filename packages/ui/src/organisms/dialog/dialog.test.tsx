import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "../../test/test-utils";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog";
import { Button } from "../../atoms/button/button";

function TestDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Excluir conta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir conta</DialogTitle>
          <DialogDescription>Essa ação não pode ser desfeita.</DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("abre ao clicar no trigger e expõe role='dialog' com título acessível", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestDialog />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Excluir conta" }));

    const dialog = await screen.findByRole("dialog", { name: "Excluir conta" });
    expect(dialog).toBeInTheDocument();
  });

  it("move o foco para dentro do diálogo ao abrir (focus trap)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestDialog />);

    await user.click(screen.getByRole("button", { name: "Excluir conta" }));
    const dialog = await screen.findByRole("dialog");

    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it("fecha ao pressionar Escape e devolve o foco ao trigger", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestDialog />);

    const trigger = screen.getByRole("button", { name: "Excluir conta" });
    await user.click(trigger);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("fecha ao clicar no botão de fechar (X) e no DialogClose", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestDialog />);

    await user.click(screen.getByRole("button", { name: "Excluir conta" }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("não possui violações de acessibilidade quando aberto", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestDialog />);
    await user.click(screen.getByRole("button", { name: "Excluir conta" }));
    const dialog = await screen.findByRole("dialog");

    expect(await axe(dialog)).toHaveNoViolations();
  });
});
