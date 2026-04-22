import { PageCard } from '@/components/page-card';

export const AdminHomePage = () => (
  <PageCard title="Admin" subtitle="Moderation tools for reports, users, posts, and audit history.">
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-[1.5rem] border border-slate-200 p-4">Open reports</div>
      <div className="rounded-[1.5rem] border border-slate-200 p-4">Account moderation</div>
      <div className="rounded-[1.5rem] border border-slate-200 p-4">Audit log</div>
    </div>
  </PageCard>
);

export const AdminReportsPage = () => (
  <PageCard title="Reports" subtitle="Message reports include surrounding context for review.">
    <div className="space-y-3">
      <div className="rounded-[1.5rem] border border-slate-200 p-4">
        <p className="font-medium">Reported post</p>
        <p className="mt-1 text-sm text-slate-500">Reason: Possible privacy concern</p>
      </div>
      <div className="rounded-[1.5rem] border border-slate-200 p-4">
        <p className="font-medium">Reported message</p>
        <p className="mt-1 text-sm text-slate-500">Context window preserved for admin review</p>
      </div>
    </div>
  </PageCard>
);

export const AdminUsersPage = () => (
  <PageCard title="Users" subtitle="Admins can disable, enable, or delete accounts. Child enablement still requires an active parent.">
    <div className="space-y-3">
      <div className="rounded-[1.5rem] border border-slate-200 p-4">Morgan Parent</div>
      <div className="rounded-[1.5rem] border border-slate-200 p-4">Disabled Standard</div>
    </div>
  </PageCard>
);

export const AdminAuditPage = () => (
  <PageCard title="Audit log" subtitle="Administrative account actions are recorded with actor and timestamp metadata.">
    <div className="rounded-[1.5rem] border border-slate-200 p-4">
      <p className="font-medium">DISABLE_ACCOUNT</p>
      <p className="mt-1 text-sm text-slate-500">Admin User disabled Disabled Standard on 2026-04-22.</p>
    </div>
  </PageCard>
);
