import { useMemo, useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const projectSchema = z.object({
  name: z.string().min(2, "Enter a project name."),
  client: z.string().min(2, "Enter a client name."),
  location: z.string().min(2, "Enter a project location."),
  budget: z.string().min(1, "Enter a budget."),
  dueDate: z.string().min(1, "Choose a due date."),
});

type ProjectFormValues = z.infer<typeof projectSchema>;
type ProjectStatus = "Planning" | "In progress" | "On hold" | "Completed";

type Project = {
  id: number;
  name: string;
  client: string;
  location: string;
  status: ProjectStatus;
  budget: string;
  progress: number;
  dueDate: string;
};

const initialProjects: Project[] = [
  { id: 1, name: "Riverside Office Complex", client: "Horizon Developments", location: "Austin, TX", status: "In progress", budget: "$820,000", progress: 72, dueDate: "Aug 28, 2026" },
  { id: 2, name: "Northpoint Distribution Center", client: "Northpoint Logistics", location: "Dallas, TX", status: "In progress", budget: "$640,000", progress: 48, dueDate: "Oct 14, 2026" },
  { id: 3, name: "Cedar Avenue Renovation", client: "City of Austin", location: "Austin, TX", status: "On hold", budget: "$520,000", progress: 31, dueDate: "Nov 02, 2026" },
  { id: 4, name: "Lakeside Medical Pavilion", client: "Lakeside Health", location: "Round Rock, TX", status: "Planning", budget: "$460,000", progress: 8, dueDate: "Jan 19, 2027" },
  { id: 5, name: "Westfield Retail Fit-out", client: "Westfield Partners", location: "Pflugerville, TX", status: "Completed", budget: "$380,000", progress: 100, dueDate: "Jun 30, 2026" },
];

const statusOptions: Array<"All" | ProjectStatus> = ["All", "Planning", "In progress", "On hold", "Completed"];

function Projects() {
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema) });

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const matchesQuery = `${project.name} ${project.client} ${project.location}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "All" || project.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [projects, query, statusFilter]);

  function onSubmit(values: ProjectFormValues) {
    setProjects((currentProjects) => [
      {
        id: Date.now(),
        name: values.name,
        client: values.client,
        location: values.location,
        status: "Planning",
        budget: `$${Number(values.budget).toLocaleString("en-US")}`,
        progress: 0,
        dueDate: new Date(`${values.dueDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      },
      ...currentProjects,
    ]);
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
              <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === status ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
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
              {filteredProjects.map((project) => <ProjectRow key={project.id} project={project} />)}
            </tbody>
          </table>
          {filteredProjects.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No projects match your filters.</p>}
        </div>
        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">Showing {filteredProjects.length} of {projects.length} projects</div>
      </section>

      {isFormOpen && <ProjectForm onClose={() => { setIsFormOpen(false); reset(); }} register={register} errors={errors} onSubmit={handleSubmit(onSubmit)} />}
    </div>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const statusStyles = { Planning: "bg-slate-100 text-slate-600", "In progress": "bg-teal-50 text-teal-700", "On hold": "bg-amber-50 text-amber-700", Completed: "bg-emerald-50 text-emerald-700" };
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-5 py-4"><p className="font-semibold text-slate-900">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.client} · {project.location}</p></td>
      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[project.status]}`}>{project.status}</span></td>
      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-24 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-teal-700" style={{ width: `${project.progress}%` }} /></div><span className="text-xs font-medium text-slate-600">{project.progress}%</span></div></td>
      <td className="px-5 py-4 text-sm font-medium text-slate-700">{project.budget}</td>
      <td className="px-5 py-4 text-sm text-slate-600">{project.dueDate}</td>
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
