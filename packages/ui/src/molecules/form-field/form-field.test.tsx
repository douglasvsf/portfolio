import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { renderWithProviders, screen } from "../../test/test-utils";
import { FormField } from "./form-field";
import { Input } from "../../atoms/input/input";

describe("FormField", () => {
  it("associa o label ao controle via htmlFor/id gerado automaticamente", () => {
    renderWithProviders(
      <FormField label="Nome">
        <Input />
      </FormField>,
    );
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
  });

  it("mostra a description e liga via aria-describedby quando não há erro", () => {
    renderWithProviders(
      <FormField label="E-mail" description="Usaremos para contato">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText("E-mail");
    const description = screen.getByText("Usaremos para contato");
    expect(input).toHaveAttribute("aria-describedby", description.id);
  });

  it("prioriza o erro sobre a description e marca aria-invalid", () => {
    renderWithProviders(
      <FormField label="E-mail" description="Usaremos para contato" error="E-mail inválido">
        <Input />
      </FormField>,
    );
    expect(screen.queryByText("Usaremos para contato")).not.toBeInTheDocument();
    const error = screen.getByRole("alert");
    expect(error).toHaveTextContent("E-mail inválido");

    const input = screen.getByLabelText("E-mail");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);
  });

  it("exibe o indicador de campo obrigatório e aria-required", () => {
    renderWithProviders(
      <FormField label="Nome" required>
        <Input />
      </FormField>,
    );
    expect(screen.getByLabelText(/^Nome/)).toHaveAttribute("aria-required", "true");
    expect(screen.getByText("Obrigatório")).toBeInTheDocument();
  });

  it("não possui violações de acessibilidade", async () => {
    const { container } = renderWithProviders(
      <FormField label="E-mail" required error="E-mail inválido">
        <Input />
      </FormField>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
