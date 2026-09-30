const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export type Project = {
  id: number;
  name: string;
  client: string | null;
  location: string | null;
  budget: string | null;
  dueDate: string | null;
  status: "Planning" | "In progress" | "On hold" | "Completed";
  progress: number;
};

export type NewProject = {
  name: string;
  client: string;
  location: string;
  budget: number;
  dueDate: string;
};

export type UpdateProject = {
  name: string;
  client: string | null;
  location: string | null;
  budget: number | null;
  dueDate: string | null;
  status: Project["status"];
  progress: number;
};

export type ProjectSortField = "name" | "status" | "progress" | "budget" | "dueDate";
export type SortDirection = "asc" | "desc";

export type ProjectDetails = Project & {
  tasks: Array<{ id: number; title: string; status: string; priority: string; createdAt: string }>;
  teamMembers: Array<{ id: number; name: string; email: string; role: string; status: string }>;
  materials: Array<{ id: number; name: string; category: string; quantity: number; unit: string; reorderAt: number }>;
  expenses: Array<{ id: number; description: string; category: string; amount: string; expenseDate: string; status: string }>;
  documents: Array<{ id: number; name: string; type: string; owner: string; status: string; createdAt: string }>;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export async function getProjects(page: number, pageSize: number, search: string, status: string, sortBy: ProjectSortField, sortDirection: SortDirection) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search.trim()) params.set("search", search.trim());
  if (status !== "All") params.set("status", status);
  params.set("sortBy", sortBy);
  params.set("sortDirection", sortDirection);
  const response = await fetch(`${apiBaseUrl}/projects?${params}`);
  if (!response.ok) throw new Error("Unable to load projects.");
  return response.json() as Promise<PaginatedResponse<Project>>;
}

export async function getProject(id: number) {
  const response = await fetch(`${apiBaseUrl}/projects/${id}`);
  if (!response.ok) throw new Error(response.status === 404 ? "Project not found." : "Unable to load project details.");
  return response.json() as Promise<ProjectDetails>;
}

export async function createProject(project: NewProject) {
  const response = await fetch(`${apiBaseUrl}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? "Unable to create project.");
  }
  return response.json() as Promise<Project>;
}

export async function updateProject(id: number, project: UpdateProject) {
  const response = await fetch(`${apiBaseUrl}/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? "Unable to update project.");
  }
  return response.json() as Promise<Project>;
}
