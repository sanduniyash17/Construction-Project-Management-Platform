import { useEffect, useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProject, getProjects, type Project, type ProjectSortField, type SortDirection } from "../lib/api";

const projectSchema = z.object({
  name: z.string().min(2, "Enter a project name."),
  client: z.string().min(2, "Enter a client name."),
  location: z.string().min(2, "Enter a project location."),
  budget: z.string().min(1, "Enter a budget."),
  dueDate: z.string().min(1, "Choose a due date."),
});

type ProjectFormValues = z.infer<typeof projectSchema>;
type ProjectStatus = "Planning" | "In progress" | "On hold" | "Completed";

const statusOptions: Array<"All" | ProjectStatus> = ["All", "Planning", "In progress", "On hold", "Completed"];

function Projects() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortBy, setSortBy] = useState<ProjectSortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema) });

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const projectsQuery = useQuery({
    queryKey: ["projects", { page, pageSize, query: debouncedQuery, statusFilter, sortBy, sortDirection }],
    queryFn: () => getProjects(page, pageSize, debouncedQuery, statusFilter, sortBy, sortDirection),
    placeholderData: (previousData) => previousData,
  });
  const projects = projectsQuery.data?.data ?? [];
  const pagination = projectsQuery.data?.pagination;

  const createProjectMutation = useMutation({
    mutationFn: (values: ProjectFormValues) => createProject({ ...values, budget: Number(values.budget) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setPage(1);
      setQuery("");
      setDebouncedQuery("");
      setStatusFilter("All");
      reset();
      setIsFormOpen(false);
    },
  });

  function onSubmit(values: ProjectFormValues) {
    createProjectMutation.mutate(values);
  }

  function closeProjectForm() {
    setIsFormOpen(false);
    reset();
    createProjectMutation.reset();
  }

  function toggleSort(field: ProjectSortField) {
    if (sortBy === field) {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
    setPage(1);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-teal-700">Portfolio workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Track delivery, budgets, and milestones across your active work.</p>
        </div>
        <button type="button" onClick={() => setIsFormOpen(true)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800">
          + New project
        </button>
      </div>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block lg:w-80">
            <span className="sr-only">Search projects</span>
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search projects..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
            <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span>
          </label>
          <div className="flex flex-wrap gap-2" aria-label="Filter by status">
            {statusOptions.map((status) => (
              <button key={status} type="button" onClick={() => { setStatusFilter(status); setPage(1); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === status ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <SortableHeader field="name" label="Project" sortBy={sortBy} direction={sortDirection} onSort={toggleSort} />
                <SortableHeader field="status" label="Status" sortBy={sortBy} direction={sortDirection} onSort={toggleSort} />
                <SortableHeader field="progress" label="Progress" sortBy={sortBy} direction={sortDirection} onSort={toggleSort} />
                <SortableHeader field="budget" label="Budget" sortBy={sortBy} direction={sortDirection} onSort={toggleSort} />
                <SortableHeader field="dueDate" label="Due date" sortBy={sortBy} direction={sortDirection} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((project) => <ProjectRow key={project.id} project={project} />)}
            </tbody>
          </table>
          {projectsQuery.isLoading && <p className="p-10 text-center text-sm text-slate-500">Loading projects...</p>}
          {projectsQuery.isError && <p className="p-10 text-center text-sm text-red-600">Unable to load projects. Start the API and try again.</p>}
          {!projectsQuery.isLoading && !projectsQuery.isError && projects.length === 0 && <p className="p-10 text-center text-sm text-slate-500">{debouncedQuery || statusFilter !== "All" ? "No projects match your search." : "No projects found in the database."}</p>}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {pagination && pagination.totalItems > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0}–{pagination ? Math.min(pagination.page * pagination.pageSize, pagination.totalItems) : 0} of {pagination?.totalItems ?? 0} projects</span>
          <div className="flex items-center gap-3">
            <label>Rows <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="ml-1 rounded border border-slate-200 px-1.5 py-1"><option value={5}>5</option><option value={10}>10</option><option value={25}>25</option></select></label>
            <button type="button" disabled={!pagination?.hasPreviousPage || projectsQuery.isFetching} onClick={() => setPage((currentPage) => currentPage - 1)} className="rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
            <span>Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}</span>
            <button type="button" disabled={!pagination?.hasNextPage || projectsQuery.isFetching} onClick={() => setPage((currentPage) => currentPage + 1)} className="rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
          </div>
        </div>
      </section>

      {isFormOpen && <ProjectForm onClose={closeProjectForm} register={register} errors={errors} onSubmit={handleSubmit(onSubmit)} isSaving={createProjectMutation.isPending} submitError={createProjectMutation.error?.message} />}
    </div>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const statusStyles = { Planning: "bg-slate-100 text-slate-600", "In progress": "bg-teal-50 text-teal-700", "On hold": "bg-amber-50 text-amber-700", Completed: "bg-emerald-50 text-emerald-700" };
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-5 py-4"><Link to={`/projects/${project.id}`} className="font-semibold text-slate-900 hover:text-teal-700">{project.name}</Link><p className="mt-1 text-xs text-slate-500">{[project.client, project.location].filter(Boolean).join(" | ") || `Project #${project.id}`}</p></td>
      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[project.status]}`}>{project.status}</span></td>
      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-24 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-teal-700" style={{ width: `${project.progress}%` }} /></div><span className="text-xs font-medium text-slate-600">{project.progress}%</span></div></td>
      <td className="px-5 py-4 text-sm font-medium text-slate-700">{project.budget === null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(project.budget))}</td>
      <td className="px-5 py-4 text-sm text-slate-600">{project.dueDate ? formatDueDate(project.dueDate) : "—"}</td>
    </tr>
  );
}

function SortableHeader({ field, label, sortBy, direction, onSort }: { field: ProjectSortField; label: string; sortBy: ProjectSortField; direction: SortDirection; onSort: (field: ProjectSortField) => void }) {
  const isActive = sortBy === field;
  return <th aria-sort={isActive ? direction === "asc" ? "ascending" : "descending" : "none"} className="px-5 py-3"><button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1.5 text-left hover:text-teal-700">{label}<span aria-hidden="true" className="text-teal-700">{isActive ? direction === "asc" ? "↑" : "↓" : "↕"}</span></button></th>;
}

type ProjectFormProps = {
  onClose: () => void;
  register: ReturnType<typeof useForm<ProjectFormValues>>["register"];
  errors: ReturnType<typeof useForm<ProjectFormValues>>["formState"]["errors"];
  onSubmit: FormEventHandler<HTMLFormElement>;
  isSaving: boolean;
  submitError?: string;
};

function ProjectForm({ onClose, register, errors, onSubmit, isSaving, submitError }: ProjectFormProps) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/30 p-4" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
      <form onSubmit={onSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between"><div><h2 id="new-project-title" className="text-lg font-semibold text-slate-900">New project</h2><p className="mt-1 text-sm text-slate-500">Add a project to your active portfolio.</p></div><button type="button" onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close">×</button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <FormField label="Project name" error={errors.name?.message} className="sm:col-span-2"><input {...register("name")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" placeholder="e.g. Central Library Expansion" /></FormField>
          <FormField label="Client" error={errors.client?.message}><input {...register("client")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" placeholder="Client or owner" /></FormField>
          <FormField label="Location" error={errors.location?.message}><input {...register("location")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" placeholder="City, state" /></FormField>
          <FormField label="Budget ($)" error={errors.budget?.message}><input {...register("budget")} type="number" min="0" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" placeholder="250000" /></FormField>
          <FormField label="Due date" error={errors.dueDate?.message}><input {...register("dueDate")} type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></FormField>
        </div>
        {submitError && <p className="mt-4 text-sm text-red-600" role="alert">{submitError}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={isSaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancel</button><button type="submit" disabled={isSaving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">{isSaving ? "Saving..." : "Create project"}</button></div>
      </form>
    </div>
  );
}

function FormField({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>;
}

function formatDueDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

export default Projects;
