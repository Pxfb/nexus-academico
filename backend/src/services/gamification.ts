import type { PoolClient } from 'pg';

import { pool } from '../db.js';

export const POINTS_PER_LEVEL = 100;

export type AchievementSummary = {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  requirementType: string;
  requirementValue: number;
  unlocked: boolean;
  unlockedAt: string | null;
};

export type GamificationSummary = {
  totalPoints: number;
  level: number;
  pointsPerLevel: number;
  pointsInCurrentLevel: number;
  pointsToNextLevel: number;
  achievements: AchievementSummary[];
};

export type AwardPointsInput = {
  userId: number;
  points: number;
  eventType: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
};

export type AwardPointsResult = {
  /** false quando o mesmo fato já tinha sido pontuado antes. */
  awarded: boolean;
  summary: GamificationSummary;
};

const ENSURE_PROFILE_SQL = `
  INSERT INTO gamification_profiles (user_id, total_points, level)
  VALUES ($1, 0, 1)
  ON CONFLICT (user_id) DO NOTHING
`;

// Deve repetir exatamente o predicado do índice uq_point_events_reference.
const EVENT_CONFLICT_SQL = `
  ON CONFLICT (user_id, event_type, reference_type, reference_id)
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL
  DO NOTHING
`;

function calculateLevel(totalPoints: number): number {
  return Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
}

/**
 * Soma pontos ao perfil e recalcula o nível.
 * Usa divisão inteira do PostgreSQL (integer / integer).
 */
async function applyPoints(
  client: PoolClient,
  userId: number,
  points: number,
): Promise<number> {
  const result = await client.query<{ total_points: number }>(
    `
      UPDATE gamification_profiles
      SET
        total_points = total_points + $2::integer,
        level = ((total_points + $2::integer) / ${POINTS_PER_LEVEL}) + 1,
        updated_at = NOW()
      WHERE user_id = $1
      RETURNING total_points
    `,
    [userId, points],
  );

  return Number(result.rows[0].total_points);
}

/**
 * Desbloqueia conquistas elegíveis e paga o bônus de cada uma.
 * Repete enquanto o bônus fizer o usuário alcançar novas conquistas.
 */
async function unlockEligibleAchievements(
  client: PoolClient,
  userId: number,
  startingTotal: number,
): Promise<number> {
  let totalPoints = startingTotal;

  for (;;) {
    const unlocked = await client.query<{
      id: string;
      title: string;
      points: number;
    }>(
      `
        WITH newly_unlocked AS (
          INSERT INTO user_achievements (user_id, achievement_id)
          SELECT $1::bigint, a.id
          FROM achievements a
          WHERE a.requirement_type = 'points'
            AND a.requirement_value <= $2::integer
          ON CONFLICT (user_id, achievement_id) DO NOTHING
          RETURNING achievement_id
        )
        SELECT a.id, a.title, a.points
        FROM newly_unlocked n
        JOIN achievements a ON a.id = n.achievement_id
      `,
      [userId, totalPoints],
    );

    if (unlocked.rows.length === 0) {
      return totalPoints;
    }

    let bonus = 0;

    for (const achievement of unlocked.rows) {
      const achievementPoints = Number(achievement.points);

      if (achievementPoints <= 0) {
        continue;
      }

      await client.query(
        `
          INSERT INTO point_events (
            user_id,
            points,
            event_type,
            description,
            reference_type,
            reference_id
          )
          VALUES ($1, $2, 'achievement_unlocked', $3, 'achievement', $4)
          ${EVENT_CONFLICT_SQL}
        `,
        [
          userId,
          achievementPoints,
          `Conquista desbloqueada: ${achievement.title}`,
          String(achievement.id),
        ],
      );

      bonus += achievementPoints;
    }

    if (bonus > 0) {
      totalPoints = await applyPoints(client, userId, bonus);
    }
  }
}

export async function getGamificationSummary(
  userId: number,
): Promise<GamificationSummary> {
  await pool.query(ENSURE_PROFILE_SQL, [userId]);

  const profileResult = await pool.query<{
    totalPoints: number;
  }>(
    `
      SELECT total_points AS "totalPoints"
      FROM gamification_profiles
      WHERE user_id = $1
    `,
    [userId],
  );

  const achievementsResult = await pool.query(
    `
      SELECT
        a.id,
        a.code,
        a.title,
        a.description,
        a.icon,
        a.points,
        a.requirement_type AS "requirementType",
        a.requirement_value AS "requirementValue",
        ua.unlocked_at AS "unlockedAt"
      FROM achievements a
      LEFT JOIN user_achievements ua
        ON ua.achievement_id = a.id
       AND ua.user_id = $1
      ORDER BY
        CASE WHEN ua.unlocked_at IS NOT NULL THEN 0 ELSE 1 END,
        a.requirement_value ASC,
        a.id ASC
    `,
    [userId],
  );

  const achievements: AchievementSummary[] = achievementsResult.rows.map(
    (row) => ({
      id: Number(row.id),
      code: row.code,
      title: row.title,
      description: row.description,
      icon: row.icon,
      points: Number(row.points),
      requirementType: row.requirementType,
      requirementValue: Number(row.requirementValue),
      unlocked: row.unlockedAt !== null,
      unlockedAt: row.unlockedAt
        ? new Date(row.unlockedAt).toISOString()
        : null,
    }),
  );

  const totalPoints = Number(profileResult.rows[0].totalPoints);
  const pointsInCurrentLevel = totalPoints % POINTS_PER_LEVEL;

  return {
    totalPoints,
    level: calculateLevel(totalPoints),
    pointsPerLevel: POINTS_PER_LEVEL,
    pointsInCurrentLevel,
    pointsToNextLevel: POINTS_PER_LEVEL - pointsInCurrentLevel,
    achievements,
  };
}

export async function awardPoints(
  input: AwardPointsInput,
): Promise<AwardPointsResult> {
  const { userId, points, eventType, description } = input;

  if (!Number.isInteger(points) || points <= 0) {
    throw new Error('A quantidade de pontos deve ser um inteiro positivo.');
  }

  const client = await pool.connect();

  let awarded = false;

  try {
    await client.query('BEGIN');

    await client.query(ENSURE_PROFILE_SQL, [userId]);

    const inserted = await client.query(
      `
        INSERT INTO point_events (
          user_id,
          points,
          event_type,
          description,
          reference_type,
          reference_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ${EVENT_CONFLICT_SQL}
        RETURNING id
      `,
      [
        userId,
        points,
        eventType,
        description,
        input.referenceType ?? null,
        input.referenceId ?? null,
      ],
    );

    if (inserted.rowCount && inserted.rowCount > 0) {
      awarded = true;

      const totalAfterEvent = await applyPoints(client, userId, points);

      await unlockEligibleAchievements(client, userId, totalAfterEvent);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return {
    awarded,
    summary: await getGamificationSummary(userId),
  };
}
