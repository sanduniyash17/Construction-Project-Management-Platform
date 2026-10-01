import { useEffect, useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTask, getProjectOptions, getTasks, updateTaskStatus, type ProjectOption, type Task } from "../lib/api";

const taskSchema = z.object({
  title: z.string().min(2, "Enter a task title."),
  projectId: z.string().min(1, "Choose a project."),
  assignee: z.string().min(2, "Enter an assignee."),
  dueDate: z.string().min(1, "Choose a due date."),
  priority: z.enum(["Low", "Medium", "High"]),
});

type TaskFormValues = z.infer<typeof taskSchema>;
type TaskStatus = Task["status"];

const statusOptions: Array<"All" | TaskStatus> = ["All", "To do", "In progress", "Blocked", "Done"];

function Tasks() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema), defaultValues: { priority: "Medium" } });

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const tasksQuery = useQuery({
    queryKey: ["tasks", { page, pageSize, search: debouncedQuery, statusFilter }],
    queryFn: () => getTasks(page, pageSize, debouncedQuery, statusFilter),
    placeholderData: (previousData) => previousData,
  });
  const projectsQuery = useQuery({ queryKey: ["project-options"], queryFn: getProjectOptions });
  const tasks = tasksQuery.data?.data ?? [];
  const pagination = tasksQuery.data?.pagination;

  const createMutation = useMutation({
    mutationFn: (values: TaskFormValues) => createTask({
      title: values.title.trim(),
      projectId: Number(values.projectId),
      assignee: values.assignee.trim(),
      dueDate: values.dueDate,
      priority: values.priority,
    }),
    onSuccess: async (task) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["project", task.projectId] }),
      ]);
      setPage(1);
      setQuery("");
      setDebouncedQuery("");
      setStatusFilter("All");
      reset({ priority: "Medium" });
      setIsFormOpen(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; projectId: number; status: TaskStatus }) => updateTaskStatus(id, status),
    onSuccess: async (_task, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] }),
      ]);
    },
  });

  function closeForm() {
    setIsFormOpen(false);
    reset({ priority: "Medium" });
    createMutation.reset();
  }

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-teal-700">Work planning</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">Keep every project moving with clear ownership and deadlines.</p>
        </div>
        <button type="button" onClick={() => { createMutation.reset(); setIsFormOpen(true); }} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800">+ New task</button>
      </div>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block lg:w-80"><span className="sr-only">Search tasks</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search tasks..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /><span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span></label>
          <div className="flex flex-wrap gap-2" aria-label="Filter tasks by status">{statusOptions.map((status) => <button key={status} type="button" onClick={() => { setStatusFilter(status); setPage(1); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === status ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{status}</button>)}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Task</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Assignee</th><th className="px-5 py-3">Due date</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{tasks.map((task) => <TaskRow key={task.id} task={task} isUpdating={statusMutation.isPending && statusMutation.variables?.id === task.id} onStatusChange={(status) => statusMutation.mutate({ id: task.id, projectId: task.projectId, status })} />)}</tbody>
          </table>
          {tasksQuery.isLoading && <p className="p-10 text-center text-sm text-slate-500">Loading tasks...</p>}
          {tasksQuery.isError && <p className="p-10 text-center text-sm text-red-600">{tasksQuery.error.message} Start the API and try again.</p>}
          {statusMutation.isError && <p className="px-5 pb-4 text-sm text-red-600" role="alert">{statusMutation.error.message}</p>}
          {!tasksQuery.isLoading && !tasksQuery.isError && tasks.length === 0 && <p className="p-10 text-center text-sm text-slate-500">{debouncedQuery || statusFilter !== "All" ? "No tasks match your filters." : "No tasks found in the database."}</p>}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {pagination && pagination.totalItems > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0}–{pagination ? Math.min(pagination.page * pagination.pageSize, pagination.totalItems) : 0} of {pagination?.totalItems ?? 0} tasks</span>
          <div className="flex items-center gap-3">
            <label>Rows <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="ml-1 rounded border border-slate-200 px-1.5 py-1"><option value={5}>5</option><option value={10}>10</option><option value={25}>25</option></select></label>
            <button type="button" disabled={!pagination?.hasPreviousPage || tasksQuery.isFetching} onClick={() => setPage((currentPage) => currentPage - 1)} className="rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
            <span>Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}</span>
            <button type="button" disabled={!pagination?.hasNextPage || tasksQuery.isFetching} onClick={() => setPage((currentPage) => currentPage + 1)} className="rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
          </div>
        </div>
      </section>

      {isFormOpen && <TaskForm onClose={closeForm} register={register} errors={errors} projects={projectsQuery.data ?? []} projectsLoading={projectsQuery.isLoading} projectsError={projectsQuery.error?.message} isSaving={createMutation.isPending} submitError={createMutation.error?.message} onSubmit={handleSubmit((values) => createMutation.mutate(values))} />}
    </div>
  );
}

function TaskRow({ task, isUpdating, onStatusChange }: { task: Task; isUpdating: boolean; onStatusChange: (status: TaskStatus) => void }) {
  const priorityStyles = { Low: "text-slate-500", Medium: "text-amber-600", High: "text-red-600" };
  return <tr className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.project.name}</p></td><td className="px-5 py-4"><label className="sr-only" htmlFor={`task-status-${task.id}`}>Update status for {task.title}</label><select id={`task-status-${task.id}`} value={task.status} disabled={isUpdating} onChange={(event) => onStatusChange(event.target.value as TaskStatus)} className="rounded-full border-0 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-60"><option>To do</option><option>In progress</option><option>Blocked</option><option>Done</option></select></td><td className={`px-5 py-4 text-sm font-semibold ${priorityStyles[task.priority]}`}>● {task.priority}</td><td className="px-5 py-4 text-sm text-slate-600">{task.assignee || "Unassigned"}</td><td className="px-5 py-4 text-sm text-slate-600">{task.dueDate ? formatDate(task.dueDate) : "—"}</td></tr>;
}

type TaskFormProps = {
  onClose: () => void;
  register: ReturnType<typeof useForm<TaskFormValues>>["register"];
  errors: ReturnType<typeof useForm<TaskFormValues>>["formState"]["errors"];
  projects: ProjectOption[];
  projectsLoading: boolean;
  projectsError?: string;
  isSaving: boolean;
  submitError?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

function TaskForm({ onClose, register, errors, projects, projectsLoading, projectsError, isSaving, submitError, onSubmit }: TaskFormProps) {
  const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
  return <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-slate-950/30 p-4" role="dialog" aria-modal="true" aria-labelledby="new-task-title"><form onSubmit={onSubmit} className="my-auto w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="new-task-title" className="text-lg font-semibold text-slate-900">New task</h2><p className="mt-1 text-sm text-slate-500">Assign a task to keep project work moving.</p></div><button type="button" onClick={onClose} disabled={isSaving} className="text-xl leading-none text-slate-400 hover:text-slate-700 disabled:opacity-50" aria-label="Close">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><FormField label="Task title" error={errors.title?.message} className="sm:col-span-2"><input {...register("title")} className={inputClass} placeholder="e.g. Review permit drawings" /></FormField><FormField label="Project" error={errors.projectId?.message || projectsError}><select {...register("projectId")} className={inputClass} defaultValue="" disabled={projectsLoading || projects.length === 0}><option value="" disabled>{projectsLoading ? "Loading projects..." : "Select project"}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></FormField><FormField label="Assignee" error={errors.assignee?.message}><input {...register("assignee")} className={inputClass} placeholder="Team member" /></FormField><FormField label="Priority" error={errors.priority?.message}><select {...register("priority")} className={inputClass}><option>Low</option><option>Medium</option><option>High</option></select></FormField><FormField label="Due date" error={errors.dueDate?.message}><input {...register("dueDate")} type="date" className={inputClass} /></FormField></div>{submitError && <p className="mt-4 text-sm text-red-600" role="alert">{submitError}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={isSaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancel</button><button type="submit" disabled={isSaving || projectsLoading || projects.length === 0} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">{isSaving ? "Saving..." : "Create task"}</button></div></form></div>;
}

function FormField({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>;
}

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}

export default Tasks;
