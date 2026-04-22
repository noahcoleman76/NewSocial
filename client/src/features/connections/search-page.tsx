import { demoSnapshot } from '@/lib/mock-data';
import { PageCard } from '@/components/page-card';

export const SearchPage = () => (
  <PageCard title="Search" subtitle="Basic profile discovery only. Posts stay hidden until a mutual connection exists.">
    <input className="mb-4 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Search username or display name" />
    <div className="space-y-3">
      {demoSnapshot.connections.map((connection) => (
        <div key={connection.id} className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 p-4">
          <div>
            <p className="font-medium">{connection.displayName}</p>
            <p className="text-sm text-slate-500">@{connection.username}</p>
          </div>
          {connection.isChildAccount ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Family-linked account
            </span>
          ) : null}
        </div>
      ))}
    </div>
  </PageCard>
);
