import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

import PointHistory from '../components/gamification/PointHistory';

export default function PointHistoryPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Gamificação</p>

          <h1 className="page-title">Histórico de pontos</h1>

          <p className="page-description">
            Consulte todas as atividades que geraram pontos para a sua conta. Os
            pontos são registrados automaticamente pelo sistema.
          </p>
        </div>

        <Link className="button button-secondary" to="/conquistas">
          <ArrowLeft size={18} />
          Voltar para conquistas
        </Link>
      </header>

      <PointHistory fullHistory />
    </div>
  );
}
