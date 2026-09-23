import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "../../test/test-utils";
import { Checkbox } from "./checkbox";
import { Label } from "../label/label";

describe("Checkbox", () => {
  it("renderiza desmarcado por padrão", () => {
    renderWithProviders(<Checkbox aria-label="Aceitar termos" />);
    expect(screen.getByRole("checkbox", { name: "Aceitar termos" })).not.toBeChecked();
  });

  it("alterna ao clicar e reporta via onCheckedChange", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    renderWithProviders(
      <Checkbox aria-label="Aceitar termos" onCheckedChange={onCheckedChange} />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Aceitar termos" });
    await user.click(checkbox);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("alterna via teclado (Espaço)", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    renderWithProviders(
      <Checkbox aria-label="Aceitar termos" onCheckedChange={onCheckedChange} />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Aceitar termos" });
    checkbox.focus();
    await user.keyboard(" ");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("representa o estado indeterminado com aria-checked='mixed'", () => {
    renderWithProviders(<Checkbox aria-label="Selecionar todos" checked="indeterminate" />);
    expect(screen.getByRole("checkbox", { name: "Selecionar todos" })).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
  });

  it("não dispara mudança quando desabilitado", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    renderWithProviders(
      <Checkbox aria-label="Aceitar termos" disabled onCheckedChange={onCheckedChange} />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Aceitar termos" }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("associa corretamente a um <Label> e não possui violações de a11y", async () => {
    const { container } = renderWithProviders(
      <div>
        <Checkbox id="terms" />
        <Label htmlFor="terms">Aceito os termos</Label>
      </div>,
    );

    expect(screen.getByRole("checkbox", { name: "Aceito os termos" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
