import { useParams } from 'react-router-dom';
import { demoSnapshot } from '@/lib/mock-data';
import { PageCard } from '@/components/page-card';

export const ProfilePage = () => {
  const { username } = useParams();
  const profile = demoSnapshot.connections.find((item) => item.username === username) ?? demoSnapshot.connections[0];

  return (
    <div className="space-y-6">
      <PageCard title={profile.displayName} subtitle={`@${profile.username}`}>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>Mutual connection</span>
          {profile.isChildAccount ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Family-linked account</span>
          ) : null}
        </div>
      </PageCard>
      <PageCard title="Posts" subtitle="Visible because this profile is connected.">
        <div className="rounded-[1.5rem] border border-slate-200 p-4 text-sm text-slate-600">
          Old posts remain visible on profile after leaving the 14-day feed window.
        </div>
      </PageCard>
    </div>
  );
};
