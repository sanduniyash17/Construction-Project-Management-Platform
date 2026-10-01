import { useMemo, useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const documentSchema = z.object({
  name: z.string().min(2, "Enter a document name."),
  type: z.string().min(1, "Choose a document type."),
  project: z.string().min(1, "Choose a project."),
  owner: z.string().min(2, "Enter an owner."),
});

type DocumentFormValues = z.infer<typeof documentSchema>;
type DocumentStatus = "Approved" | "In review" | "Needs action";

type ProjectDocument = {
  id: number;
  name: string;
  type: string;
  project: string;
  owner: string;
  updated: string;
  status: DocumentStatus;
};

const initialDocuments: ProjectDocument[] = [
  { id: 1, name: "Structural drawings - Rev 4", type: "Drawings", project: "Riverside Office Complex", owner: "Jordan Lee", updated: "Today", status: "Approved" },
  { id: 2, name: "Site safety plan", type: "Safety", project: "Northpoint Distribution Center", owner: "Alex Morgan", updated: "Yesterday", status: "In review" },
  { id: 3, name: "Concrete pour inspection", type: "Reports", project: "Riverside Office Complex", owner: "Maya Chen", updated: "Sep 08, 2026", status: "Approved" },
  { id: 4, name: "Change order #12", type: "Contracts", project: "Cedar Avenue Renovation", owner: "Sam Rivera", updated: "Sep 06, 2026", status: "Needs action" },
  { id: 5, name: "MEP coordination set", type: "Drawings", project: "Lakeside Medical Pavilion", owner: "Jordan Lee", updated: "Sep 03, 2026", status: "In review" },
];

const documentTypes = ["All", "Drawings", "Safety", "Reports", "Contracts", "Permits"];
const projectOptions = ["Riverside Office Complex", "Northpoint Distribution Center", "Cedar Avenue Renovation", "Lakeside Medical Pavilion"];

function Documents() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DocumentFormValues>({ resolver: zodResolver(documentSchema) });

  const filteredDocuments = useMemo(() => documents.filter((document) => {
    const matchesQuery = `${document.name} ${document.project} ${document.owner}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (typeFilter === "All" || document.type === typeFilter);
  }), [documents, query, typeFilter]);

  function onSubmit(values: DocumentFormValues) {
    setDocuments((currentDocuments) => [{ id: Date.now(), name: values.name, type: values.type, project: values.project, owner: values.owner, updated: "Just now", status: "In review" }, ...currentDocuments]);
    reset();
    setIsFormOpen(false);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-teal-700">Project records</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Documents</h1><p className="mt-1 text-sm text-slate-500">Keep plans, reports, contracts, and approvals easy to find.</p></div><button type="button" onClick={() => setIsFormOpen(true)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800">+ Add document</button></div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3"><SummaryCard label="Total documents" value={String(documents.length)} /><SummaryCard label="In review" value={String(documents.filter((document) => document.status === "In review").length)} tone="amber" /><SummaryCard label="Needs action" value={String(documents.filter((document) => document.status === "Needs action").length)} tone="red" /></div>
      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"><div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between"><label className="relative block lg:w-80"><span className="sr-only">Search documents</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /><span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span></label><div className="flex flex-wrap gap-2">{documentTypes.map((type) => <button key={type} type="button" onClick={() => setTypeFilter(type)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${typeFilter === type ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{type}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Document</th><th className="px-5 py-3">Project</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredDocuments.map((document) => <DocumentRow key={document.id} document={document} />)}</tbody></table>{filteredDocuments.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No documents match your filters.</p>}</div><div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">Showing {filteredDocuments.length} of {documents.length} documents</div></section>
      {isFormOpen && <DocumentForm onClose={() => { setIsFormOpen(false); reset(); }} register={register} errors={errors} onSubmit={handleSubmit(onSubmit)} />}
    </div>
  );
}

function DocumentRow({ document }: { document: ProjectDocument }) { const styles = { Approved: "bg-emerald-50 text-emerald-700", "In review": "bg-amber-50 text-amber-700", "Needs action": "bg-red-50 text-red-700" }; return <tr className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{document.name}</p><p className="mt-1 text-xs text-slate-500">{document.type}</p></td><td className="px-5 py-4 text-sm text-slate-600">{document.project}</td><td className="px-5 py-4 text-sm text-slate-600">{document.owner}</td><td className="px-5 py-4 text-sm text-slate-600">{document.updated}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[document.status]}`}>{document.status}</span></td></tr>; }
function SummaryCard({ label, value, tone = "teal" }: { label: string; value: string; tone?: "teal" | "amber" | "red" }) { const valueStyles = { teal: "text-slate-900", amber: "text-amber-600", red: "text-red-600" }; return <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${valueStyles[tone]}`}>{value}</p></div>; }

type DocumentFormProps = { onClose: () => void; register: ReturnType<typeof useForm<DocumentFormValues>>["register"]; errors: ReturnType<typeof useForm<DocumentFormValues>>["formState"]["errors"]; onSubmit: FormEventHandler<HTMLFormElement> };
function DocumentForm({ onClose, register, errors, onSubmit }: DocumentFormProps) { const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"; return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/30 p-4" role="dialog" aria-modal="true" aria-labelledby="add-document-title"><form onSubmit={onSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="add-document-title" className="text-lg font-semibold text-slate-900">Add document</h2><p className="mt-1 text-sm text-slate-500">Register a project record for review.</p></div><button type="button" onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><FormField label="Document name" error={errors.name?.message} className="sm:col-span-2"><input {...register("name")} className={inputClass} placeholder="e.g. Updated floor plan" /></FormField><FormField label="Type" error={errors.type?.message}><select {...register("type")} defaultValue="" className={inputClass}><option value="" disabled>Select type</option>{documentTypes.slice(1).map((type) => <option key={type}>{type}</option>)}</select></FormField><FormField label="Project" error={errors.project?.message}><select {...register("project")} defaultValue="" className={inputClass}><option value="" disabled>Select project</option>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></FormField><FormField label="Owner" error={errors.owner?.message}><input {...register("owner")} className={inputClass} placeholder="Team member" /></FormField></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Add document</button></div></form></div>; }
function FormField({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) { return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>; }

export default Documents;
