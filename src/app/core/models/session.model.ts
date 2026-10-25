export type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'blocked';

export interface UserSession {
  isAuthenticated: boolean;
  userId: string;
  username: string;
  email: string;
  avatar: string;
  rank: string;
  xp: number;
  targetRank: string;
  targetRankXp: number;
  tutorialCompleted: boolean;
  locationPermission: LocationPermissionState;
  isSessionExpired: boolean;
}

export interface TutorialStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  icon: string;
}
