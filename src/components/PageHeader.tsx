import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <p className="section-kicker">{eyebrow}</p> : null}
        <h1 className="section-title">{title}</h1>
        {description ? <p className="subtle-text mt-2 max-w-2xl">{description}</p> : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
