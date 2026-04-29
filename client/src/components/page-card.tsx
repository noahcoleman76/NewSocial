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
  <section className="rounded-[2rem] border border-white/10 bg-[#211f1d]/92 p-6 shadow-[0_24px_90px_-60px_rgba(255,90,47,0.42)] backdrop-blur">
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-[#F5F5F5]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[#F5F5F5]/60">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </section>
);




