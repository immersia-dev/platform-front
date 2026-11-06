import { HelpCircle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: ReactNode;
  caption: string;
  tooltip: string;
  icon?: LucideIcon;
};

export default function StatCard({ label, value, caption, tooltip, icon: Icon }: StatCardProps) {
  return (
    <article className="__enableXr__ stat-card">
      <div className="stat-card-header">
        <div className="stat-card-title">
          {Icon ? (
            <span className="stat-card-icon" aria-hidden="true">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <span className="stat-label">{label}</span>
        </div>
        <div className="stat-help">
          <button type="button" className="stat-help-button" aria-label={`Ajuda: ${label}`}>
            <HelpCircle className="h-4 w-4" />
          </button>
          <span className="stat-help-tooltip" role="tooltip">
            {tooltip}
          </span>
        </div>
      </div>
      <strong className="stat-value">{value}</strong>
      <p className="text-sm text-white/60">{caption}</p>
    </article>
  );
}
