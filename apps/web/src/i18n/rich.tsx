import { Fragment } from "react";
import { fmt } from "./message";

/**
 * Renderiza um texto do dicionário com trechos em **negrito**, preenchendo as
 * variáveis antes — assim a tradução controla onde fica a ênfase.
 */
export function RichText({ text, vars = {} }: { text: string; vars?: Record<string, string | number> }) {
  const parts = fmt(text, vars).split("**");
  return (
    <>
      {parts.map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : <Fragment key={index}>{part}</Fragment>))}
    </>
  );
}
