import type { SVGProps } from "react";

/**
 * Bandeiras em SVG inline. Emojis de bandeira (🇧🇷) não renderizam no
 * Windows — aparecem como as letras "BR" — então o Design System desenha as
 * próprias. Proporção 3:2 em todas, para ficarem alinhadas lado a lado.
 */
export interface FlagProps extends SVGProps<SVGSVGElement> {
  /** Texto acessível. Sem ele, a bandeira é decorativa (aria-hidden). */
  title?: string;
}

function FlagSvg({ title, children, ...props }: FlagProps) {
  return (
    <svg
      viewBox="0 0 30 20"
      width={24}
      height={16}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function FlagBR(props: FlagProps) {
  return (
    <FlagSvg {...props}>
      <rect width="30" height="20" fill="#009c3b" />
      <path d="M15 2.2 27.4 10 15 17.8 2.6 10z" fill="#ffdf00" />
      <circle cx="15" cy="10" r="4.6" fill="#002776" />
      <path d="M10.6 9.1c2.9-.4 6.3.2 8.8 1.8l-.3.7c-2.4-1.5-5.6-2.1-8.4-1.7z" fill="#fff" />
    </FlagSvg>
  );
}

export function FlagUS(props: FlagProps) {
  return (
    <FlagSvg {...props}>
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#b22234" />
      ))}
      <rect width="12" height={(7 * 20) / 13} fill="#3c3b6e" />
      {[1.6, 4.4, 7.2].flatMap((y, row) =>
        (row % 2 === 0 ? [1.5, 4.5, 7.5, 10.5] : [3, 6, 9]).map((x) => (
          <circle key={`${x}-${y}`} cx={x} cy={y + (row === 2 ? 1.2 : 0)} r="0.6" fill="#fff" />
        )),
      )}
    </FlagSvg>
  );
}

export function FlagES(props: FlagProps) {
  return (
    <FlagSvg {...props}>
      <rect width="30" height="20" fill="#aa151b" />
      <rect y="5" width="30" height="10" fill="#f1bf00" />
    </FlagSvg>
  );
}
