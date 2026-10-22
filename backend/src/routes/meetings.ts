import { Router, type Request, type Response } from 'express';
import * as z from 'zod';

import { pool } from '../db.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { awardPoints } from '../services/gamification.js';

const router = Router();

const MEETING_POINTS = 30;
const MAX_RESULTS = 100;

const MEETING_COLUMNS = `
  id,
  title,
  description,
  scheduled_at AS "scheduledAt",
  duration_minutes AS "durationMinutes",
  location,
  meeting_url AS "meetingUrl",
  status,
  attended_at AS "attendedAt",
  created_at AS "createdAt"
`;

// Reunião ainda não encerrada, agendada e sem participação confirmada.
const IS_UPCOMING = `
  (
    status = 'scheduled'
    AND attended_at IS NULL
    AND scheduled_at + (duration_minutes * INTERVAL '1 minute') > NOW()
  )
`;

type MeetingRow = {
  id: string | number;
  title: string;
  description: string | null;
  scheduledAt: Date;
  durationMinutes: number;
  location: string | null;
  meetingUrl: string | null;
  status: string;
  attendedAt: Date | null;
  createdAt: Date;
};

function toMeeting(row: MeetingRow) {
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    scheduledAt: new Date(row.scheduledAt).toISOString(),
    durationMinutes: Number(row.durationMinutes),
    location: row.location,
    meetingUrl: row.meetingUrl,
    status: row.status,
    attendedAt: row.attendedAt ? new Date(row.attendedAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));
}

const meetingSchema = z.object({
  title: z.string().trim().min(2).max(160),

  description: optionalText(2000),

  scheduledAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      error: 'Data e hora inválidas.',
    }),

  durationMinutes: z.number().int().min(5).max(480),

  location: optionalText(255),

  meetingUrl: optionalText(500).refine(
    (value) => value === null || isHttpUrl(value),
    { error: 'Informe um link http ou https válido.' },
  ),
});

function parseBody(request: Request, response: Response) {
  const result = meetingSchema.safeParse(request.body);

  if (!result.success) {
    const flattened = z.flattenError(result.error);

    response.status(400).json({
      message: 'Verifique os dados informados.',
      fieldErrors: flattened.fieldErrors,
    });

    return null;
  }

  return result.data;
}

function parseId(request: Request): number | null {
  const id = Number(String(request.params.id));

  return Number.isInteger(id) && id > 0 ? id : null;
}

function fail(response: Response, error: unknown, message: string) {
  console.error(message, error);

  response.status(500).json({ message });
}

/*
| GET /api/meetings?filter=upcoming|past|all
*/
router.get('/', requireAuth, async (request, response) => {
  const filter =
    typeof request.query.filter === 'string'
      ? request.query.filter
      : 'upcoming';

  const queries: Record<string, string> = {
    upcoming: `
      SELECT ${MEETING_COLUMNS}
      FROM meetings
      WHERE user_id = $1 AND ${IS_UPCOMING}
      ORDER BY scheduled_at ASC, id ASC
      LIMIT ${MAX_RESULTS}
    `,
    past: `
      SELECT ${MEETING_COLUMNS}
      FROM meetings
      WHERE user_id = $1 AND NOT ${IS_UPCOMING}
      ORDER BY scheduled_at DESC, id DESC
      LIMIT ${MAX_RESULTS}
    `,
    all: `
      SELECT ${MEETING_COLUMNS}
      FROM meetings
      WHERE user_id = $1
      ORDER BY scheduled_at DESC, id DESC
      LIMIT ${MAX_RESULTS}
    `,
  };

  const sql = queries[filter];

  if (!sql) {
    response.status(400).json({ message: 'Filtro inválido.' });
    return;
  }

  try {
    const result = await pool.query(sql, [request.session.userId]);

    response.json({ items: result.rows.map(toMeeting) });
  } catch (error) {
    fail(response, error, 'Não foi possível carregar as reuniões.');
  }
});

/*
| GET /api/meetings/next
*/
router.get('/next', requireAuth, async (request, response) => {
  try {
    const result = await pool.query(
      `
        SELECT ${MEETING_COLUMNS}
        FROM meetings
        WHERE user_id = $1 AND ${IS_UPCOMING}
        ORDER BY scheduled_at ASC, id ASC
        LIMIT 1
      `,
      [request.session.userId],
    );

    response.json({
      meeting: result.rows[0] ? toMeeting(result.rows[0]) : null,
    });
  } catch (error) {
    fail(response, error, 'Não foi possível carregar a próxima reunião.');
  }
});

/*
| POST /api/meetings
*/
router.post('/', requireAuth, requireCsrf, async (request, response) => {
  const data = parseBody(request, response);

  if (!data) {
    return;
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO meetings (
          user_id,
          title,
          description,
          scheduled_at,
          duration_minutes,
          location,
          meeting_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING ${MEETING_COLUMNS}
      `,
      [
        request.session.userId,
        data.title,
        data.description,
        new Date(data.scheduledAt).toISOString(),
        data.durationMinutes,
        data.location,
        data.meetingUrl,
      ],
    );

    response.status(201).json({ meeting: toMeeting(result.rows[0]) });
  } catch (error) {
    fail(response, error, 'Não foi possível criar a reunião.');
  }
});

/*
| PUT /api/meetings/:id  (somente reunião agendada e sem participação)
*/
router.put('/:id', requireAuth, requireCsrf, async (request, response) => {
  const id = parseId(request);

  if (!id) {
    response.status(400).json({ message: 'Reunião inválida.' });
    return;
  }

  const data = parseBody(request, response);

  if (!data) {
    return;
  }

  try {
    const result = await pool.query(
      `
        UPDATE meetings
        SET
          title = $3,
          description = $4,
          scheduled_at = $5,
          duration_minutes = $6,
          location = $7,
          meeting_url = $8,
          updated_at = NOW()
        WHERE id = $1
          AND user_id = $2
          AND status = 'scheduled'
          AND attended_at IS NULL
        RETURNING ${MEETING_COLUMNS}
      `,
      [
        id,
        request.session.userId,
        data.title,
        data.description,
        new Date(data.scheduledAt).toISOString(),
        data.durationMinutes,
        data.location,
        data.meetingUrl,
      ],
    );

    if (!result.rows[0]) {
      response.status(404).json({
        message: 'Reunião não encontrada ou não pode mais ser editada.',
      });
      return;
    }

    response.json({ meeting: toMeeting(result.rows[0]) });
  } catch (error) {
    fail(response, error, 'Não foi possível atualizar a reunião.');
  }
});

/*
| POST /api/meetings/:id/cancel
*/
router.post(
  '/:id/cancel',
  requireAuth,
  requireCsrf,
  async (request, response) => {
    const id = parseId(request);

    if (!id) {
      response.status(400).json({ message: 'Reunião inválida.' });
      return;
    }

    try {
      const result = await pool.query(
        `
          UPDATE meetings
          SET status = 'cancelled', updated_at = NOW()
          WHERE id = $1
            AND user_id = $2
            AND status = 'scheduled'
            AND attended_at IS NULL
          RETURNING ${MEETING_COLUMNS}
        `,
        [id, request.session.userId],
      );

      if (!result.rows[0]) {
        response.status(404).json({
          message: 'Reunião não encontrada ou não pode mais ser cancelada.',
        });
        return;
      }

      response.json({ meeting: toMeeting(result.rows[0]) });
    } catch (error) {
      fail(response, error, 'Não foi possível cancelar a reunião.');
    }
  },
);

/*
| POST /api/meetings/:id/attend
| Confirma a participação. A pontuação é decidida SOMENTE aqui.
*/
router.post(
  '/:id/attend',
  requireAuth,
  requireCsrf,
  async (request, response) => {
    const id = parseId(request);

    if (!id) {
      response.status(400).json({ message: 'Reunião inválida.' });
      return;
    }

    const userId = request.session.userId!;

    try {
      // O UPDATE condicional garante que a confirmação ocorra uma única vez
      // e somente depois do início da reunião.
      const result = await pool.query(
        `
          UPDATE meetings
          SET attended_at = NOW(), updated_at = NOW()
          WHERE id = $1
            AND user_id = $2
            AND status = 'scheduled'
            AND attended_at IS NULL
            AND scheduled_at <= NOW()
          RETURNING ${MEETING_COLUMNS},
            (created_at <= scheduled_at) AS awardable
        `,
        [id, userId],
      );

      const row = result.rows[0];

      if (!row) {
        response.status(409).json({
          message:
            'Não foi possível confirmar: a reunião não existe, já foi confirmada, foi cancelada ou ainda não começou.',
        });
        return;
      }

      let pointsAwarded = 0;

      if (row.awardable) {
        try {
          await awardPoints({
            userId,
            points: MEETING_POINTS,
            eventType: 'meeting_attended',
            description: `Participação em reunião: ${row.title}`,
            referenceType: 'meeting',
            referenceId: String(row.id),
          });

          pointsAwarded = MEETING_POINTS;
        } catch (awardError) {
          // Desfaz a confirmação para que o usuário possa tentar novamente.
          await pool.query(
            `
              UPDATE meetings
              SET attended_at = NULL, updated_at = NOW()
              WHERE id = $1 AND user_id = $2
            `,
            [id, userId],
          );

          throw awardError;
        }
      }

      response.json({
        meeting: toMeeting(row),
        pointsAwarded,
      });
    } catch (error) {
      fail(response, error, 'Não foi possível confirmar a participação.');
    }
  },
);

/*
| DELETE /api/meetings/:id
| Pontos já concedidos permanecem no histórico (point_events).
*/
router.delete('/:id', requireAuth, requireCsrf, async (request, response) => {
  const id = parseId(request);

  if (!id) {
    response.status(400).json({ message: 'Reunião inválida.' });
    return;
  }

  try {
    const result = await pool.query(
      'DELETE FROM meetings WHERE id = $1 AND user_id = $2',
      [id, request.session.userId],
    );

    if (!result.rowCount) {
      response.status(404).json({ message: 'Reunião não encontrada.' });
      return;
    }

    response.status(204).send();
  } catch (error) {
    fail(response, error, 'Não foi possível excluir a reunião.');
  }
});

export default router;
