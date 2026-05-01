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
  <section className="rounded-[2rem] border border-white/10 bg-[var(--bg-card)]/92 p-6 shadow-[var(--shadow-glow)] backdrop-blur">
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--text)]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[var(--text)]/60">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </section>
);



