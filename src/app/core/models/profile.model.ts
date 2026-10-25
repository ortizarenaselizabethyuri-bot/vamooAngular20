export interface AvatarCustomization {
  baseModel: string;
  outfitColor: string;
  hatAccessory: string | null;
  pinAccessory: string | null;
  aura: string | null;
}

export interface AvatarOption {
  id: string;
  type: 'color' | 'hat' | 'pin' | 'aura';
  name: string;
  icon: string;
  previewClass?: string;
  requiredRank: string;
  requiredBadgeId?: string;
  isUnlocked: boolean;
  unlockConditionText: string;
}

export interface PlayerStats {
  totalXp: number;
  currentRank: string;
  missionsCompleted: number;
  routesCompleted: number;
  totalKmWalked: number;
  badgesUnlockedCount: number;
  weeklyLeagueRank: number;
  weeklyXp: number;
}

export interface PrivacySettings {
  isPublicProfile: boolean;
  showBadges: boolean;
  showStats: boolean;
  showWeeklyRank: boolean;
}

export interface UsernameChangeInfo {
  canChangeNow: boolean;
  daysRemainingForNextChange: number;
  lastChangedDate?: string;
}
