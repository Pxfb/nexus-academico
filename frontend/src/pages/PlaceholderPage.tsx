import type { LucideIcon } from 'lucide-react';

type PlaceholderPageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export default function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: PlaceholderPageProps) {
  return (
    <div className="page">
      <div className="placeholder-page">
        <section className="placeholder-card">
          <div className="placeholder-icon">
            <Icon size={24} />
          </div>

          <h1>{title}</h1>

          <p>{description}</p>
        </section>
      </div>
    </div>
  );
}
