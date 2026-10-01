import { useMemo, useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const materialSchema = z.object({
  name: z.string().min(2, "Enter a material name."),
  category: z.string().min(1, "Choose a category."),
  project: z.string().min(1, "Choose a project."),
  quantity: z.string().min(1, "Enter a quantity."),
  unit: z.string().min(1, "Choose a unit."),
});

type MaterialFormValues = z.infer<typeof materialSchema>;
type StockStatus = "In stock" | "Low stock" | "Out of stock";

type Material = {
  id: number;
  name: string;
  category: string;
  project: string;
  quantity: number;
  unit: string;
  reorderAt: number;
};

const initialMaterials: Material[] = [
  { id: 1, name: "Ready-mix concrete", category: "Concrete", project: "Riverside Office Complex", quantity: 84, unit: "cubic yd", reorderAt: 30 },
  { id: 2, name: "Rebar #5", category: "Steel", project: "Northpoint Distribution Center", quantity: 18, unit: "tons", reorderAt: 25 },
  { id: 3, name: "Copper conduit", category: "Electrical", project: "Lakeside Medical Pavilion", quantity: 420, unit: "linear ft", reorderAt: 100 },
  { id: 4, name: "Framing lumber", category: "Lumber", project: "Cedar Avenue Renovation", quantity: 0, unit: "pieces", reorderAt: 60 },
  { id: 5, name: "Insulation batts", category: "Insulation", project: "Riverside Office Complex", quantity: 126, unit: "packs", reorderAt: 40 },
];

const categories = ["All", "Concrete", "Steel", "Electrical", "Lumber", "Insulation"];
const projectOptions = ["Riverside Office Complex", "Northpoint Distribution Center", "Cedar Avenue Renovation", "Lakeside Medical Pavilion"];
const units = ["pieces", "tons", "cubic yd", "linear ft", "packs"];

function Materials() {
  const [materials, setMaterials] = useState(initialMaterials);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaterialFormValues>({ resolver: zodResolver(materialSchema) });

  const filteredMaterials = useMemo(() => materials.filter((material) => {
    const matchesQuery = `${material.name} ${material.project} ${material.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (categoryFilter === "All" || material.category === categoryFilter);
  }), [materials, query, categoryFilter]);

  function onSubmit(values: MaterialFormValues) {
    setMaterials((currentMaterials) => [{ id: Date.now(), name: values.name, category: values.category, project: values.project, quantity: Number(values.quantity), unit: values.unit, reorderAt: 10 }, ...currentMaterials]);
    reset();
    setIsFormOpen(false);
  }

  const lowStockCount = materials.filter((material) => getStockStatus(material) !== "In stock").length;

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-teal-700">Site inventory</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Materials</h1><p className="mt-1 text-sm text-slate-500">Keep materials visible, available, and ready for the next phase of work.</p></div><button type="button" onClick={() => setIsFormOpen(true)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800">+ Add material</button></div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3"><SummaryCard label="Tracked materials" value={String(materials.length)} /><SummaryCard label="Low or out of stock" value={String(lowStockCount)} tone="amber" /><SummaryCard label="Active projects" value={String(new Set(materials.map((material) => material.project)).size)} /></div>
      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"><div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between"><label className="relative block lg:w-80"><span className="sr-only">Search materials</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search materials..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /><span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span></label><div className="flex flex-wrap gap-2">{categories.map((category) => <button key={category} type="button" onClick={() => setCategoryFilter(category)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${categoryFilter === category ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{category}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Material</th><th className="px-5 py-3">Project</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Stock status</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredMaterials.map((material) => <MaterialRow key={material.id} material={material} />)}</tbody></table>{filteredMaterials.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No materials match your filters.</p>}</div><div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">Showing {filteredMaterials.length} of {materials.length} materials</div></section>
      {isFormOpen && <MaterialForm onClose={() => { setIsFormOpen(false); reset(); }} register={register} errors={errors} onSubmit={handleSubmit(onSubmit)} />}
    </div>
  );
}

function getStockStatus(material: Material): StockStatus { if (material.quantity === 0) return "Out of stock"; if (material.quantity <= material.reorderAt) return "Low stock"; return "In stock"; }

function MaterialRow({ material }: { material: Material }) { const status = getStockStatus(material); const styles = { "In stock": "bg-emerald-50 text-emerald-700", "Low stock": "bg-amber-50 text-amber-700", "Out of stock": "bg-red-50 text-red-700" }; return <tr className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{material.name}</p><p className="mt-1 text-xs text-slate-500">{material.category}</p></td><td className="px-5 py-4 text-sm text-slate-600">{material.project}</td><td className="px-5 py-4 text-sm font-medium text-slate-700">{material.quantity.toLocaleString()} {material.unit}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span></td></tr>; }

function SummaryCard({ label, value, tone = "teal" }: { label: string; value: string; tone?: "teal" | "amber" }) { return <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${tone === "amber" ? "text-amber-600" : "text-slate-900"}`}>{value}</p></div>; }

type MaterialFormProps = { onClose: () => void; register: ReturnType<typeof useForm<MaterialFormValues>>["register"]; errors: ReturnType<typeof useForm<MaterialFormValues>>["formState"]["errors"]; onSubmit: FormEventHandler<HTMLFormElement> };
function MaterialForm({ onClose, register, errors, onSubmit }: MaterialFormProps) { const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"; return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/30 p-4" role="dialog" aria-modal="true" aria-labelledby="add-material-title"><form onSubmit={onSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="add-material-title" className="text-lg font-semibold text-slate-900">Add material</h2><p className="mt-1 text-sm text-slate-500">Track a material assigned to a project.</p></div><button type="button" onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><FormField label="Material name" error={errors.name?.message}><input {...register("name")} className={inputClass} placeholder="e.g. Drywall panels" /></FormField><FormField label="Category" error={errors.category?.message}><input {...register("category")} className={inputClass} placeholder="e.g. Finishes" /></FormField><FormField label="Project" error={errors.project?.message}><select {...register("project")} defaultValue="" className={inputClass}><option value="" disabled>Select project</option>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></FormField><FormField label="Quantity" error={errors.quantity?.message}><input {...register("quantity")} type="number" min="0" className={inputClass} placeholder="100" /></FormField><FormField label="Unit" error={errors.unit?.message}><select {...register("unit")} defaultValue="" className={inputClass}><option value="" disabled>Select unit</option>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></FormField></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Add material</button></div></form></div>; }

function FormField({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) { return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>; }

export default Materials;
