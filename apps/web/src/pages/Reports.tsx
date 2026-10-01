import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";

const projectPerformance = [
  { project: "Riverside", planned: 78, actual: 72 },
  { project: "Northpoint", planned: 55, actual: 48 },
  { project: "Cedar Ave", planned: 38, actual: 31 },
  { project: "Lakeside", planned: 12, actual: 8 },
];

const budgetVariance = [
  { project: "Riverside", variance: -7 },
  { project: "Northpoint", variance: -4 },
  { project: "Cedar Ave", variance: 5 },
  { project: "Lakeside", variance: -13 },
];

const taskStatus = [
  { name: "Done", value: 168, color: "#0f766e" },
  { name: "In progress", value: 74, color: "#f59e0b" },
  { name: "Blocked", value: 42, color: "#dc2626" },
];

function Reports() {
  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-teal-700">Portfolio intelligence</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Reports</h1><p className="mt-1 text-sm text-slate-500">See delivery progress, budget movement, and work health in one place.</p></div><select className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-teal-600" defaultValue="This month" aria-label="Report period"><option>This month</option><option>Last 90 days</option><option>This year</option></select></div>
      <div className="mb-8 grid gap-4 sm:grid-cols-3"><SummaryCard label="Portfolio completion" value="63%" detail="4% ahead of last month" /><SummaryCard label="Budget variance" value="-$24,800" detail="0.6% under plan" tone="amber" /><SummaryCard label="Open risks" value="7" detail="2 need attention" tone="red" /></div>
      <div className="grid gap-6 lg:grid-cols-2"><ChartCard title="Planned vs. actual progress" description="Completion percentage by active project."><ResponsiveContainer width="100%" height="100%"><BarChart data={projectPerformance} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={6}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="project" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => `${value}%`} /><Tooltip formatter={(value) => [`${value}%`, ""]} contentStyle={{ border: "0", borderRadius: "8px", boxShadow: "0 4px 12px rgb(15 23 42 / 0.12)" }} /><Bar dataKey="planned" fill="#cbd5e1" radius={[4, 4, 0, 0]} /><Bar dataKey="actual" fill="#0f766e" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Task health" description="Current status across all active tasks."><div className="flex h-full flex-col items-center justify-center gap-4 sm:flex-row"><div className="h-48 w-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={taskStatus} dataKey="value" nameKey="name" innerRadius={54} outerRadius={76} paddingAngle={3} stroke="none">{taskStatus.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ border: "0", borderRadius: "8px" }} /></PieChart></ResponsiveContainer></div><div className="w-40 space-y-3">{taskStatus.map((item) => <div key={item.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><span className="font-semibold text-slate-900">{item.value}</span></div>)}</div></div></ChartCard></div>
      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="mb-6"><h2 className="font-semibold text-slate-900">Budget variance</h2><p className="mt-1 text-sm text-slate-500">Positive values indicate spend above the approved plan.</p></div><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={budgetVariance} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}><CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => `${value}%`} /><YAxis type="category" dataKey="project" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12 }} width={80} /><Tooltip formatter={(value) => [`${value}%`, "Variance"]} contentStyle={{ border: "0", borderRadius: "8px" }} /><Bar dataKey="variance" radius={[0, 4, 4, 0]} fill="#0f766e" /></BarChart></ResponsiveContainer></div></section>
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: ReactNode }) { return <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="mb-5"><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div><div className="h-64">{children}</div></section>; }
function SummaryCard({ label, value, detail, tone = "teal" }: { label: string; value: string; detail: string; tone?: "teal" | "amber" | "red" }) { const styles = { teal: "text-slate-900", amber: "text-amber-600", red: "text-red-600" }; return <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${styles[tone]}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>; }

export default Reports;
