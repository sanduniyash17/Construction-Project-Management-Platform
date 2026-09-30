import { useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getProject, updateProject } from "../lib/api";

const editProjectSchema = z.object({
  name: z.string().min(2, "Enter a project name."),
  client: z.string(),
  location: z.string(),
  budget: z.string().refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), "Enter a non-negative budget."),
  dueDate: z.string(),
  status: z.enum(["Planning", "In progress", "On hold", "Completed"]),
  progress: z.string().regex(/^(100|[1-9]?\d)$/, "Enter a progress from 0 to 100."),
});

type EditProjectValues = z.infer<typeof editProjectSchema>;

function ProjectDetails() {
  const { id } = useParams();
  const projectId = Number(id);
  const isValidId = Number.isInteger(projectId) && projectId > 0;
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditProjectValues>({ resolver: zodResolver(editProjectSchema) });

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    enabled: isValidId,
  });

  const updateMutation = useMutation({
    mutationFn: (values: EditProjectValues) => updateProject(projectId, {
      name: values.name,
      client: values.client.trim() || null,
      location: values.location.trim() || null,
      budget: values.budget === "" ? null : Number(values.budget),
      dueDate: values.dueDate || null,
      status: values.status,
      progress: Number(values.progress),
    }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ]);
      setIsEditing(false);
    },
  });

  function startEditing() {
    const project = projectQuery.data;
    if (!project) return;
    reset({
      name: project.name,
      client: project.client ?? "",
      location: project.location ?? "",
      budget: project.budget === null ? "" : String(Number(project.budget)),
      dueDate: project.dueDate ? project.dueDate.slice(0, 10) : "",
      status: project.status,
      progress: String(project.progress),
    });
    updateMutation.reset();
    setIsEditing(true);
  }

  function closeEditor() {
    updateMutation.reset();
    setIsEditing(false);
  }

  if (!isValidId) return <PageMessage title="Invalid project" message="The project ID in this address is not valid." />;
  if (projectQuery.isLoading) return <PageMessage title="Loading project" message="Retrieving project details and related records..." />;
  if (projectQuery.isError || !projectQuery.data) return <PageMessage title="Project unavailable" message={projectQuery.error?.message ?? "The requested project could not be found."} />;

  const project = projectQuery.data;
  const statusStyles = { Planning: "bg-slate-100 text-slate-700", "In progress": "bg-teal-50 text-teal-700", "On hold": "bg-amber-50 text-amber-700", Completed: "bg-emerald-50 text-emerald-700" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link to="/projects" className="text-sm font-medium text-teal-700 hover:text-teal-900">← All projects</Link>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="mt-1 text-sm text-slate-500">Project #{project.id}{project.client ? ` · ${project.client}` : ""}</p>
        </div>
        <button type="button" onClick={startEditing} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">Edit project</button>
      </div>

      <section className="grid gap-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-[1fr_1fr_1.4fr]">
        <DetailItem label="Status"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[project.status]}`}>{project.status}</span></DetailItem>
        <DetailItem label="Progress"><div className="flex items-center gap-3"><div className="h-2 w-32 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-700" style={{ width: `${project.progress}%` }} /></div><span className="text-sm font-semibold text-slate-700">{project.progress}%</span></div></DetailItem>
        <DetailItem label="Due date">{project.dueDate ? formatDate(project.dueDate) : "Not set"}</DetailItem>
        <DetailItem label="Client">{project.client || "Not set"}</DetailItem>
        <DetailItem label="Location">{project.location || "Not set"}</DetailItem>
        <DetailItem label="Budget">{project.budget === null ? "Not set" : formatCurrency(project.budget)}</DetailItem>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <RelatedSection title="Tasks" count={project.tasks.length}>
          {project.tasks.length === 0 ? <EmptyRelation /> : <div className="overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><thead><tr><TableHead>Task</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead></tr></thead><tbody className="divide-y divide-slate-100">{project.tasks.map((task) => <tr key={task.id}><TableCell>{task.title}</TableCell><TableCell>{task.status}</TableCell><TableCell>{task.priority}</TableCell></tr>)}</tbody></table></div>}
        </RelatedSection>

        <RelatedSection title="Team" count={project.teamMembers.length}>
          {project.teamMembers.length === 0 ? <EmptyRelation /> : <div className="overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><thead><tr><TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></tr></thead><tbody className="divide-y divide-slate-100">{project.teamMembers.map((member) => <tr key={member.id}><TableCell><span className="block font-medium text-slate-800">{member.name}</span><span className="text-xs text-slate-500">{member.email}</span></TableCell><TableCell>{member.role}</TableCell><TableCell>{member.status}</TableCell></tr>)}</tbody></table></div>}
        </RelatedSection>

        <RelatedSection title="Materials" count={project.materials.length}>
          {project.materials.length === 0 ? <EmptyRelation /> : <div className="overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><thead><tr><TableHead>Material</TableHead><TableHead>Category</TableHead><TableHead>Quantity</TableHead></tr></thead><tbody className="divide-y divide-slate-100">{project.materials.map((material) => <tr key={material.id}><TableCell>{material.name}</TableCell><TableCell>{material.category}</TableCell><TableCell>{material.quantity} {material.unit}</TableCell></tr>)}</tbody></table></div>}
        </RelatedSection>

        <RelatedSection title="Expenses" count={project.expenses.length}>
          {project.expenses.length === 0 ? <EmptyRelation /> : <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead><tr><TableHead>Expense</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead></tr></thead><tbody className="divide-y divide-slate-100">{project.expenses.map((expense) => <tr key={expense.id}><TableCell>{expense.description}</TableCell><TableCell>{expense.category}</TableCell><TableCell>{formatCurrency(expense.amount)}</TableCell><TableCell>{formatDate(expense.expenseDate)}</TableCell></tr>)}</tbody></table></div>}
        </RelatedSection>

        <RelatedSection title="Documents" count={project.documents.length}>
          {project.documents.length === 0 ? <EmptyRelation /> : <div className="overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><thead><tr><TableHead>Document</TableHead><TableHead>Type</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead></tr></thead><tbody className="divide-y divide-slate-100">{project.documents.map((document) => <tr key={document.id}><TableCell>{document.name}</TableCell><TableCell>{document.type}</TableCell><TableCell>{document.owner}</TableCell><TableCell>{document.status}</TableCell></tr>)}</tbody></table></div>}
        </RelatedSection>
      </div>

      {isEditing && <EditProjectDialog onClose={closeEditor} register={register} errors={errors} onSubmit={handleSubmit((values) => updateMutation.mutate(values))} isSaving={updateMutation.isPending} submitError={updateMutation.error?.message} />}
    </div>
  );
}

function PageMessage({ title, message }: { title: string; message: string }) {
  return <section className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><Link to="/projects" className="text-sm font-medium text-teal-700 hover:text-teal-900">← All projects</Link><h1 className="mt-5 text-xl font-bold text-slate-900">{title}</h1><p className="mt-2 text-sm text-slate-600">{message}</p></section>;
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-2 text-sm font-medium text-slate-800">{children}</dd></div>;
}

function RelatedSection({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="text-base font-semibold text-slate-900">{title}</h2><span className="text-xs text-slate-500">{count}</span></div><div className="p-5">{children}</div></section>;
}

function EmptyRelation() {
  return <p className="py-3 text-sm text-slate-500">No records linked to this project.</p>;
}

function TableHead({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 text-xs font-semibold uppercase text-slate-500 first:pl-0">{children}</th>;
}

function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-3 py-3 text-slate-700 first:pl-0">{children}</td>;
}

type EditProjectDialogProps = {
  onClose: () => void;
  register: ReturnType<typeof useForm<EditProjectValues>>["register"];
  errors: ReturnType<typeof useForm<EditProjectValues>>["formState"]["errors"];
  onSubmit: FormEventHandler<HTMLFormElement>;
  isSaving: boolean;
  submitError?: string;
};

function EditProjectDialog({ onClose, register, errors, onSubmit, isSaving, submitError }: EditProjectDialogProps) {
  return <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-project-title"><form onSubmit={onSubmit} className="my-auto w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="edit-project-title" className="text-lg font-semibold text-slate-900">Edit project</h2><p className="mt-1 text-sm text-slate-500">Update project details and delivery status.</p></div><button type="button" onClick={onClose} disabled={isSaving} className="text-xl leading-none text-slate-400 hover:text-slate-700 disabled:opacity-50" aria-label="Close">×</button></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Field label="Project name" error={errors.name?.message} className="sm:col-span-2"><input {...register("name")} className={inputClass} /></Field>
      <Field label="Client" error={errors.client?.message}><input {...register("client")} className={inputClass} /></Field>
      <Field label="Location" error={errors.location?.message}><input {...register("location")} className={inputClass} /></Field>
      <Field label="Budget ($)" error={errors.budget?.message}><input {...register("budget")} type="number" min="0" step="0.01" className={inputClass} /></Field>
      <Field label="Due date" error={errors.dueDate?.message}><input {...register("dueDate")} type="date" className={inputClass} /></Field>
      <Field label="Status" error={errors.status?.message}><select {...register("status")} className={inputClass}><option>Planning</option><option>In progress</option><option>On hold</option><option>Completed</option></select></Field>
      <Field label="Progress (%)" error={errors.progress?.message}><input {...register("progress")} type="number" min="0" max="100" step="1" className={inputClass} /></Field>
    </div>
    {submitError && <p className="mt-4 text-sm text-red-600" role="alert">{submitError}</p>}
    <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={isSaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Cancel</button><button type="submit" disabled={isSaving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">{isSaving ? "Saving..." : "Save changes"}</button></div>
  </form></div>;
}

const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

function Field({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>;
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value));
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export default ProjectDetails;