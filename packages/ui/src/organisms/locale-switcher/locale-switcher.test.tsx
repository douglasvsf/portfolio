import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { renderWithProviders, screen } from "../../test/test-utils";
import { LocaleSwitcher } from "./locale-switcher";

describe("LocaleSwitcher", () => {
  it("renderiza uma bandeira por idioma, marcando a ativa com aria-pressed", () => {
    renderWithProviders(<LocaleSwitcher value="en-US" onValueChange={() => {}} />);

    expect(screen.getByRole("group", { name: "Idioma" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Português" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Español" })).toHaveAttribute("lang", "es-ES");
  });

  it("chama onValueChange com o idioma clicado, mas não com o já ativo", async () => {
    const onValueChange = vi.fn();
    renderWithProviders(<LocaleSwitcher value="pt-BR" onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Português" }));
    expect(onValueChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Español" }));
    expect(onValueChange).toHaveBeenCalledWith("es-ES");
  });

  // Abrir o menu não é testado aqui: o posicionamento do Radix (Popper) leva
  // ~15s por abertura no jsdom. A interação do dropdown fica coberta pelo
  // Storybook (Organisms/LocaleSwitcher > Menu).
  it("variante menu expõe um trigger de menu com o idioma atual", () => {
    renderWithProviders(<LocaleSwitcher variant="menu" value="es-ES" onValueChange={() => {}} />);

    const trigger = screen.getByRole("button", { name: "Idioma: Español" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveTextContent("ES");
  });

  it("não possui violações de acessibilidade", async () => {
    const { container } = renderWithProviders(<LocaleSwitcher value="pt-BR" onValueChange={() => {}} showLabel />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
