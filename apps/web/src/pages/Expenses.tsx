import { useMemo, useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const expenseSchema = z.object({
  description: z.string().min(2, "Enter a description."),
  project: z.string().min(1, "Choose a project."),
  category: z.string().min(1, "Choose a category."),
  amount: z.string().min(1, "Enter an amount."),
  date: z.string().min(1, "Choose a date."),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;
type ExpenseStatus = "Paid" | "Pending";

type Expense = {
  id: number;
  description: string;
  project: string;
  category: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
};

const initialExpenses: Expense[] = [
  { id: 1, description: "Concrete delivery - phase 2", project: "Riverside Office Complex", category: "Materials", amount: 18400, date: "Sep 09, 2026", status: "Paid" },
  { id: 2, description: "Crane rental - weekly", project: "Northpoint Distribution Center", category: "Equipment", amount: 7250, date: "Sep 08, 2026", status: "Pending" },
  { id: 3, description: "Permit and inspection fees", project: "Cedar Avenue Renovation", category: "Permits", amount: 3680, date: "Sep 06, 2026", status: "Paid" },
  { id: 4, description: "Temporary site offices", project: "Lakeside Medical Pavilion", category: "Overhead", amount: 5120, date: "Sep 04, 2026", status: "Paid" },
  { id: 5, description: "Electrical supplies", project: "Riverside Office Complex", category: "Materials", amount: 2940, date: "Sep 02, 2026", status: "Pending" },
];

const categories = ["All", "Materials", "Equipment", "Permits", "Overhead", "Labor"];
const projectOptions = ["Riverside Office Complex", "Northpoint Distribution Center", "Cedar Avenue Renovation", "Lakeside Medical Pavilion"];
const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function Expenses() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormValues>({ resolver: zodResolver(expenseSchema) });

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const matchesQuery = `${expense.description} ${expense.project} ${expense.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (categoryFilter === "All" || expense.category === categoryFilter);
  }), [expenses, query, categoryFilter]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pending = expenses.filter((expense) => expense.status === "Pending").reduce((sum, expense) => sum + expense.amount, 0);

  function onSubmit(values: ExpenseFormValues) {
    setExpenses((currentExpenses) => [{ id: Date.now(), description: values.description, project: values.project, category: values.category, amount: Number(values.amount), date: new Date(`${values.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }), status: "Pending" }, ...currentExpenses]);
    reset();
    setIsFormOpen(false);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-teal-700">Financial control</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Expenses</h1><p className="mt-1 text-sm text-slate-500">Track project spending before small variances become large surprises.</p></div><button type="button" onClick={() => setIsFormOpen(true)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800">+ Add expense</button></div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3"><SummaryCard label="Total recorded" value={currencyFormatter.format(total)} /><SummaryCard label="Pending payment" value={currencyFormatter.format(pending)} tone="amber" /><SummaryCard label="Transactions" value={String(expenses.length)} /></div>
      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"><div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between"><label className="relative block lg:w-80"><span className="sr-only">Search expenses</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search expenses..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /><span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span></label><div className="flex flex-wrap gap-2">{categories.map((category) => <button key={category} type="button" onClick={() => setCategoryFilter(category)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${categoryFilter === category ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{category}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Expense</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)}</tbody></table>{filteredExpenses.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No expenses match your filters.</p>}</div><div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">Showing {filteredExpenses.length} of {expenses.length} expenses</div></section>
      {isFormOpen && <ExpenseForm onClose={() => { setIsFormOpen(false); reset(); }} register={register} errors={errors} onSubmit={handleSubmit(onSubmit)} />}
    </div>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) { return <tr className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{expense.description}</p><p className="mt-1 text-xs text-slate-500">{expense.project}</p></td><td className="px-5 py-4 text-sm text-slate-600">{expense.category}</td><td className="px-5 py-4 text-sm font-semibold text-slate-800">{currencyFormatter.format(expense.amount)}</td><td className="px-5 py-4 text-sm text-slate-600">{expense.date}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${expense.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{expense.status}</span></td></tr>; }
function SummaryCard({ label, value, tone = "teal" }: { label: string; value: string; tone?: "teal" | "amber" }) { return <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${tone === "amber" ? "text-amber-600" : "text-slate-900"}`}>{value}</p></div>; }

type ExpenseFormProps = { onClose: () => void; register: ReturnType<typeof useForm<ExpenseFormValues>>["register"]; errors: ReturnType<typeof useForm<ExpenseFormValues>>["formState"]["errors"]; onSubmit: FormEventHandler<HTMLFormElement> };
function ExpenseForm({ onClose, register, errors, onSubmit }: ExpenseFormProps) { const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"; return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/30 p-4" role="dialog" aria-modal="true" aria-labelledby="add-expense-title"><form onSubmit={onSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="add-expense-title" className="text-lg font-semibold text-slate-900">Add expense</h2><p className="mt-1 text-sm text-slate-500">Record a project cost for review.</p></div><button type="button" onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><FormField label="Description" error={errors.description?.message} className="sm:col-span-2"><input {...register("description")} className={inputClass} placeholder="e.g. Site equipment rental" /></FormField><FormField label="Project" error={errors.project?.message}><select {...register("project")} defaultValue="" className={inputClass}><option value="" disabled>Select project</option>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></FormField><FormField label="Category" error={errors.category?.message}><select {...register("category")} defaultValue="" className={inputClass}><option value="" disabled>Select category</option>{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></FormField><FormField label="Amount ($)" error={errors.amount?.message}><input {...register("amount")} type="number" min="0" className={inputClass} placeholder="1500" /></FormField><FormField label="Date" error={errors.date?.message}><input {...register("date")} type="date" className={inputClass} /></FormField></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Add expense</button></div></form></div>; }
function FormField({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) { return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>; }

export default Expenses;
