export type AchievementTab = 'ranks' | 'badges' | 'rewards' | 'leagues';

export type BadgeCategory = 'descubrimiento' | 'mision' | 'recorrido';

export interface RankTier {
  id: string;
  name: string;
  icon: string;
  minXp: number;
  maxXp: number;
  badgeReward: string;
  perks: string[];
  isCurrent: boolean;
  isUnlocked: boolean;
}

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  currentProgress: number;
  targetProgress: number;
  associatedReward?: string;
}

export interface CouponReward {
  id: string;
  partnerName: string;
  category: 'Café & Comida' | 'Deportes' | 'Cultura' | 'Entretenimiento';
  partnerLogo: string;
  discount: string;
  description: string;
  requiredRank: string;
  campaignActive: boolean;
  code: string;
  isClaimed: boolean;
  claimedAt?: string;
  expiresInDays: number;
}

export interface LeagueParticipant {
  rankPosition: number;
  userId: string;
  username: string;
  avatar: string;
  weeklyXp: number;
  isCurrentUser: boolean;
  tierBadge: string;
  trend: 'up' | 'down' | 'same';
}

export interface LeagueState {
  isEnrolled: boolean;
  seasonTitle: string;
  divisionName: string;
  daysRemaining: number;
  hoursRemaining: number;
  totalParticipants: number;
  userRank: number;
  userWeeklyXp: number;
}
