import 'dotenv/config';

import { pool } from '../db.js';
import { awardPoints } from '../services/gamification.js';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Este script não pode ser executado em produção.');
    process.exitCode = 1;
    return;
  }

  const emailArgument = process.argv.find((argument) =>
    argument.startsWith('--email='),
  );

  const email = emailArgument?.split('=')[1]?.trim().toLowerCase();

  if (!email) {
    console.error(
      'Uso: npm run gamification:demo --workspace backend -- --email=usuario@email.com',
    );
    process.exitCode = 1;
    return;
  }

  const userResult = await pool.query(
    `
      SELECT id, full_name AS "fullName"
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  if (!userResult.rows[0]) {
    console.error(`Usuário não encontrado: ${email}`);
    process.exitCode = 1;
    return;
  }

  const result = await awardPoints({
    userId: Number(userResult.rows[0].id),
    points: 100,
    eventType: 'demo',
    description: 'Pontuação de demonstração do Tutorial 03.',
    referenceType: 'tutorial',
    // referência única: cada execução é um fato novo
    referenceId: `T03-${Date.now()}`,
  });

  console.log(`Pontos adicionados para ${userResult.rows[0].fullName}.`);
  console.log(`Total: ${result.summary.totalPoints}`);
  console.log(`Nível: ${result.summary.level}`);
}

main()
  .catch((error) => {
    console.error('Erro ao adicionar pontos de demonstração:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
