import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>

        <span className="stat-icon">
          <Icon size={18} />
        </span>
      </div>

      <p className="stat-value">{value}</p>
    </article>
  );
}
