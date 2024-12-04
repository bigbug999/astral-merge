import Matter from 'matter-js';

export interface PowerUpStats {
  density: number;
  velocity: number;
  force: number;
  timeRemaining: number;
  slop: number;
}

export interface CircleBody extends Matter.Body {
  tier?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  hasBeenDropped?: boolean;
  isMerging?: boolean;
  isHeavyBall?: boolean;
  isVoidBall?: boolean;
  isSuperVoid?: boolean;
  deletionsRemaining?: number;
  powerUpDropTime?: number;
  inDangerZone?: boolean;
  dangerZoneStartTime?: number;
  spawnTime?: number;
  powerUpStats?: PowerUpStats;
  dropTime?: number;
  isSpawnedBall?: boolean;
} 