import type { LucideIcon } from 'lucide-react';

import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Gauge,
  ListChecks,
  MessageCircle,
  NotebookPen,
  Settings,
  Trophy,
  Users,
  Video,
} from 'lucide-react';

export type NavigationItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export const navigation: NavigationItem[] = [
  {
    label: 'Visão geral',
    to: '/',
    icon: Gauge,
  },
  {
    label: 'Tarefas',
    to: '/tarefas',
    icon: CheckSquare,
  },
  {
    label: 'Calendário',
    to: '/calendario',
    icon: CalendarDays,
  },
  {
    label: 'Reuniões',
    to: '/reunioes',
    icon: Video,
  },
  {
    label: 'Materiais',
    to: '/materiais',
    icon: BookOpen,
  },
  {
    label: 'Anotações',
    to: '/anotacoes',
    icon: NotebookPen,
  },
  {
    label: 'Comunicação',
    to: '/comunicacao',
    icon: MessageCircle,
  },
  {
    label: 'Scrum',
    to: '/scrum',
    icon: ListChecks,
  },
  {
    label: 'Equipes',
    to: '/equipes',
    icon: Users,
  },
  {
    label: 'Avaliações',
    to: '/avaliacoes',
    icon: ClipboardCheck,
  },
  {
    label: 'Conquistas',
    to: '/conquistas',
    icon: Trophy,
  },
  {
    label: 'Notificações',
    to: '/notificacoes',
    icon: Bell,
  },
  {
    label: 'Configurações',
    to: '/configuracoes',
    icon: Settings,
  },
];
