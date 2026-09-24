import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

// Interface do Storybook com a identidade do site (escuro + verde neon).
addons.setConfig({
  theme: create({
    base: "dark",
    brandTitle: "GODZILLA.DEV · Design System",
    // Publicado em /design-system no mesmo domínio: o logo volta para o site.
    brandUrl: "/",
    brandTarget: "_self",
    colorPrimary: "#a6ff3d",
    colorSecondary: "#a6ff3d",
    appBg: "#08090a",
    appContentBg: "#111316",
    appPreviewBg: "#08090a",
    appBorderColor: "#2a2d33",
    barBg: "#111316",
    barSelectedColor: "#a6ff3d",
    textColor: "#e7e9ec",
    textMutedColor: "#9aa0a8",
    fontBase: "ui-sans-serif, system-ui, sans-serif",
    fontCode: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  }),
});
