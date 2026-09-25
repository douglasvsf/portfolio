import { Fragment } from "react";
import { ArrowDown } from "@godzilla/icons";
import { cn } from "@godzilla/ui";
import { Stagger, StaggerItem } from "@/components/motion/motion";
import type { ArchitectureNode } from "@/content/projects";

/**
 * Diagrama de arquitetura em CSS puro (sem biblioteca de gráficos): caixas em
 * fonte mono ligadas por setas. O sistema substituído aparece tracejado e
 * esmaecido. Lista ordenada: o leitor de tela anuncia a sequência.
 */
export function ProjectArchitecture({ nodes }: { nodes: ArchitectureNode[] }) {
  return (
    <Stagger as="ol" stagger={0.08} className="flex max-w-md flex-col items-stretch">
      {nodes.map((node, index) => (
        <Fragment key={node.label}>
          {index > 0 && (
            <li aria-hidden="true" className="flex justify-center py-1.5 text-primary">
              <ArrowDown className="size-(--size-icon-sm)" />
            </li>
          )}
          <StaggerItem
            as="li"
            className={cn(
              "rounded-md border px-4 py-3 font-mono",
              node.legacy ? "border-dashed border-input text-muted-foreground" : "border-border bg-card",
            )}
          >
            <span className={cn("block text-body-sm font-semibold", !node.legacy && "text-foreground")}>{node.label}</span>
            {node.detail && <span className="block text-caption text-muted-foreground">{node.detail}</span>}
          </StaggerItem>
        </Fragment>
      ))}
    </Stagger>
  );
}
