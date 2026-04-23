import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  childFirstLoginSchema,
  childSetPasswordSchema,
  loginSchema,
  registerSchema,
} from '@shared/validators/auth';
import { useAuthStore } from '@/app/auth-store';
import { useAuthBootstrap } from '@/app/use-auth-bootstrap';
import { PageCard } from '@/components/page-card';

const setPasswordSchema = childSetPasswordSchema
  .pick({ password: true })
  .extend({
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

const inputClass =
  'w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400';

const fieldError = (message?: string) =>
  message ? <p className="mt-1 text-sm text-rose-600">{message}</p> : null;

const AuthLayout = ({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle: string }>) => (
  <div className="flex min-h-screen items-center justify-center px-4 py-10">
    <div className="w-full max-w-xl">
      <PageCard title={title} subtitle={subtitle}>
        {children}
      </PageCard>
    </div>
  </div>
);

const AuthPageFrame = ({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle: string }>) => {
  const status = useAuthBootstrap();
  const currentUser = useAuthStore((state) => state.currentUser);

  if (status === 'authenticated' && currentUser) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {children}
    </AuthLayout>
  );
};

const LoginForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const clearError = useAuthStore((state) => state.clearError);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'parent@newsocial.local', password: 'Password123!' },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        clearError();
        try {
          await login(values);
          navigate('/feed', { replace: true });
        } catch {
          return;
        }
      })}
    >
      <div>
        <input className={inputClass} placeholder="Email" {...form.register('email')} />
        {fieldError(form.formState.errors.email?.message)}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            className={`${inputClass} flex-1`}
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            {...form.register('password')}
          />
          <button
            className="rounded-full border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {fieldError(form.formState.errors.password?.message)}
      </div>
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
      <button
        className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        disabled={form.formState.isSubmitting}
        type="submit"
      >
        {form.formState.isSubmitting ? 'Submitting...' : 'Sign in'}
      </button>
    </form>
  );
};

const RegisterForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const register = useAuthStore((state) => state.register);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const clearError = useAuthStore((state) => state.clearError);
  const form = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: '',
      username: '',
      displayName: '',
      password: '',
      confirmPassword: '',
      familyCode: '',
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        clearError();
        try {
          await register({
            email: values.email,
            username: values.username,
            displayName: values.displayName,
            password: values.password,
            familyCode: values.familyCode,
          });
          navigate('/feed', { replace: true });
        } catch {
          return;
        }
      })}
    >
      <div>
        <input className={inputClass} placeholder="Email" {...form.register('email')} />
        {fieldError(form.formState.errors.email?.message)}
      </div>
      <div>
        <input className={inputClass} placeholder="Username" {...form.register('username')} />
        {fieldError(form.formState.errors.username?.message)}
      </div>
      <div>
        <input className={inputClass} placeholder="Display name" {...form.register('displayName')} />
        {fieldError(form.formState.errors.displayName?.message)}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            className={`${inputClass} flex-1`}
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            {...form.register('password')}
          />
          <button
            className="rounded-full border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {fieldError(form.formState.errors.password?.message)}
      </div>
      <div>
        <input
          className={inputClass}
          placeholder="Confirm password"
          type={showPassword ? 'text' : 'password'}
          {...form.register('confirmPassword')}
        />
        {fieldError(form.formState.errors.confirmPassword?.message)}
      </div>
      <div>
        <input className={inputClass} placeholder="Family code (optional)" {...form.register('familyCode')} />
        {fieldError(form.formState.errors.familyCode?.message)}
        <p className="mt-2 text-sm text-slate-500">
          Leave blank for a regular account. Enter a valid family code to link this account under a family manager.
        </p>
      </div>
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
      <button
        className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        disabled={form.formState.isSubmitting}
        type="submit"
      >
        {form.formState.isSubmitting ? 'Submitting...' : 'Create account'}
      </button>
    </form>
  );
};

export const AuthPage = ({ mode }: { mode: 'login' | 'register' }) => (
  <AuthPageFrame
    title={mode === 'login' ? 'Sign in' : 'Create account'}
    subtitle={
      mode === 'login'
        ? 'Use your email and password.'
        : 'Create an account. Add a family code only if this account should be linked under a family manager.'
    }
  >
    {mode === 'login' ? <LoginForm /> : <RegisterForm />}
    <div className="mt-6 flex gap-4 text-sm text-slate-500">
      <Link to={mode === 'login' ? '/register' : '/login'}>
        {mode === 'login' ? 'Create an account' : 'Already have an account?'}
      </Link>
    </div>
  </AuthPageFrame>
);

export const ChildAccessPage = () => {
  const navigate = useNavigate();
  const status = useAuthBootstrap();
  const currentUser = useAuthStore((state) => state.currentUser);
  const childFirstLogin = useAuthStore((state) => state.childFirstLogin);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const clearError = useAuthStore((state) => state.clearError);
  const form = useForm<z.infer<typeof childFirstLoginSchema>>({
    resolver: zodResolver(childFirstLoginSchema),
    defaultValues: {
      email: '',
      code: '',
    },
  });

  if (status === 'authenticated' && currentUser) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <AuthLayout
      title="Child first-time access"
      subtitle="Enter the email and one-time code created by your parent or family manager."
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          clearError();
          try {
            await childFirstLogin(values);
            navigate('/child-set-password', { replace: true });
          } catch {
            return;
          }
        })}
      >
        <div>
          <input className={inputClass} placeholder="Email" {...form.register('email')} />
          {fieldError(form.formState.errors.email?.message)}
        </div>
        <div>
          <input className={inputClass} placeholder="One-time access code" {...form.register('code')} />
          {fieldError(form.formState.errors.code?.message)}
        </div>
        {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
        <button
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          {form.formState.isSubmitting ? 'Checking...' : 'Continue'}
        </button>
      </form>
    </AuthLayout>
  );
};

export const ChildSetPasswordPage = () => {
  const navigate = useNavigate();
  const status = useAuthBootstrap();
  const currentUser = useAuthStore((state) => state.currentUser);
  const childToken = useAuthStore((state) => state.childToken);
  const childSetPassword = useAuthStore((state) => state.childSetPassword);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const clearError = useAuthStore((state) => state.clearError);
  const form = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  if (status === 'authenticated' && currentUser) {
    return <Navigate to="/feed" replace />;
  }

  if (!childToken && status !== 'loading') {
    return <Navigate to="/child-access" replace />;
  }

  return (
    <AuthLayout
      title="Set child password"
      subtitle="This step is required after first-time code login. Future sign-ins use email and password."
    >
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async ({ password }) => {
          clearError();
          try {
            await childSetPassword({ password });
            navigate('/feed', { replace: true });
          } catch {
            return;
          }
        })}
      >
        <div>
          <input className={inputClass} placeholder="New password" type="password" {...form.register('password')} />
          {fieldError(form.formState.errors.password?.message)}
        </div>
        <div>
          <input
            className={inputClass}
            placeholder="Confirm password"
            type="password"
            {...form.register('confirmPassword')}
          />
          {fieldError(form.formState.errors.confirmPassword?.message)}
        </div>
        {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
        <button
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          disabled={form.formState.isSubmitting}
          type="submit"
        >
          {form.formState.isSubmitting ? 'Saving...' : 'Set password'}
        </button>
      </form>
    </AuthLayout>
  );
};
