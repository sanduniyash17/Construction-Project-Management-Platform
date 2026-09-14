import { useMemo, useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const taskSchema = z.object({
  title: z.string().min(2, "Enter a task title."),
  project: z.string().min(1, "Choose a project."),
  assignee: z.string().min(2, "Enter an assignee."),
  dueDate: z.string().min(1, "Choose a due date."),
  priority: z.enum(["Low", "Medium", "High"]),
});

type TaskFormValues = z.infer<typeof taskSchema>;
type TaskStatus = "To do" | "In progress" | "Blocked" | "Done";
type TaskPriority = "Low" | "Medium" | "High";

type Task = {
  id: number;
  title: string;
  project: string;
  assignee: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
};

const initialTasks: Task[] = [
  { id: 1, title: "Approve concrete pour schedule", project: "Riverside Office Complex", assignee: "Maya Chen", status: "In progress", priority: "High", dueDate: "Today" },
  { id: 2, title: "Upload revised structural drawings", project: "Northpoint Distribution Center", assignee: "Jordan Lee", status: "To do", priority: "Medium", dueDate: "Sep 18" },
  { id: 3, title: "Resolve material delivery delay", project: "Cedar Avenue Renovation", assignee: "Sam Rivera", status: "Blocked", priority: "High", dueDate: "Sep 16" },
  { id: 4, title: "Complete electrical inspection", project: "Lakeside Medical Pavilion", assignee: "Maya Chen", status: "Done", priority: "Medium", dueDate: "Sep 12" },
  { id: 5, title: "Confirm site safety walk-through", project: "Riverside Office Complex", assignee: "Alex Morgan", status: "To do", priority: "Low", dueDate: "Sep 21" },
];

const statusOptions: Array<"All" | TaskStatus> = ["All", "To do", "In progress", "Blocked", "Done"];
const projectOptions = ["Riverside Office Complex", "Northpoint Distribution Center", "Cedar Avenue Renovation", "Lakeside Medical Pavilion"];

function Tasks() {
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema), defaultValues: { priority: "Medium" } });

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesQuery = `${task.title} ${task.project} ${task.assignee}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === "All" || task.status === statusFilter);
  }), [tasks, query, statusFilter]);

  function onSubmit(values: TaskFormValues) {
    setTasks((currentTasks) => [{ id: Date.now(), title: values.title, project: values.project, assignee: values.assignee, status: "To do", priority: values.priority, dueDate: new Date(`${values.dueDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }, ...currentTasks]);
    reset();
    setIsFormOpen(false);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-teal-700">Work planning</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">Keep every project moving with clear ownership and deadlines.</p>
        </div>
        <button type="button" onClick={() => setIsFormOpen(true)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800">+ New task</button>
      </div>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block lg:w-80"><span className="sr-only">Search tasks</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /><span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span></label>
          <div className="flex flex-wrap gap-2" aria-label="Filter tasks by status">{statusOptions.map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${statusFilter === status ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{status}</button>)}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Task</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Assignee</th><th className="px-5 py-3">Due date</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{filteredTasks.map((task) => <TaskRow key={task.id} task={task} />)}</tbody>
          </table>
          {filteredTasks.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No tasks match your filters.</p>}
        </div>
        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">Showing {filteredTasks.length} of {tasks.length} tasks</div>
      </section>

      {isFormOpen && <TaskForm onClose={() => { setIsFormOpen(false); reset(); }} register={register} errors={errors} onSubmit={handleSubmit(onSubmit)} />}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const statusStyles = { "To do": "bg-slate-100 text-slate-600", "In progress": "bg-teal-50 text-teal-700", Blocked: "bg-red-50 text-red-700", Done: "bg-emerald-50 text-emerald-700" };
  const priorityStyles = { Low: "text-slate-500", Medium: "text-amber-600", High: "text-red-600" };
  return <tr className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.project}</p></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status]}`}>{task.status}</span></td><td className={`px-5 py-4 text-sm font-semibold ${priorityStyles[task.priority]}`}>● {task.priority}</td><td className="px-5 py-4 text-sm text-slate-600">{task.assignee}</td><td className="px-5 py-4 text-sm text-slate-600">{task.dueDate}</td></tr>;
}

type TaskFormProps = { onClose: () => void; register: ReturnType<typeof useForm<TaskFormValues>>["register"]; errors: ReturnType<typeof useForm<TaskFormValues>>["formState"]["errors"]; onSubmit: FormEventHandler<HTMLFormElement> };

function TaskForm({ onClose, register, errors, onSubmit }: TaskFormProps) {
  const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/30 p-4" role="dialog" aria-modal="true" aria-labelledby="new-task-title"><form onSubmit={onSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="new-task-title" className="text-lg font-semibold text-slate-900">New task</h2><p className="mt-1 text-sm text-slate-500">Assign a task to keep project work moving.</p></div><button type="button" onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><FormField label="Task title" error={errors.title?.message} className="sm:col-span-2"><input {...register("title")} className={inputClass} placeholder="e.g. Review permit drawings" /></FormField><FormField label="Project" error={errors.project?.message}><select {...register("project")} className={inputClass} defaultValue=""><option value="" disabled>Select project</option>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></FormField><FormField label="Assignee" error={errors.assignee?.message}><input {...register("assignee")} className={inputClass} placeholder="Team member" /></FormField><FormField label="Priority" error={errors.priority?.message}><select {...register("priority")} className={inputClass}><option>Low</option><option>Medium</option><option>High</option></select></FormField><FormField label="Due date" error={errors.dueDate?.message}><input {...register("dueDate")} type="date" className={inputClass} /></FormField></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Create task</button></div></form></div>;
}

function FormField({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>;
}

export default Tasks;
