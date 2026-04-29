import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/auth-store';
import { useNotifications } from '@/features/notifications/use-notifications';
import logoMain from '@/assets/logo-main.png';

type NavIconName = 'feed' | 'search' | 'messages' | 'notifications' | 'connections' | 'settings' | 'family' | 'admin';

type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
};

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `relative inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm transition ${
    isActive ? 'bg-[#FF5A2F] text-[#0D0D0D]' : 'text-[#F5F5F5]/70 hover:bg-white/12 hover:text-[#F5F5F5]'
  }`;

const iconPaths: Record<NavIconName, string> = {
  feed: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Zm4 1.5h8M8 12h8M8 16h5',
  search: 'm19 19-4.2-4.2M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z',
  messages: 'M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4.2A2.5 2.5 0 0 1 5 12.5v-6Z',
  notifications: 'M15 17H9m8-2V10a5 5 0 0 0-10 0v5l-2 2h14l-2-2Zm-5 5a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Z',
  connections: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19a4.5 4.5 0 0 1 9 0M11.5 19a4.5 4.5 0 0 1 9 0',
  settings: 'M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Zm7.5-3.5a7.6 7.6 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7.2 7.2 0 0 0-2-1.2L14.2 3h-4.4l-.3 2.6a7.2 7.2 0 0 0-2 1.2l-2.4-1-2 3.5 2 1.5A7.6 7.6 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-1a7.2 7.2 0 0 0 2 1.2l.3 2.6h4.4l.3-2.6a7.2 7.2 0 0 0 2-1.2l2.4 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z',
  family: 'M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9a6 6 0 0 1 12 0M5.5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2 20a4 4 0 0 1 5-3.9M18.5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM22 20a4 4 0 0 0-5-3.9',
  admin: 'M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-5',
};

const NavIcon = ({ name }: { name: NavIconName }) => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d={iconPaths[name]} />
  </svg>
);

export const AppShell = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const notificationsQuery = useNotifications();
  const hasUnreadNotifications = Boolean(notificationsQuery.data?.some((notification) => !notification.read));

  const navItems: NavItem[] = [
    { href: '/feed', label: 'Feed', icon: 'feed' },
    { href: '/search', label: 'Search', icon: 'search' },
    { href: '/messages', label: 'Messages', icon: 'messages' },
    { href: '/notifications', label: 'Notifications', icon: 'notifications' },
    { href: '/connections', label: 'Connections', icon: 'connections' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
  ];

  if (user?.role === 'STANDARD') {
    navItems.push({ href: '/family', label: 'Family', icon: 'family' });
  }

  if (user?.role === 'ADMIN') {
    navItems.push({ href: '/admin', label: 'Admin', icon: 'admin' });
  }

  return (
    <div className="min-h-screen bg-transparent text-[#F5F5F5]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        <aside className="rounded-[2rem] border border-white/10 bg-[#211f1d]/92 p-4 shadow-[0_24px_90px_-60px_rgba(255,90,47,0.42)] backdrop-blur lg:w-72">
          <div className="mb-8">
            <img alt="NewSocial" className="h-auto max-h-12 w-auto max-w-[180px] object-contain" src={logoMain} />
            <Link className="block" to={user ? `/profile/${user.username}` : '/feed'}>
              <h1 className="mt-2 text-2xl font-semibold">{user?.displayName ?? 'Private network'}</h1>
              <p className="mt-1 text-sm text-[#F5F5F5]/60">@{user?.username}</p>
            </Link>
          </div>
          <nav aria-label="Primary" className="flex flex-wrap gap-2 lg:flex-col">
            {navItems.map((item) => (
              <NavLink key={item.href} to={item.href} className={linkClass} title={item.label} aria-label={item.label}>
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
                {item.href === '/notifications' && hasUnreadNotifications ? (
                  <span aria-label="Unread notifications" className="ml-auto h-2 w-2 rounded-full bg-[#FF5A2F]" />
                ) : null}
              </NavLink>
            ))}
          </nav>
          <button
            className="mt-6 rounded-full border border-white/10 px-4 py-2 text-sm text-[#F5F5F5]/70 transition hover:bg-white/12 hover:text-[#F5F5F5]"
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

