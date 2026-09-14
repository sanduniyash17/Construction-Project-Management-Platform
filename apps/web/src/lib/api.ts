const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export type Project = {
  id: number;
  name: string;
  status: "Planning" | "In progress" | "On hold" | "Completed";
  progress: number;
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

export async function getProjects(page: number, pageSize: number, search: string, status: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search.trim()) params.set("search", search.trim());
  if (status !== "All") params.set("status", status);
  const response = await fetch(`${apiBaseUrl}/projects?${params}`);
  if (!response.ok) throw new Error("Unable to load projects.");
  return response.json() as Promise<PaginatedResponse<Project>>;
}
