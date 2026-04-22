import { demoSnapshot } from '@/lib/mock-data';
import { PageCard } from '@/components/page-card';

export const NotificationsPage = () => (
  <PageCard title="Notifications" subtitle="Only connection accepted and comment notifications appear here.">
    <div className="space-y-3">
      {demoSnapshot.notifications.map((notification) => (
        <div key={notification.id} className="rounded-[1.5rem] border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{notification.title}</p>
              <p className="mt-1 text-sm text-slate-500">{notification.body}</p>
            </div>
            {!notification.read ? <span className="h-3 w-3 rounded-full bg-slate-900" /> : null}
          </div>
        </div>
      ))}
    </div>
  </PageCard>
);
