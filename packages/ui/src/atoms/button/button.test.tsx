import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "../../test/test-utils";
import { Button } from "./button";

describe("Button", () => {
  it("renderiza os children", () => {
    renderWithProviders(<Button>Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("aplica a variante e o tamanho via className", () => {
    renderWithProviders(
      <Button variant="destructive" size="lg">
        Excluir
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Excluir" });
    expect(button.className).toContain("bg-destructive");
    expect(button.className).toContain("text-body");
  });

  it("dispara onClick ao clicar e via teclado (Enter/Espaço)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(<Button onClick={onClick}>Confirmar</Button>);

    const button = screen.getByRole("button", { name: "Confirmar" });
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);

    button.focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(2);

    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("fica desabilitado e não dispara onClick quando loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(
      <Button loading onClick={onClick}>
        Salvando
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Salvando" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("usa a tradução de 'loading' como aria-label quando é icon-only e está carregando", () => {
    renderWithProviders(
      <Button loading size="icon">
        ✓
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Carregando" })).toBeInTheDocument();
  });

  it("com asChild renderiza o filho como raiz, com as classes do botão", () => {
    renderWithProviders(
      <Button asChild variant="outline">
        <a href="#projetos">Ver projetos</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Ver projetos" });
    expect(link).toHaveAttribute("href", "#projetos");
    expect(link.className).toContain("border-input");
  });

  it("não possui violações de acessibilidade (axe)", async () => {
    const { container } = renderWithProviders(<Button>Salvar</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
