import { useMemo, useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const memberSchema = z.object({
  name: z.string().min(2, "Enter a name."),
  email: z.string().email("Enter a valid email."),
  role: z.string().min(2, "Enter a role."),
  project: z.string().min(1, "Choose a project."),
});

type MemberFormValues = z.infer<typeof memberSchema>;
type MemberStatus = "Active" | "Invited";

type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
  project: string;
  status: MemberStatus;
  initials: string;
  color: string;
};

const initialMembers: Member[] = [
  { id: 1, name: "Maya Chen", email: "maya.chen@buildflow.com", role: "Project Manager", project: "Riverside Office Complex", status: "Active", initials: "MC", color: "bg-teal-700" },
  { id: 2, name: "Jordan Lee", email: "jordan.lee@buildflow.com", role: "Site Supervisor", project: "Northpoint Distribution Center", status: "Active", initials: "JL", color: "bg-slate-700" },
  { id: 3, name: "Sam Rivera", email: "sam.rivera@buildflow.com", role: "Procurement Lead", project: "Cedar Avenue Renovation", status: "Active", initials: "SR", color: "bg-amber-600" },
  { id: 4, name: "Alex Morgan", email: "alex.morgan@buildflow.com", role: "Safety Coordinator", project: "Riverside Office Complex", status: "Active", initials: "AM", color: "bg-indigo-600" },
  { id: 5, name: "Taylor Brooks", email: "taylor.brooks@example.com", role: "Estimator", project: "Lakeside Medical Pavilion", status: "Invited", initials: "TB", color: "bg-slate-400" },
];

const projectOptions = ["Riverside Office Complex", "Northpoint Distribution Center", "Cedar Avenue Renovation", "Lakeside Medical Pavilion"];

function Team() {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | MemberStatus>("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MemberFormValues>({ resolver: zodResolver(memberSchema) });

  const filteredMembers = useMemo(() => members.filter((member) => {
    const matchesQuery = `${member.name} ${member.email} ${member.role} ${member.project}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === "All" || member.status === statusFilter);
  }), [members, query, statusFilter]);

  function onSubmit(values: MemberFormValues) {
    const initials = values.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    setMembers((currentMembers) => [{ id: Date.now(), name: values.name, email: values.email, role: values.role, project: values.project, status: "Invited", initials, color: "bg-slate-400" }, ...currentMembers]);
    reset();
    setIsFormOpen(false);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-teal-700">People and permissions</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Team</h1><p className="mt-1 text-sm text-slate-500">Coordinate the people delivering your construction projects.</p></div>
        <button type="button" onClick={() => setIsFormOpen(true)} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800">+ Add member</button>
      </div>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between"><label className="relative block lg:w-80"><span className="sr-only">Search team</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search team..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /><span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span></label><div className="flex gap-2"><button type="button" onClick={() => setStatusFilter("All")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusFilter === "All" ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>All members</button><button type="button" onClick={() => setStatusFilter("Active")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusFilter === "Active" ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>Active</button><button type="button" onClick={() => setStatusFilter("Invited")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusFilter === "Invited" ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>Invited</button></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Member</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Project</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredMembers.map((member) => <MemberRow key={member.id} member={member} />)}</tbody></table>{filteredMembers.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No team members match your filters.</p>}</div>
        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">Showing {filteredMembers.length} of {members.length} team members</div>
      </section>
      {isFormOpen && <MemberForm onClose={() => { setIsFormOpen(false); reset(); }} register={register} errors={errors} onSubmit={handleSubmit(onSubmit)} />}
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  return <tr className="hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${member.color}`}>{member.initials}</div><div><p className="font-semibold text-slate-900">{member.name}</p><p className="mt-1 text-xs text-slate-500">{member.email}</p></div></div></td><td className="px-5 py-4 text-sm text-slate-700">{member.role}</td><td className="px-5 py-4 text-sm text-slate-600">{member.project}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${member.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{member.status}</span></td></tr>;
}

type MemberFormProps = { onClose: () => void; register: ReturnType<typeof useForm<MemberFormValues>>["register"]; errors: ReturnType<typeof useForm<MemberFormValues>>["formState"]["errors"]; onSubmit: FormEventHandler<HTMLFormElement> };

function MemberForm({ onClose, register, errors, onSubmit }: MemberFormProps) {
  const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/30 p-4" role="dialog" aria-modal="true" aria-labelledby="add-member-title"><form onSubmit={onSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="add-member-title" className="text-lg font-semibold text-slate-900">Add team member</h2><p className="mt-1 text-sm text-slate-500">Send an invitation to a project collaborator.</p></div><button type="button" onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><FormField label="Full name" error={errors.name?.message}><input {...register("name")} className={inputClass} placeholder="Full name" /></FormField><FormField label="Email" error={errors.email?.message}><input {...register("email")} type="email" className={inputClass} placeholder="name@company.com" /></FormField><FormField label="Role" error={errors.role?.message}><input {...register("role")} className={inputClass} placeholder="e.g. Site Supervisor" /></FormField><FormField label="Project" error={errors.project?.message}><select {...register("project")} defaultValue="" className={inputClass}><option value="" disabled>Select project</option>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></FormField></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Send invitation</button></div></form></div>;
}

function FormField({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>;
}

export default Team;
