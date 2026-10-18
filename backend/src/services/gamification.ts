import type { PoolClient } from 'pg';
import { pool } from '../db.js';

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
  pointsInCurrentLevel: number;
  pointsToNextLevel: number;
  totalPointEvents: number;
  achievements: AchievementSummary[];
};

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

const MAX_PAGE_SIZE = 50;
const MAX_PAGE = 100000;

function calculateLevel(totalPoints: number): number {
  return Math.floor(totalPoints / 100) + 1;
}

export async function ensureGamificationProfile(userId: number): Promise<void> {
  await pool.query(
    `
      INSERT INTO gamification_profiles (
        user_id,
        total_points,
        level
      )
      VALUES ($1, 0, 1)
      ON CONFLICT (user_id) DO NOTHING
    `,
    [userId],
  );
}

export async function getGamificationSummary(
  userId: number,
): Promise<GamificationSummary> {
  await ensureGamificationProfile(userId);

  const profileResult = await pool.query(
    `
      SELECT
        total_points AS "totalPoints",
        level
      FROM gamification_profiles
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  const profile = profileResult.rows[0] as {
    totalPoints: number;
    level: number;
  };

  const pointEventsCountResult = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM point_events
      WHERE user_id = $1
    `,
    [userId],
  );

  const totalPointEvents = Number(pointEventsCountResult.rows[0].total);

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
        CASE
          WHEN ua.unlocked_at IS NOT NULL THEN 0
          ELSE 1
        END,
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

  const totalPoints = Number(profile.totalPoints);
  const level = calculateLevel(totalPoints);
  const pointsInCurrentLevel = totalPoints % 100;
  const pointsToNextLevel = 100 - pointsInCurrentLevel;

  return {
    totalPoints,
    level,
    pointsInCurrentLevel,
    pointsToNextLevel,
    totalPointEvents,
    achievements,
  };
}

export async function getPointEvents(
  userId: number,
  page = 1,
  pageSize = 10,
  eventType?: string,
): Promise<PointEventPage> {
  const safePage =
    Number.isInteger(page) && page > 0 ? Math.min(page, MAX_PAGE) : 1;

  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0
      ? Math.min(pageSize, MAX_PAGE_SIZE)
      : 10;

  const offset = (safePage - 1) * safePageSize;
  const eventTypeFilter = eventType ?? null;

  const countResult = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM point_events
      WHERE user_id = $1
        AND ($2::text IS NULL OR event_type = $2::text)
    `,
    [userId, eventTypeFilter],
  );

  const total = Number(countResult.rows[0].total);

  const result = await pool.query(
    `
      SELECT
        id,
        points,
        event_type AS "eventType",
        description,
        reference_type AS "referenceType",
        reference_id AS "referenceId",
        created_at AS "createdAt"
      FROM point_events
      WHERE user_id = $1
        AND ($2::text IS NULL OR event_type = $2::text)
      ORDER BY created_at DESC, id DESC
      LIMIT $3
      OFFSET $4
    `,
    [userId, eventTypeFilter, safePageSize, offset],
  );

  const items: PointEvent[] = result.rows.map((row) => ({
    id: Number(row.id),
    points: Number(row.points),
    eventType: row.eventType,
    description: row.description,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    createdAt: new Date(row.createdAt).toISOString(),
  }));

  return {
    items,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.ceil(total / safePageSize),
  };
}

async function unlockEligibleAchievements(
  client: PoolClient,
  userId: number,
  totalPoints: number,
): Promise<void> {
  await client.query(
    `
      INSERT INTO user_achievements (
        user_id,
        achievement_id
      )
      SELECT
        $1,
        a.id
      FROM achievements a
      WHERE a.requirement_type = 'points'
        AND a.requirement_value <= $2
      ON CONFLICT (user_id, achievement_id) DO NOTHING
    `,
    [userId, totalPoints],
  );
}

export async function awardPoints({
  userId,
  points,
  eventType,
  description,
  referenceType,
  referenceId,
}: {
  userId: number;
  points: number;
  eventType: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
}): Promise<GamificationSummary> {
  if (!Number.isInteger(points) || points <= 0) {
    throw new Error('A quantidade de pontos deve ser um inteiro positivo.');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `
        INSERT INTO gamification_profiles (
          user_id,
          total_points,
          level
        )
        VALUES ($1, 0, 1)
        ON CONFLICT (user_id) DO NOTHING
      `,
      [userId],
    );

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
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        userId,
        points,
        eventType,
        description,
        referenceType ?? null,
        referenceId ?? null,
      ],
    );

    const profileResult = await client.query(
      `
        UPDATE gamification_profiles
        SET
          total_points = total_points + $2,
          level = FLOOR((total_points + $2) / 100) + 1,
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING total_points AS "totalPoints"
      `,
      [userId, points],
    );

    const totalPoints = Number(profileResult.rows[0].totalPoints);

    await unlockEligibleAchievements(client, userId, totalPoints);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getGamificationSummary(userId);
}
