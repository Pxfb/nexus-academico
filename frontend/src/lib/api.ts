const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export type ApiHealth = {
  status: string;
  api: string;
  database: string;
  timestamp: string;
};

export async function getApiHealth(): Promise<ApiHealth> {
  const response = await fetch(`${API_URL}/api/health`);

  if (!response.ok) {
    throw new Error('Não foi possível consultar a API.');
  }

  return response.json();
}
