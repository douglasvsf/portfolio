import { useState } from "react";
import {
  ThemeProvider,
  useTheme,
  I18nProvider,
  useLocale,
  type Locale,
  Typography,
  Button,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Separator,
  Switch,
  Checkbox,
  Label,
  FormField,
  Input,
  SearchInput,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Toaster,
  toast,
} from "@godzilla/ui";
import { Sun, Moon } from "@godzilla/icons";

function Header() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const locale = useLocale();

  return (
    <header className="mb-10 flex items-center justify-between border-b border-border pb-6">
      <div>
        <Typography variant="h2">@godzilla/ui</Typography>
        <Typography variant="body-sm" className="text-muted-foreground">
          Playground — demonstra o consumo do Design System por um app externo.
        </Typography>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline">locale: {locale}</Badge>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  );
}

function TypographySection() {
  return (
    <section className="mb-12 flex flex-col gap-3">
      <Typography variant="overline">01 · Typography</Typography>
      <Typography variant="h1">Dashboard</Typography>
      <Typography variant="body">
        Escala tipográfica completa, consumida via <code>{"<Typography variant=\"h1\" />"}</code>.
      </Typography>
    </section>
  );
}

function ButtonsSection() {
  return (
    <section className="mb-12 flex flex-col gap-3">
      <Typography variant="overline">02 · Buttons</Typography>
      <div className="flex flex-wrap gap-3">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button loading>Salvando</Button>
      </div>
    </section>
  );
}

function FormSection() {
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("douglas@");

  return (
    <section className="mb-12 flex flex-col gap-4">
      <Typography variant="overline">03 · Form</Typography>
      <div className="grid max-w-md gap-4">
        <FormField
          label="E-mail"
          required
          error={email.includes("@") && email.includes(".") ? undefined : "Informe um e-mail válido."}
        >
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </FormField>

        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} />

        <div className="flex items-center gap-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms">Aceito os termos de uso</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch id="notifications" defaultChecked />
          <Label htmlFor="notifications">Notificações por e-mail</Label>
        </div>
      </div>
    </section>
  );
}

function TabsAndCardSection() {
  return (
    <section className="mb-12 grid gap-6 md:grid-cols-2">
      <div>
        <Typography variant="overline" className="mb-3 block">
          04 · Tabs
        </Typography>
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Conta</TabsTrigger>
            <TabsTrigger value="team">Time</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="text-body-sm text-muted-foreground">
            Configurações da conta.
          </TabsContent>
          <TabsContent value="team" className="text-body-sm text-muted-foreground">
            Membros do time.
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <Typography variant="overline" className="mb-3 block">
          05 · Card
        </Typography>
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Avatar>
              <AvatarImage src="https://i.pravatar.cc/80?img=12" alt="" />
              <AvatarFallback>DS</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Douglas Szapak</CardTitle>
              <CardDescription>Full Stack Developer</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-3" />
            <div className="flex flex-wrap gap-2">
              <Badge>React</Badge>
              <Badge variant="secondary">Node.js</Badge>
              <Badge variant="outline">NestJS</Badge>
            </div>
          </CardContent>
          <CardFooter>
            <Button size="sm" onClick={() => toast({ title: "Perfil salvo", variant: "success" })}>
              Salvar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}

function DialogSection() {
  return (
    <section className="mb-12">
      <Typography variant="overline" className="mb-3 block">
        06 · Dialog
      </Typography>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive">Excluir conta</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conta</DialogTitle>
            <DialogDescription>Essa ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant="destructive"
                onClick={() => toast({ title: "Conta excluída", variant: "destructive" })}
              >
                Confirmar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function LocaleSwitcher({ locale, onChange }: { locale: Locale; onChange: (l: Locale) => void }) {
  return (
    <div className="mb-8 flex gap-2">
      {(["pt-BR", "en-US", "es-ES"] as const).map((l) => (
        <Button key={l} size="sm" variant={l === locale ? "default" : "outline"} onClick={() => onChange(l)}>
          {l}
        </Button>
      ))}
    </div>
  );
}

function PlaygroundContent() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Header />
      <TypographySection />
      <ButtonsSection />
      <FormSection />
      <TabsAndCardSection />
      <DialogSection />
      <Toaster />
    </main>
  );
}

export default function App() {
  const [locale, setLocale] = useState<Locale>("pt-BR");

  return (
    <ThemeProvider>
      <I18nProvider locale={locale}>
        <div className="min-h-screen bg-background text-foreground">
          <div className="mx-auto max-w-3xl px-6 pt-6">
            <LocaleSwitcher locale={locale} onChange={setLocale} />
          </div>
          <PlaygroundContent />
        </div>
      </I18nProvider>
    </ThemeProvider>
  );
}
