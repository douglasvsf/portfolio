import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/components/sections/hero-section";
import { AboutSection } from "@/components/sections/about-section";
import { SkillsSection } from "@/components/sections/skills-section";
import { ProjectsSection } from "@/components/sections/projects-section";
import { ExperienceSection } from "@/components/sections/experience-section";
import { ContactSection } from "@/components/sections/contact-section";
import { SECTION_IDS, getContent } from "@/content";
import { isLocale } from "@/i18n/config";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const { nav, hero, about, skills, projects, experience, contact, footer } = getContent(lang);

  return (
    <>
      <SiteHeader
        brand={nav.brand}
        brandHref={`#${SECTION_IDS.hero}`}
        links={nav.links}
        systems={nav.systems}
        locale={lang}
        skipToContent={nav.skipToContent}
      />
      <main id="content" className="flex-1">
        <HeroSection id={SECTION_IDS.hero} {...hero} />
        <AboutSection id={SECTION_IDS.about} index="01" {...about} />
        <SkillsSection id={SECTION_IDS.skills} index="02" {...skills} />
        <ProjectsSection id={SECTION_IDS.projects} index="03" {...projects} />
        <ExperienceSection id={SECTION_IDS.experience} index="04" {...experience} />
        <ContactSection id={SECTION_IDS.contact} index="05" {...contact} />
      </main>
      <SiteFooter {...footer} />
    </>
  );
}
