import { PageCard } from '@/components/page-card';

export const PostPage = () => (
  <PageCard title="Post" subtitle="Comments are rendered oldest-first and can be removed by the commenter or post owner.">
    <article className="rounded-[1.5rem] border border-slate-200 p-5">
      <p className="font-medium">Jamie Brooks</p>
      <p className="mt-3 text-sm text-slate-600">A quiet dinner with cousins and no phones on the table.</p>
    </article>
    <div className="mt-4 space-y-3">
      <div className="rounded-[1.5rem] border border-slate-200 p-4">
        <p className="text-sm text-slate-500">Morgan Parent</p>
        <p className="mt-1">Looks calm and good.</p>
      </div>
      <div className="rounded-[1.5rem] border border-slate-200 p-4">
        <p className="text-sm text-slate-500">Riley Chen</p>
        <p className="mt-1">Glad you had time together.</p>
      </div>
    </div>
  </PageCard>
);
