export type RouteTheme = 'patrimonio' | 'parques' | 'historico' | 'cultural';

export type RouteDifficulty = 'Fácil' | 'Moderado' | 'Desafío';

export type RouteStatus = 'available' | 'in_progress' | 'paused' | 'completed' | 'suspended';

export interface RouteStop {
  id: string;
  stopOrder: number;
  name: string;
  description: string;
  coords: { x: number; y: number };
  icon: string;
  distanceFromPrevMeters: number;
  isCompleted: boolean;
  completedAt?: string;
  isAccessible: boolean; // Conflicto: suspensión por seguridad/obras
}

export interface ThematicRoute {
  id: string;
  title: string;
  theme: RouteTheme;
  themeLabel: string;
  difficulty: RouteDifficulty;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  totalXpReward: number;
  badgeRewardName: string;
  badgeRewardId: string;
  stops: RouteStop[];
  status: RouteStatus;
  suspensionNotice?: string; // Página 16 y 17
  completedStopsCount: number;
  lastActiveStopIndex: number;
}

export interface RouteAbandonModalData {
  route: ThematicRoute;
}

export interface RouteSuspensionModalData {
  route: ThematicRoute;
  reason: string;
}
