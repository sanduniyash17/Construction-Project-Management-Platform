import { useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getProjects, type Project } from "../lib/api";

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
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema) });

  const projectsQuery = useQuery({
    queryKey: ["projects", { page, pageSize, query, statusFilter }],
    queryFn: () => getProjects(page, pageSize, query, statusFilter),
    placeholderData: (previousData) => previousData,
  });
  const projects = projectsQuery.data?.data ?? [];
  const pagination = projectsQuery.data?.pagination;

  function onSubmit() {
    reset();
    setIsFormOpen(false);
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
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
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
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Budget</th>
                <th className="px-5 py-3">Due date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((project) => <ProjectRow key={project.id} project={project} />)}
            </tbody>
          </table>
          {projectsQuery.isLoading && <p className="p-10 text-center text-sm text-slate-500">Loading projects...</p>}
          {projectsQuery.isError && <p className="p-10 text-center text-sm text-red-600">Unable to load projects. Start the API and try again.</p>}
          {!projectsQuery.isLoading && !projectsQuery.isError && projects.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No projects match your search.</p>}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {projects.length} of {pagination?.totalItems ?? 0} projects</span>
          <div className="flex items-center gap-3"><label>Rows <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="ml-1 rounded border border-slate-200 px-1.5 py-1"><option value={5}>5</option><option value={10}>10</option><option value={25}>25</option></select></label><button type="button" disabled={!pagination?.hasPreviousPage} onClick={() => setPage((currentPage) => currentPage - 1)} className="rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span>Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}</span><button type="button" disabled={!pagination?.hasNextPage} onClick={() => setPage((currentPage) => currentPage + 1)} className="rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40">Next</button></div>
        </div>
      </section>

      {isFormOpen && <ProjectForm onClose={() => { setIsFormOpen(false); reset(); }} register={register} errors={errors} onSubmit={handleSubmit(onSubmit)} />}
    </div>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const statusStyles = { Planning: "bg-slate-100 text-slate-600", "In progress": "bg-teal-50 text-teal-700", "On hold": "bg-amber-50 text-amber-700", Completed: "bg-emerald-50 text-emerald-700" };
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-5 py-4"><p className="font-semibold text-slate-900">{project.name}</p><p className="mt-1 text-xs text-slate-500">Project #{project.id}</p></td>
      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[project.status]}`}>{project.status}</span></td>
      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-24 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-teal-700" style={{ width: `${project.progress}%` }} /></div><span className="text-xs font-medium text-slate-600">{project.progress}%</span></div></td>
      <td className="px-5 py-4 text-sm font-medium text-slate-700">From API</td>
      <td className="px-5 py-4 text-sm text-slate-600">Active</td>
    </tr>
  );
}

type ProjectFormProps = {
  onClose: () => void;
  register: ReturnType<typeof useForm<ProjectFormValues>>["register"];
  errors: ReturnType<typeof useForm<ProjectFormValues>>["formState"]["errors"];
  onSubmit: FormEventHandler<HTMLFormElement>;
};

function ProjectForm({ onClose, register, errors, onSubmit }: ProjectFormProps) {
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
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Create project</button></div>
      </form>
    </div>
  );
}

function FormField({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>;
}

export default Projects;
