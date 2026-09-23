/**
 * Conjunto curado de ícones do Design System.
 *
 * Reexporta apenas os ícones efetivamente usados pelos componentes de
 * `@godzilla/ui` (mais alguns de uso comum em produtos), em vez de expor a
 * biblioteca `lucide-react` inteira — mantém a superfície de API do Design
 * System sob controle e evita que cada app escolha um ícone diferente para o
 * mesmo conceito (ex.: "fechar").
 */
import type { LucideIcon, LucideProps } from "lucide-react";

export type { LucideIcon, LucideProps as IconProps };

export {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronsUpDown,
  Globe,
  Linkedin,
  Mail,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Info,
  Loader2,
  Minus,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Sun,
  User,
  X,
} from "lucide-react";

export { FlagBR, FlagES, FlagUS, type FlagProps } from "./flags";
