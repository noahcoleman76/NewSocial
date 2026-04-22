import { demoSnapshot } from '@/lib/mock-data';
import { PageCard } from '@/components/page-card';

export const FeedPage = () => (
  <div className="space-y-6">
    <PageCard title="Feed" subtitle="Chronological posts from mutual connections, limited to the last 14 days.">
      <div className="space-y-4">
        {demoSnapshot.feed.map((item) =>
          item.type === 'post' ? (
            <article key={item.postId} className="rounded-[1.5rem] border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.author.displayName}</p>
                  <p className="text-sm text-slate-500">@{item.author.username}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-700">{item.caption}</p>
              <div className="mt-4 flex gap-4 text-sm text-slate-500">
                <span>{item.likeCount} likes</span>
                <span>{item.commentCount} comments</span>
              </div>
            </article>
          ) : (
            <article key={item.id} className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Sponsored placement</p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
            </article>
          ),
        )}
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">You&apos;re caught up.</p>
    </PageCard>
  </div>
);
