const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export type User = {
  id: number;
  fullName: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  user: User;
  csrfToken: string;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);

    this.name = 'ApiError';

    this.status = status;

    this.data = data;
  }
}

let csrfToken: string | null = null;

async function ensureCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(`${API_URL}/api/auth/csrf`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Não foi possível preparar a autenticação.');
  }

  const data = (await response.json()) as {
    csrfToken: string;
  };

  csrfToken = data.csrfToken;

  return csrfToken;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();

  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await ensureCsrfToken();

    headers.set('X-CSRF-Token', token);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type');

  const data = contentType?.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? 'Ocorreu um erro na API.',
      response.status,
      data,
    );
  }

  if (data?.csrfToken) {
    csrfToken = data.csrfToken;
  }

  return data as T;
}

export async function register(name: string, email: string, password: string) {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
}

export async function login(email: string, password: string) {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function logout() {
  await apiRequest('/api/auth/logout', {
    method: 'POST',
  });

  csrfToken = null;
}

export async function getCurrentUser() {
  try {
    const response = await apiRequest<{
      user: User;
    }>('/api/auth/me');

    return response.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

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
export type Achievement = {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  requirementType: string;
  requirementValue: number;
  requirementEventType: string | null;
  currentValue: number;
  progressPercent: number;
  unlocked: boolean;
  unlockedAt: string | null;
};

export type GamificationSummary = {
  totalPoints: number;
  level: number;
  pointsInCurrentLevel: number;
  pointsToNextLevel: number;
  totalPointEvents: number;
  achievements: Achievement[];
  nextAchievement: Achievement | null;
};

export async function getGamification(): Promise<GamificationSummary> {
  return apiRequest<GamificationSummary>('/api/gamification/me');
}

export type PointEvent = {
  id: number;
  points: number;
  eventType: string;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
};

export type PointEventPage = {
  items: PointEvent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function getPointEventHistory(
  page = 1,
  pageSize = 10,
  eventType?: string,
): Promise<PointEventPage> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (eventType) {
    params.set('eventType', eventType);
  }

  return apiRequest<PointEventPage>(
    `/api/gamification/me/history?${params.toString()}`,
  );
}
