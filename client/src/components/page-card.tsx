import type { PropsWithChildren, ReactNode } from 'react';

export const PageCard = ({
  title,
  subtitle,
  children,
  action,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
}>) => (
  <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </section>
);
