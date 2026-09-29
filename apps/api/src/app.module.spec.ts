import { mongoUri } from "./app.module";

describe("MONGODB_URI", () => {
  it("aceita a string do Atlas, tirando aspas, espaços e o nome da variável colados por engano", () => {
    const atlas = "mongodb+srv://user:pass@cluster0.abc.mongodb.net/godzilla-erp?retryWrites=true";
    expect(mongoUri(atlas)).toBe(atlas);
    expect(mongoUri(`  "${atlas}"\n`)).toBe(atlas);
    expect(mongoUri(`MONGODB_URI=${atlas}`)).toBe(atlas);
    expect(mongoUri(`MONGODB_URI="${atlas}"`)).toBe(atlas);
  });

  it("sem variável, usa o Mongo local", () => {
    expect(mongoUri(undefined)).toBe("mongodb://127.0.0.1:27017/portfolio");
  });

  it("valor inválido: erro claro, sem expor a string", () => {
    expect(() => mongoUri("senha-secreta")).toThrow(/MONGODB_URI inválido/);
    expect(() => mongoUri("senha-secreta")).not.toThrow(/senha-secreta/);
  });
});
