// Utilitário de composição de classNames
export { cn } from "./lib/utils";

// Tema (light/dark/system)
export { ThemeProvider, useTheme, themeInitScript, type Theme, type ThemeProviderProps } from "./theme/theme-provider";

// Atoms
export * from "./atoms/button";
export * from "./atoms/input";
export * from "./atoms/label";
export * from "./atoms/checkbox";
export * from "./atoms/switch";
export * from "./atoms/badge";
export * from "./atoms/avatar";
export * from "./atoms/spinner";
export * from "./atoms/separator";
export * from "./atoms/skeleton";
export * from "./atoms/typography";

// Molecules
export * from "./molecules/form-field";
export * from "./molecules/search-input";
export * from "./molecules/section-heading";

// Organisms
export * from "./organisms/card";
export * from "./organisms/chart";
export * from "./organisms/dialog";
export * from "./organisms/dropdown-menu";
export * from "./organisms/locale-switcher";
export * from "./organisms/table";
export * from "./organisms/tabs";
export * from "./organisms/toast";

// Re-exports de conveniência (evita que apps precisem instalar @godzilla/i18n
// separadamente só para trocar o idioma dos componentes)
export {
  I18nProvider,
  useTranslation,
  useLocale,
  locales,
  localeMeta,
  isLocale,
  type Locale,
} from "@godzilla/i18n";
