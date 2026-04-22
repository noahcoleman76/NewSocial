import { demoSnapshot } from '@/lib/mock-data';
import { PageCard } from '@/components/page-card';

export const ConnectionsPage = () => (
  <div className="grid gap-6 lg:grid-cols-2">
    <PageCard title="Connected" subtitle="Mutual connections with profile and messaging access.">
      <div className="space-y-3">
        {demoSnapshot.connections.map((connection) => (
          <div key={connection.id} className="rounded-[1.5rem] border border-slate-200 p-4">
            <p className="font-medium">{connection.displayName}</p>
            <p className="text-sm text-slate-500">@{connection.username}</p>
          </div>
        ))}
      </div>
    </PageCard>
    <PageCard title="Requests" subtitle="Pending requests stay open until canceled or matched.">
      <div className="space-y-3">
        <div className="rounded-[1.5rem] border border-slate-200 p-4">
          <p className="font-medium">Alex Rivera</p>
          <p className="text-sm text-slate-500">Outgoing request pending</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 p-4">
          <p className="font-medium">Avery Parent-Linked</p>
          <p className="text-sm text-slate-500">Incoming request includes family visibility notice</p>
        </div>
      </div>
    </PageCard>
  </div>
);
