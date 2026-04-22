import { PageCard } from '@/components/page-card';

export const SettingsPage = () => (
  <div className="space-y-6">
    <PageCard title="Settings" subtitle="Update your profile and account details.">
      <form className="grid gap-4 md:grid-cols-2">
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Display name" />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Username" />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="New password" type="password" />
        <textarea className="md:col-span-2 min-h-28 rounded-[1.5rem] border border-slate-200 px-4 py-3" placeholder="Bio" />
      </form>
    </PageCard>
    <PageCard title="Delete account" subtitle="Parent accounts must choose whether to delete or release child accounts first.">
      <div className="flex flex-wrap gap-3">
        <button className="rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700">Delete children and account</button>
        <button className="rounded-full border border-amber-200 px-5 py-3 text-sm font-medium text-amber-700">Release children and delete account</button>
      </div>
    </PageCard>
  </div>
);
