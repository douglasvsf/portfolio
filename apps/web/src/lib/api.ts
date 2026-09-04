import type { ExperienceItem, HealthResponse, Project, SkillGroup } from "@portfolio/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`API respondeu com status ${response.status}`);
  }

  return response.json();
}

// Conteúdo da homepage: falha de forma silenciosa (retorna lista vazia) em vez de
// derrubar a renderização — a API roda desacoplada e pode estar indisponível
// (build sem o backend no ar, banco ainda não populado, etc.).
async function getContent<T>(resource: string): Promise<T[]> {
  try {
    const response = await fetch(`${API_URL}/${resource}`, { next: { revalidate: 60 } });

    if (!response.ok) {
      throw new Error(`API respondeu com status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`Não foi possível carregar "${resource}" da API:`, error);
    return [];
  }
}

export function getSkills(): Promise<SkillGroup[]> {
  return getContent<SkillGroup>("skills");
}

export function getProjects(): Promise<Project[]> {
  return getContent<Project>("projects");
}

export function getExperience(): Promise<ExperienceItem[]> {
  return getContent<ExperienceItem>("experience");
}
