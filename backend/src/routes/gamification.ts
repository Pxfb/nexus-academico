import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getGamificationSummary,
  getPointEvents,
} from '../services/gamification.js';

const router = Router();

const EVENT_TYPE_PATTERN = /^[a-z0-9_]{1,60}$/;

function parsePositiveInteger(value: unknown, fallback: number): number {
  if (typeof value !== 'string') {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

router.get('/me', requireAuth, async (req, res) => {
  try {
    const summary = await getGamificationSummary(req.session.userId!);

    res.json(summary);
  } catch (error) {
    console.error('Erro ao carregar gamificação:', error);

    res.status(500).json({
      message: 'Não foi possível carregar a gamificação.',
    });
  }
});

router.get('/me/history', requireAuth, async (req, res) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1);

    const pageSize = parsePositiveInteger(req.query.pageSize, 10);

    const rawEventType = req.query.eventType;

    let eventType: string | undefined;

    if (rawEventType !== undefined) {
      if (
        typeof rawEventType !== 'string' ||
        !EVENT_TYPE_PATTERN.test(rawEventType)
      ) {
        res.status(400).json({
          message: 'Tipo de evento inválido.',
        });

        return;
      }

      eventType = rawEventType;
    }

    const history = await getPointEvents(
      req.session.userId!,
      page,
      pageSize,
      eventType,
    );

    res.json(history);
  } catch (error) {
    console.error('Erro ao carregar histórico de pontos:', error);

    res.status(500).json({
      message: 'Não foi possível carregar o histórico de pontos.',
    });
  }
});

export default router;
