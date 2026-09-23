import type { Preview } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import { I18nProvider, type Locale } from "@godzilla/i18n";
import "./preview.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Falha o build do Storybook (CI) em violações — não só um aviso no painel.
      test: "error",
    },
  },
  globalTypes: {
    locale: {
      description: "Locale do Design System",
      defaultValue: "pt-BR" satisfies Locale,
      toolbar: {
        icon: "globe",
        items: [
          { value: "pt-BR", title: "Português (BR)" },
          { value: "en-US", title: "English (US)" },
          { value: "es-ES", title: "Español (ES)" },
        ],
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
    (Story, context) => (
      <I18nProvider locale={context.globals.locale as Locale}>
        <Story />
      </I18nProvider>
    ),
  ],
};

export default preview;
