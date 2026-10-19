import 'dotenv/config';
import { pool } from '../db.js';
import { awardPoints } from '../services/gamification.js';

const emailArgument = process.argv.find((argument) =>
  argument.startsWith('--email='),
);

const typeArgument = process.argv.find((argument) =>
  argument.startsWith('--type='),
);

const email = emailArgument?.split('=')[1]?.trim().toLowerCase();

const type = typeArgument?.split('=')[1]?.trim() ?? 'demo';

if (!email) {
  console.error(
    'Uso: npm run gamification:demo --workspace backend -- --email=usuario@email.com --type=demo',
  );

  process.exit(1);
}

const demoEvents: Record<string, { points: number; description: string }> = {
  demo: {
    points: 25,
    description: 'Atividade de demonstração do Tutorial 04.',
  },
  task_completed: {
    points: 20,
    description: 'Tarefa concluída — evento de demonstração.',
  },
  meeting_attended: {
    points: 30,
    description: 'Participação em reunião — evento de demonstração.',
  },
  scrum_completed: {
    points: 15,
    description: 'Daily Scrum realizado — evento de demonstração.',
  },
};

const event = demoEvents[type];

if (!event) {
  console.error(`Tipo de demonstração inválido: ${type}`);

  console.error(`Tipos disponíveis: ${Object.keys(demoEvents).join(', ')}`);

  process.exit(1);
}

try {
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

    process.exit(1);
  }

  const userId = Number(userResult.rows[0].id);

  const summary = await awardPoints({
    userId,
    points: event.points,
    eventType: type,
    description: event.description,
    referenceType: 'tutorial',
    referenceId: 'T04',
  });

  console.log(
    `Evento '${type}' registrado para ${userResult.rows[0].fullName}.`,
  );
  console.log(`Pontos adicionados: ${event.points}`);
  console.log(`Total atual: ${summary.totalPoints}`);
  console.log(`Nível atual: ${summary.level}`);
} catch (error) {
  console.error('Erro ao adicionar evento de demonstração:', error);

  process.exitCode = 1;
} finally {
  await pool.end();
}
