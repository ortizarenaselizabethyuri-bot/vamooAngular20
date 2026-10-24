export interface MapCoordinates {
  x: number; // Porcentaje relativo 0 - 100 dentro del lienzo 2D
  y: number; // Porcentaje relativo 0 - 100 dentro del lienzo 2D
}

export interface MapPoi {
  id: number;
  name: string;
  category: 'Monumento' | 'Parque' | 'Cultura' | 'Misterio' | 'Deporte';
  icon: string;
  coords: MapCoordinates;
  description: string;
  historicalFact: string;
  distanceMeters: number;
  walkingMinutes: number;
  xpReward: number;
  badgeUnlock?: string;
  verified: boolean;
}

export interface ActiveMission {
  poiId: number;
  poiName: string;
  icon: string;
  category: string;
  xpReward: number;
  startedAt: Date;
  targetCoords: MapCoordinates;
  currentDistanceMeters: number;
  isWithinArrivalZone: boolean; // <= 35 metros
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface RewardCelebrationData {
  poiName: string;
  xpEarned: number;
  badgeName?: string;
  totalXpNow: number;
  rankName: string;
}
