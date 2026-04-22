import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { PageCard } from '@/components/page-card';

const AuthLayout = ({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) => (
  <div className="flex min-h-screen items-center justify-center px-4 py-10">
    <div className="w-full max-w-xl">
      <PageCard title={title} subtitle={subtitle}>
        {children}
      </PageCard>
    </div>
  </div>
);

export const AuthPage = ({ mode }: { mode: 'login' | 'register' }) => (
  <AuthLayout
    title={mode === 'login' ? 'Sign in' : 'Create account'}
    subtitle={
      mode === 'login'
        ? 'Use your email and password. Child accounts use the separate access flow the first time.'
        : 'Create a standard account. Parent-managed child accounts are created from the family area.'
    }
  >
    <form className="space-y-4">
      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" />
      {mode === 'register' ? <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Username" /> : null}
      {mode === 'register' ? <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Display name" /> : null}
      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Password" type="password" />
      <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
    </form>
    <div className="mt-6 flex gap-4 text-sm text-slate-500">
      <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Create a standard account' : 'Already have an account?'}</Link>
      <Link to="/child-access">Child first-time access</Link>
    </div>
  </AuthLayout>
);

export const ChildAccessPage = () => (
  <AuthLayout title="Child first-time access" subtitle="Enter the email and one-time code created by your parent or family manager.">
    <form className="space-y-4">
      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" />
      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="One-time access code" />
      <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">Continue</button>
    </form>
  </AuthLayout>
);

export const ChildSetPasswordPage = () => (
  <AuthLayout title="Set child password" subtitle="This step is required after first-time code login. Future sign-ins use email and password.">
    <form className="space-y-4">
      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="New password" type="password" />
      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Confirm password" type="password" />
      <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">Set password</button>
    </form>
  </AuthLayout>
);
