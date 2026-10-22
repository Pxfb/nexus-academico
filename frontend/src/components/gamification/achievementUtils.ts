import {
  Award,
  CheckCircle2,
  Compass,
  Footprints,
  GraduationCap,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  sparkles: Sparkles,
  'graduation-cap': GraduationCap,
  trophy: Trophy,
  'check-circle': CheckCircle2,
  users: Users,
  compass: Compass,
};

export function getAchievementIcon(icon: string): LucideIcon {
  return ICONS[icon] ?? Award;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatRequirement(
  requirementType: string,
  value: number,
): string {
  if (requirementType === 'points') {
    return `${value} pts`;
  }

  return `${value} ${value === 1 ? 'atividade' : 'atividades'}`;
}
