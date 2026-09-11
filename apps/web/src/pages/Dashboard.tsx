import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const progressData = [
  { month: "Jan", progress: 18 },
  { month: "Feb", progress: 27 },
  { month: "Mar", progress: 35 },
  { month: "Apr", progress: 44 },
  { month: "May", progress: 54 },
  { month: "Jun", progress: 63 },
];

const budgetData = [
  { project: "Riverside", budget: 820, actual: 760 },
  { project: "Northpoint", budget: 640, actual: 590 },
  { project: "Cedar Ave", budget: 520, actual: 548 },
  { project: "Lakeside", budget: 460, actual: 401 },
];

const taskData = [
  { name: "Completed", value: 168, color: "#0f766e" },
  { name: "In progress", value: 74, color: "#f59e0b" },
  { name: "Blocked", value: 42, color: "#dc2626" },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Overview of your construction projects and operations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Projects"
          value="12"
          description="Active projects"
        />

        <DashboardCard
          title="Active Tasks"
          value="284"
          description="Tasks across projects"
        />

        <DashboardCard
          title="Budget"
          value="$4.5M"
          description="Total project budget"
        />

        <DashboardCard
          title="Completion"
          value="63%"
          description="Overall project progress"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Project Progress
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current progress across active projects.
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, "Progress"]} contentStyle={{ border: "0", borderRadius: "8px", boxShadow: "0 4px 12px rgb(15 23 42 / 0.12)" }} />
                <Line type="monotone" dataKey="progress" stroke="#0f766e" strokeWidth={3} dot={{ fill: "#0f766e", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold text-slate-900">
            Recent Activity
          </h2>

          <div className="mt-6 space-y-5">
            <Activity
              text="New task assigned"
              time="10 minutes ago"
            />

            <Activity
              text="Project budget updated"
              time="1 hour ago"
            />

            <Activity
              text="Daily site report submitted"
              time="3 hours ago"
            />

            <Activity
              text="New team member added"
              time="Yesterday"
            />
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Budget vs. actual</h2>
              <p className="mt-1 text-sm text-slate-500">Spend in thousands across active projects.</p>
            </div>
            <div className="flex shrink-0 gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-300" />Budget</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-teal-700" />Actual</span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={6}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="project" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => [currencyFormatter.format(Number(value) * 1000), ""]} contentStyle={{ border: "0", borderRadius: "8px", boxShadow: "0 4px 12px rgb(15 23 42 / 0.12)" }} />
                <Bar dataKey="budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-2">
            <h2 className="font-semibold text-slate-900">Task completion</h2>
            <p className="mt-1 text-sm text-slate-500">284 tasks across all projects.</p>
          </div>

          <div className="relative h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={78} paddingAngle={3} stroke="none">
                  {taskData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ border: "0", borderRadius: "8px", boxShadow: "0 4px 12px rgb(15 23 42 / 0.12)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">59%</span>
              <span className="text-xs text-slate-500">complete</span>
            </div>
          </div>

          <div className="space-y-3">
            {taskData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                <span className="font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

type DashboardCardProps = {
  title: string;
  value: string;
  description: string;
};

function DashboardCard({
  title,
  value,
  description,
}: DashboardCardProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Activity({
  text,
  time,
}: {
  text: string;
  time: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-900" />

      <div>
        <p className="text-sm font-medium text-slate-800">
          {text}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {time}
        </p>
      </div>
    </div>
  );
}

export default Dashboard;