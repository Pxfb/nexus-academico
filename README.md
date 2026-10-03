# Nexus Acadêmico

Plataforma web acadêmica desenvolvida pelo projeto MFDS.

## Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Lucide React

### Backend

- Node.js
- TypeScript
- Express

### Banco

- PostgreSQL hospedado no Supabase

### Qualidade

- ESLint
- Prettier

## Requisitos

- Node.js 24 LTS
- npm
- Git
- Acesso ao projeto Supabase da equipe
- Conexão com a internet

## Instalação

Clone o repositório:

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta:

```bash
cd nexus-academico
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `backend/.env` a partir do modelo:

```bash
cp backend/.env.example backend/.env
```

(no Windows PowerShell: `Copy-Item backend/.env.example backend/.env`)

Abra `backend/.env` e substitua `DATABASE_URL` pela string de conexão
(Session pooler) do projeto Supabase da equipe, com a senha real do banco.
Peça a senha ao responsável pela fundação por um canal privado.
Nunca envie este arquivo ao GitHub.

Crie também `frontend/.env.local`:

```bash
cp frontend/.env.example frontend/.env.local
```

(no Windows PowerShell: `Copy-Item frontend/.env.example frontend/.env.local`)

Inicie frontend e backend:

```bash
npm run dev
```

## Endereços

Frontend:

```text
http://localhost:5173
```

API:

```text
http://localhost:3333
```

Health check:

```text
http://localhost:3333/api/health
```

## Comandos

Desenvolvimento:

```bash
npm run dev
```

Lint:

```bash
npm run lint
```

Formatação:

```bash
npm run format
```

Verificar formatação:

```bash
npm run format:check
```

Build:

```bash
npm run build
```
