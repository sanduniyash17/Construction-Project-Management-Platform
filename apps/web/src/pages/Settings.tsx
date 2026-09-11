import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

function Settings() {
  const [saved, setSaved] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState(true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8"><p className="text-sm font-medium text-teal-700">Workspace preferences</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Settings</h1><p className="mt-1 text-sm text-slate-500">Manage your profile and how BuildFlow keeps you informed.</p></div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="mb-6"><h2 className="font-semibold text-slate-900">Profile</h2><p className="mt-1 text-sm text-slate-500">The details shown to your project team.</p></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><input className="settings-input" defaultValue="BuildFlow User" /></Field><Field label="Role"><input className="settings-input" defaultValue="Project Manager" /></Field><Field label="Email address"><input className="settings-input" type="email" defaultValue="manager@buildflow.com" /></Field><Field label="Phone number"><input className="settings-input" type="tel" placeholder="Add phone number" /></Field></div></section>
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="mb-6"><h2 className="font-semibold text-slate-900">Notifications</h2><p className="mt-1 text-sm text-slate-500">Choose which updates arrive in your inbox.</p></div><div className="divide-y divide-slate-100"><Toggle label="Project updates" description="Get notified when projects change status or progress." checked={emailUpdates} onChange={setEmailUpdates} /><Toggle label="Weekly digest" description="Receive a summary of activity across your portfolio." checked={weeklyDigest} onChange={setWeeklyDigest} /><Toggle label="Risk alerts" description="Be notified when a task is blocked or a document needs action." checked={riskAlerts} onChange={setRiskAlerts} /></div></section>
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="mb-6"><h2 className="font-semibold text-slate-900">Workspace defaults</h2><p className="mt-1 text-sm text-slate-500">Set the defaults used when you review project information.</p></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Default project"><select className="settings-input" defaultValue="All projects"><option>All projects</option><option>Riverside Office Complex</option><option>Northpoint Distribution Center</option></select></Field><Field label="Currency"><select className="settings-input" defaultValue="USD - US Dollar"><option>USD - US Dollar</option><option>CAD - Canadian Dollar</option><option>EUR - Euro</option></select></Field></div></section>
        <div className="flex items-center justify-end gap-4"><span className={`text-sm text-emerald-700 transition-opacity ${saved ? "opacity-100" : "opacity-0"}`}>Settings saved</span><button type="submit" className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800">Save changes</button></div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex cursor-pointer items-center justify-between gap-4 py-4"><span><span className="block text-sm font-medium text-slate-800">{label}</span><span className="mt-1 block text-xs text-slate-500">{description}</span></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-teal-700" /></label>; }

export default Settings;
