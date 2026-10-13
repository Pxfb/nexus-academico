
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import * as z from 'zod';
import { pool } from '../db.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  },
});

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(255)
  .pipe(z.email());

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    {
      error: 'A senha deve ter no máximo 72 bytes.',
    },
  );

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

function regenerateSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function saveSession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function destroySession(request: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    request.session.destroy((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function createCsrfToken(request: Request) {
  const token = randomBytes(32).toString('hex');
  request.session.csrfToken = token;
  return token;
}

async function createAuthenticatedSession(
  request: Request,
  userId: number,
) {
  await regenerateSession(request);

  request.session.userId = userId;

  const csrfToken = createCsrfToken(request);

  await saveSession(request);

  return csrfToken;
}

function validationError(
  response: Response,
  result: z.ZodSafeParseResult<unknown>,
) {
  if (result.success) {
    return false;
  }

  const flattened = z.flattenError(result.error);

  response.status(400).json({
    message: 'Verifique os dados informados.',
    fieldErrors: flattened.fieldErrors,
    formErrors: flattened.formErrors,
  });

  return true;
}

/*
|--------------------------------------------------------------------------
| GET /api/auth/csrf
|--------------------------------------------------------------------------
*/

router.get('/csrf', async (request, response) => {
  try {
    const token =
      request.session.csrfToken ?? createCsrfToken(request);

    await saveSession(request);

    response.json({
      csrfToken: token,
    });
  } catch (error) {
    console.error('Erro ao gerar CSRF:', error);

    response.status(500).json({
      message: 'Não foi possível preparar a autenticação.',
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/auth/register
|--------------------------------------------------------------------------
*/

router.post(
  '/register',
  authLimiter,
  requireCsrf,
  async (request, response) => {
    const result = registerSchema.safeParse(request.body);

    if (!result.success) {
      validationError(response, result);
      return;
    }

    const { name, email, password } = result.data;

    try {
      const existingUser = await pool.query(
        `
          SELECT id
          FROM users
          WHERE email = $1
        `,
        [email],
      );

      if (existingUser.rowCount && existingUser.rowCount > 0) {
        response.status(409).json({
          message: 'Não foi possível criar a conta com este e-mail.',
        });

        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const insertedUser = await pool.query(
        `
          INSERT INTO users (
            full_name,
            email,
            password_hash
          )
          VALUES ($1, $2, $3)
          RETURNING
            id,
            full_name AS "fullName",
            email,
            role
        `,
        [name, email, passwordHash],
      );

      const user = insertedUser.rows[0];

      const csrfToken = await createAuthenticatedSession(
        request,
        Number(user.id),
      );

      response.status(201).json({
        user,
        csrfToken,
      });
    } catch (error) {
      console.error('Erro no cadastro:', error);

      response.status(500).json({
        message: 'Não foi possível criar a conta.',
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| POST /api/auth/login
|--------------------------------------------------------------------------
*/

router.post(
  '/login',
  authLimiter,
  requireCsrf,
  async (request, response) => {
    const result = loginSchema.safeParse(request.body);

    if (!result.success) {
      validationError(response, result);
      return;
    }

    const { email, password } = result.data;

    try {
      const userResult = await pool.query(
        `
          SELECT
            id,
            full_name AS "fullName",
            email,
            role,
            password_hash
          FROM users
          WHERE email = $1
        `,
        [email],
      );

      if (!userResult.rowCount) {
        response.status(401).json({
          message: 'E-mail ou senha inválidos.',
        });

        return;
      }

      const user = userResult.rows[0];

      const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash,
      );

      if (!passwordMatches) {
        response.status(401).json({
          message: 'E-mail ou senha inválidos.',
        });

        return;
      }

      const csrfToken = await createAuthenticatedSession(
        request,
        Number(user.id),
      );

      response.json({
        user: {
          id: Number(user.id),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        csrfToken,
      });
    } catch (error) {
      console.error('Erro no login:', error);

      response.status(500).json({
        message: 'Não foi possível realizar o login.',
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET /api/auth/me
|--------------------------------------------------------------------------
*/

router.get('/me', requireAuth, async (request, response) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          full_name AS "fullName",
          email,
          role
        FROM users
        WHERE id = $1
      `,
      [request.session.userId],
    );

    if (!result.rowCount) {
      response.status(401).json({
        message: 'Usuário não encontrado.',
      });

      return;
    }

    response.json({
      user: {
        id: Number(result.rows[0].id),
        fullName: result.rows[0].fullName,
        email: result.rows[0].email,
        role: result.rows[0].role,
      },
    });
  } catch (error) {
    console.error('Erro ao consultar usuário:', error);

    response.status(500).json({
      message: 'Não foi possível consultar o usuário.',
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/auth/logout
|--------------------------------------------------------------------------
*/

router.post('/logout', requireCsrf, async (request, response) => {
  try {
    await destroySession(request);

    response.clearCookie('nexus.sid', {
      path: '/',
    });

    response.status(204).send();
  } catch (error) {
    console.error('Erro no logout:', error);

    response.status(500).json({
      message: 'Não foi possível encerrar a sessão.',
    });
  }
});

export default router;
