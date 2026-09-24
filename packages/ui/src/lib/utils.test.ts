import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("mantém a cor do texto ao combinar com um tamanho da escala do DS", () => {
    // Regressão: o Lighthouse pegou o botão "Ver projetos" com contraste 1.02:1.
    expect(cn("bg-primary text-primary-foreground", "text-body")).toBe("bg-primary text-primary-foreground text-body");
    expect(cn("text-caption text-success-foreground", "text-body-sm")).toBe("text-success-foreground text-body-sm");
  });

  it("continua resolvendo conflitos do mesmo grupo", () => {
    expect(cn("text-body", "text-body-sm")).toBe("text-body-sm");
    expect(cn("text-muted-foreground", "text-primary")).toBe("text-primary");
    expect(cn("px-2", false && "px-8", "px-4")).toBe("px-4");
  });
});
