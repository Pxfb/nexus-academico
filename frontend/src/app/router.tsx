import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  ListChecks,
  MessageCircle,
  NotebookPen,
  Settings,
  Trophy,
  Users,
  Video,
  Bell,
} from 'lucide-react';

import AppShell from '../components/layout/AppShell';

import DashboardPage from '../pages/DashboardPage';
import LoginPage from '../pages/LoginPage';
import PlaceholderPage from '../pages/PlaceholderPage';
import RegisterPage from '../pages/RegisterPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/cadastro" element={<RegisterPage />} />

        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />

          <Route
            path="tarefas"
            element={
              <PlaceholderPage
                title="Tarefas"
                description="Área preparada para o gerenciamento das atividades acadêmicas."
                icon={CheckSquare}
              />
            }
          />

          <Route
            path="calendario"
            element={
              <PlaceholderPage
                title="Calendário"
                description="Área preparada para calendário, eventos, prazos e compromissos."
                icon={CalendarDays}
              />
            }
          />

          <Route
            path="reunioes"
            element={
              <PlaceholderPage
                title="Reuniões"
                description="Área preparada para reuniões, encontros e registros."
                icon={Video}
              />
            }
          />

          <Route
            path="materiais"
            element={
              <PlaceholderPage
                title="Materiais"
                description="Área preparada para materiais acadêmicos e conteúdos de aula."
                icon={BookOpen}
              />
            }
          />

          <Route
            path="anotacoes"
            element={
              <PlaceholderPage
                title="Anotações"
                description="Área preparada para anotações e registros pessoais."
                icon={NotebookPen}
              />
            }
          />

          <Route
            path="comunicacao"
            element={
              <PlaceholderPage
                title="Comunicação"
                description="Área preparada para comunicação acadêmica e mensagens."
                icon={MessageCircle}
              />
            }
          />

          <Route
            path="scrum"
            element={
              <PlaceholderPage
                title="Scrum"
                description="Área preparada para Product Backlog, Sprint Board e Daily Scrum."
                icon={ListChecks}
              />
            }
          />

          <Route
            path="equipes"
            element={
              <PlaceholderPage
                title="Equipes"
                description="Área preparada para equipes, participantes e organização colaborativa."
                icon={Users}
              />
            }
          />

          <Route
            path="avaliacoes"
            element={
              <PlaceholderPage
                title="Avaliações"
                description="Área preparada para avaliações e acompanhamento de resultados."
                icon={ClipboardCheck}
              />
            }
          />

          <Route
            path="conquistas"
            element={
              <PlaceholderPage
                title="Conquistas"
                description="Área preparada para gamificação, pontos e conquistas."
                icon={Trophy}
              />
            }
          />

          <Route
            path="notificacoes"
            element={
              <PlaceholderPage
                title="Notificações"
                description="Área preparada para notificações e alertas do sistema."
                icon={Bell}
              />
            }
          />

          <Route
            path="configuracoes"
            element={
              <PlaceholderPage
                title="Configurações"
                description="Área preparada para preferências e configurações da conta."
                icon={Settings}
              />
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
