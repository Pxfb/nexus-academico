import { useEffect, useState } from 'react';

import { getApiHealth } from '../../lib/api';

type Status = 'loading' | 'online' | 'offline';

export function ApiStatus() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let active = true;

    getApiHealth()
      .then(() => {
        if (active) {
          setStatus('online');
        }
      })
      .catch(() => {
        if (active) {
          setStatus('offline');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="api-status">
        <span className="status-dot" />
        Verificando conexão...
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div className="api-status">
        <span className="status-dot offline" />
        API ou banco indisponível
      </div>
    );
  }

  return (
    <div className="api-status">
      <span className="status-dot online" />
      API e banco conectados
    </div>
  );
}
