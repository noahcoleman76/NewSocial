import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/auth-store';
import { useNotifications } from '@/features/notifications/use-notifications';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white'}`;

export const AppShell = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const notificationsQuery = useNotifications();
  const hasUnreadNotifications = Boolean(notificationsQuery.data?.some((notification) => !notification.read));

  const navItems = [
    ['/feed', 'Feed'],
    ['/search', 'Search'],
    ['/messages', 'Messages'],
    ['/notifications', 'Notifications'],
    ['/connections', 'Connections'],
    ['/settings', 'Settings'],
  ];

  if (user?.role === 'STANDARD') {
    navItems.push(['/family', 'Family']);
  }

  if (user?.role === 'ADMIN') {
    navItems.push(['/admin', 'Admin']);
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        <aside className="rounded-[2rem] border border-white/80 bg-white/80 p-4 shadow-[0_20px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur lg:w-72">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">NewSocial</p>
            <Link className="block" to={user ? `/profile/${user.username}` : '/feed'}>
              <h1 className="mt-2 text-2xl font-semibold">{user?.displayName ?? 'Private network'}</h1>
              <p className="mt-1 text-sm text-slate-500">@{user?.username}</p>
            </Link>
          </div>
          <nav className="flex flex-wrap gap-2 lg:flex-col">
            {navItems.map(([href, label]) => (
              <NavLink key={href} to={href} className={linkClass}>
                <span className="inline-flex items-center gap-2">
                  {label}
                  {href === '/notifications' && hasUnreadNotifications ? (
                    <span aria-label="Unread notifications" className="text-base leading-none">
                      *
                    </span>
                  ) : null}
                </span>
              </NavLink>
            ))}
          </nav>
          <button
            className="mt-6 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-white"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
            type="button"
          >
            Log out
          </button>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
