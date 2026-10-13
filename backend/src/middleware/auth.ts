import { timingSafeEqual } from 'node:crypto';

import type { RequestHandler } from 'express';

export const requireAuth: RequestHandler = (request, response, next) => {
  if (!request.session.userId) {
    response.status(401).json({
      message: 'Usuário não autenticado.',
    });

    return;
  }

  next();
};

export const requireCsrf: RequestHandler = (request, response, next) => {
  const expectedToken = request.session.csrfToken;

  const receivedToken = request.get('X-CSRF-Token');

  if (!expectedToken || !receivedToken) {
    response.status(403).json({
      message: 'Token CSRF inválido ou ausente.',
    });

    return;
  }

  const expectedBuffer = Buffer.from(expectedToken);

  const receivedBuffer = Buffer.from(receivedToken);

  if (expectedBuffer.length !== receivedBuffer.length) {
    response.status(403).json({
      message: 'Token CSRF inválido.',
    });

    return;
  }

  if (!timingSafeEqual(expectedBuffer, receivedBuffer)) {
    response.status(403).json({
      message: 'Token CSRF inválido.',
    });

    return;
  }

  next();
};
