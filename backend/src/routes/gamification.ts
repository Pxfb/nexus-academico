import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';
import { getGamificationSummary } from '../services/gamification.js';

const router = Router();

router.get('/me', requireAuth, async (request, response) => {
  const userId = request.session.userId;

  if (!userId) {
    response.status(401).json({
      message: 'Usuário não autenticado.',
    });

    return;
  }

  try {
    const summary = await getGamificationSummary(userId);

    response.set('Cache-Control', 'no-store');
    response.json(summary);
  } catch (error) {
    console.error('Erro ao carregar gamificação:', error);

    response.status(500).json({
      message: 'Não foi possível carregar a gamificação.',
    });
  }
});

export default router;
