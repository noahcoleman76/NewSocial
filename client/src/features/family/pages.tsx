import { PageCard } from '@/components/page-card';

export const FamilyPage = () => (
  <div className="space-y-6">
    <PageCard title="Family" subtitle="Parent-managed child accounts stay visibly linked and parents retain message visibility.">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 p-4">
          <p className="font-medium">Avery Parent-Linked</p>
          <p className="text-sm text-slate-500">@child.one</p>
          <p className="mt-3 text-sm text-slate-600">One-time code: ABC12345</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 p-4">
          <p className="font-medium">Rowan Parent-Linked</p>
          <p className="text-sm text-slate-500">@child.two</p>
          <p className="mt-3 text-sm text-slate-600">One-time code: XYZ67890</p>
        </div>
      </div>
    </PageCard>
    <PageCard title="Create child account" subtitle="Parents generate child credentials and initial access codes here.">
      <form className="grid gap-4 md:grid-cols-3">
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Display name" />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Username" />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" />
      </form>
    </PageCard>
  </div>
);

export const FamilyChildPage = () => (
  <PageCard title="Child account" subtitle="Parents can release this account into a standard account or delete it permanently.">
    <div className="flex flex-wrap gap-3">
      <button className="rounded-full border border-amber-200 px-5 py-3 text-sm font-medium text-amber-700">Release child account</button>
      <button className="rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700">Delete child account</button>
    </div>
  </PageCard>
);

export const FamilyChildMessagesPage = () => (
  <PageCard title="Child messages" subtitle="Parent visibility is read-only and covers all direct messages.">
    <div className="rounded-[1.5rem] border border-slate-200 p-4">
      <p className="text-sm text-slate-500">Jamie Brooks</p>
      <p className="mt-2">Checking in after school.</p>
    </div>
  </PageCard>
);

export const FamilyChildConnectionsPage = () => (
  <PageCard title="Child connections" subtitle="Parents can review, request, and cancel child connection requests.">
    <div className="rounded-[1.5rem] border border-slate-200 p-4 text-sm text-slate-600">
      Family-linked connection requests disclose that parent visibility may apply.
    </div>
  </PageCard>
);
