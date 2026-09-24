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
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Circle,
  Clock,
  CodeXml,
  Disc3,
  ExternalLink,
  FileCheck2,
  FlaskConical,
  GitBranch,
  Globe,
  Headphones,
  History,
  Info,
  LayoutDashboard,
  Linkedin,
  ListMusic,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  Mic2,
  Minus,
  Moon,
  MoreHorizontal,
  Music,
  Palette,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";

export { FlagBR, FlagES, FlagUS, type FlagProps } from "./flags";
