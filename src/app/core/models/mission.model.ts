export type MissionCategory = 'descubrimiento' | 'exploracion' | 'reto';

export type MissionDifficulty = 'Fácil' | 'Media' | 'Avanzada';

export type MissionSecurityStatus = 'safe' | 'schedule_restricted' | 'maintenance';

export type MissionStatus = 'available' | 'active' | 'completed';

export interface MissionCoordinates {
  x: number; // Porcentaje de ancho en canvas de mapa (0-100)
  y: number; // Porcentaje de alto en canvas de mapa (0-100)
}

export interface MissionItem {
  id: string;
  title: string;
  category: MissionCategory;
  categoryLabel: string;
  categoryIcon: string;
  description: string;
  loreStory: string;
  targetPoiId: number;
  targetPoiName: string;
  targetCoords: MissionCoordinates;
  difficulty: MissionDifficulty;
  estimatedMinutes: number;
  distanceMeters: number;
  xpReward: number;
  repeatXpReward: number; // Conflicto B: primera vez 100%, repeticiones XP reducida
  badgeRewardId?: string;
  badgeRewardName?: string;
  couponRewardName?: string;
  securityStatus: MissionSecurityStatus;
  securityNotice?: string; // Conflicto C: Lugares seguros y horarios protegidos
  operationalSchedule: string;
  isAvailable: boolean;
  status: MissionStatus;
  timesCompleted: number;
  lastCompletedDate?: string;
}

export interface MissionHistoryEntry {
  id: string;
  missionId: string;
  missionTitle: string;
  category: MissionCategory;
  categoryIcon: string;
  completedAt: string;
  xpEarned: number;
  isFirstTime: boolean;
  badgeEarned?: string;
  validationMethod: 'GPS_VERIFIED_RADIUS';
  arrivalDistanceMeters: number;
}

export interface MissionConflictModalData {
  newMission: MissionItem;
  currentActiveMissionName: string;
}

export interface MissionAbandonModalData {
  mission: MissionItem;
}

export interface MissionSecurityModalData {
  mission: MissionItem;
  reason: string;
  scheduleAllowed: string;
}
