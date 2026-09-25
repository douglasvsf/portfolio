import { redirect } from "next/navigation";

/** /projetos não tem página própria: a lista vive na seção Projetos da home. */
export default async function ProjectsIndex({ params }: PageProps<"/[lang]/projetos">) {
  const { lang } = await params;
  redirect(`/${lang}#projects`);
}
