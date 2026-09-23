import { config } from "dotenv";
import mongoose from "mongoose";
import { SkillGroup, SkillGroupSchema } from "./skills/schemas/skill-group.schema";
import { Project, ProjectSchema } from "./projects/schemas/project.schema";
import { ExperienceItem, ExperienceItemSchema } from "./experience/schemas/experience-item.schema";

config();

const skillGroups = [
  {
    category: "Frontend",
    items: ["React", "Next.js", "TypeScript", "AngularJS", "Tailwind CSS"],
  },
  {
    category: "Backend",
    items: ["Node.js", "NestJS", "Laravel", "PHP", "GraphQL"],
  },
  {
    category: "Dados & Infraestrutura",
    items: ["PostgreSQL", "MySQL", "MongoDB", "Docker"],
  },
  {
    category: "Testes & Qualidade",
    items: ["Jest", "Cypress", "React Testing Library", "Storybook"],
  },
];

const projects = [
  {
    name: "Modernização do Ecossistema Discovery — Pravaler",
    description:
      "Liderança da migração de um legado WordPress/PHP com mais de 20 anos para Next.js e Node.js, incluindo a reconstrução completa dos fluxos de simulação, cadastro e atendimento, com mais de 400 testes automatizados.",
    tags: ["Next.js", "Node.js", "Jest", "GCP"],
  },
  {
    name: "Integração Multi-Backend — Inoa",
    description:
      "Desenvolvimento e manutenção da camada frontend integrada a 16 módulos de backend distintos, com AngularJS, React e TypeScript, em alinhamento técnico contínuo entre múltiplas equipes.",
    tags: ["AngularJS", "React", "TypeScript"],
  },
  {
    name: "QualiCloud — SaaS Própria",
    description:
      "Cofundador e líder técnico de uma software house, traduzindo demandas de negócio em produtos fullstack com NestJS, Laravel e React Native junto a uma equipe de desenvolvimento.",
    tags: ["NestJS", "Laravel", "React Native"],
  },
];

const experience = [
  {
    role: "Engenheiro de Software",
    company: "Inoa — Especialistas em Mercado de Capitais",
    period: "Jan 2026 — atual",
    description:
      "Desenvolvimento e manutenção do frontend da plataforma (AngularJS, React e TypeScript), com integração consistente entre 16 módulos de backend mantidos por equipes distintas.",
  },
  {
    role: "Engenheiro de Software",
    company: "Pravaler — Financiamento Estudantil",
    period: "Jun 2022 — Nov 2025",
    description:
      "Liderança da migração de um legado WordPress/PHP para Next.js e Node.js, com mais de 300 mil linhas de código evoluídas, 400+ testes automatizados e reconstrução completa dos fluxos críticos de simulação, cadastro e atendimento.",
  },
  {
    role: "Desenvolvedor Fullstack / Sócio",
    company: "QualiCloud Cloud Solutions",
    period: "Abr 2019 — Nov 2022",
    description:
      "Cofundador e líder técnico de uma equipe de desenvolvimento, transformando demandas de negócio em produtos SaaS fullstack com NestJS, Laravel e React Native.",
  },
  {
    role: "Analista de Desenvolvimento de Sistemas",
    company: "Cristófoli Equipamentos",
    period: "Jul 2015 — Nov 2022",
    description:
      "Desenvolvimento de aplicações MVC e APIs RESTful (PHP, Laravel, Node.js) para um CRM interno usado por cerca de 160 pessoas, integrado ao ERP corporativo.",
  },
];

async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/portfolio";
  await mongoose.connect(uri);

  const SkillGroupModel = mongoose.model(SkillGroup.name, SkillGroupSchema);
  const ProjectModel = mongoose.model(Project.name, ProjectSchema);
  const ExperienceItemModel = mongoose.model(ExperienceItem.name, ExperienceItemSchema);

  await SkillGroupModel.deleteMany({});
  await SkillGroupModel.insertMany(skillGroups);

  await ProjectModel.deleteMany({});
  await ProjectModel.insertMany(projects);

  await ExperienceItemModel.deleteMany({});
  await ExperienceItemModel.insertMany(experience);

  console.log("Seed concluído: skills, projects e experience populados.");
  await mongoose.disconnect();
}

seed().catch((error: unknown) => {
  console.error("Erro ao popular o banco:", error);
  process.exit(1);
});
