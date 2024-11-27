export interface CircleProps {
  size: number;
  tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

// Color Legend for Circle Tiers
export const MYSTICAL_COLORS = {
  // Cool mystical colors (Tiers 1-4)
  MEDIUM_PURPLE: {
    color: 'rgba(139, 92, 246, 0.15)',
    strokeColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.3)',
  },
  CYAN: {
    color: 'rgba(6, 182, 212, 0.15)',
    strokeColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.3)',
  },
  PINK: {
    color: 'rgba(236, 72, 153, 0.15)',
    strokeColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.3)',
  },
  BRIGHT_BLUE: {
    color: 'rgba(59, 130, 246, 0.15)',
    strokeColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.3)',
  },
};

export const TRANSITION_COLORS = {
  // Transition colors (Tiers 5-7)
  DEEP_PURPLE: {
    color: 'rgba(168, 85, 247, 0.15)',
    strokeColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.3)',
  },
  DARK_CYAN: {
    color: 'rgba(34, 197, 94, 0.15)',
    strokeColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.3)',
  },
  RICH_RED: {
    color: 'rgba(190, 18, 60, 0.15)',
    strokeColor: '#be123c',
    glowColor: 'rgba(190, 18, 60, 0.3)',
  },
};

export const WARM_COLORS = {
  // Warm colors (Tiers 8-12)
  BRIGHT_ORANGE: {
    color: 'rgba(249, 115, 22, 0.15)',
    strokeColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.35)',
  },
  GOLDEN_YELLOW: {
    color: 'rgba(234, 179, 8, 0.15)',
    strokeColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.4)',
  },
  PURE_GOLD: {
    color: 'rgba(255, 215, 0, 0.15)',
    strokeColor: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 0.45)',
  },
  DEEP_AMBER: {
    color: 'rgba(217, 119, 6, 0.15)',
    strokeColor: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.45)',
  },
  BRILLIANT_GOLD: {
    color: 'rgba(255, 177, 27, 0.15)',
    strokeColor: '#ffb11b',
    glowColor: 'rgba(255, 177, 27, 0.5)',
  },
};

export const CIRCLE_CONFIG = {
  1: { 
    color: MYSTICAL_COLORS.MEDIUM_PURPLE.color,
    strokeColor: MYSTICAL_COLORS.MEDIUM_PURPLE.strokeColor,
    glowColor: MYSTICAL_COLORS.MEDIUM_PURPLE.glowColor,
    radius: 16 
  },
  2: { 
    color: MYSTICAL_COLORS.CYAN.color,
    strokeColor: MYSTICAL_COLORS.CYAN.strokeColor,
    glowColor: MYSTICAL_COLORS.CYAN.glowColor,
    radius: 25 
  },
  3: { 
    color: MYSTICAL_COLORS.PINK.color,
    strokeColor: MYSTICAL_COLORS.PINK.strokeColor,
    glowColor: MYSTICAL_COLORS.PINK.glowColor,
    radius: 34 
  },
  4: { 
    color: MYSTICAL_COLORS.BRIGHT_BLUE.color,
    strokeColor: MYSTICAL_COLORS.BRIGHT_BLUE.strokeColor,
    glowColor: MYSTICAL_COLORS.BRIGHT_BLUE.glowColor,
    radius: 42 
  },
  5: { 
    color: TRANSITION_COLORS.DEEP_PURPLE.color,
    strokeColor: TRANSITION_COLORS.DEEP_PURPLE.strokeColor,
    glowColor: TRANSITION_COLORS.DEEP_PURPLE.glowColor,
    radius: 52 
  },
  6: { 
    color: TRANSITION_COLORS.DARK_CYAN.color,
    strokeColor: TRANSITION_COLORS.DARK_CYAN.strokeColor,
    glowColor: TRANSITION_COLORS.DARK_CYAN.glowColor,
    radius: 60 
  },
  7: { 
    color: TRANSITION_COLORS.RICH_RED.color,
    strokeColor: TRANSITION_COLORS.RICH_RED.strokeColor,
    glowColor: TRANSITION_COLORS.RICH_RED.glowColor,
    radius: 68 
  },
  8: { 
    color: WARM_COLORS.BRIGHT_ORANGE.color,
    strokeColor: WARM_COLORS.BRIGHT_ORANGE.strokeColor,
    glowColor: WARM_COLORS.BRIGHT_ORANGE.glowColor,
    radius: 76 
  },
  9: { 
    color: WARM_COLORS.GOLDEN_YELLOW.color,
    strokeColor: WARM_COLORS.GOLDEN_YELLOW.strokeColor,
    glowColor: WARM_COLORS.GOLDEN_YELLOW.glowColor,
    radius: 87 
  },
  10: { 
    color: WARM_COLORS.PURE_GOLD.color,
    strokeColor: WARM_COLORS.PURE_GOLD.strokeColor,
    glowColor: WARM_COLORS.PURE_GOLD.glowColor,
    radius: 94 
  },
  11: { 
    color: WARM_COLORS.DEEP_AMBER.color,
    strokeColor: WARM_COLORS.DEEP_AMBER.strokeColor,
    glowColor: WARM_COLORS.DEEP_AMBER.glowColor,
    radius: 98 
  },
  12: { 
    color: WARM_COLORS.BRILLIANT_GOLD.color,
    strokeColor: WARM_COLORS.BRILLIANT_GOLD.strokeColor,
    glowColor: WARM_COLORS.BRILLIANT_GOLD.glowColor,
    radius: 102 
  }
} as const; 

// Update PowerUpState interface
export interface PowerUpState {
  isHeavyBallActive: boolean;
  isSuperHeavyBallActive: boolean;
  isNegativeBallActive: boolean;
  heavyBallUses: number;      // Add counter for heavy ball uses
  superHeavyBallUses: number; // Add counter for super heavy ball uses
  negativeBallUses: number;   // Add counter for negative ball uses
}

// Add constants for initial uses
export const POWER_UP_USES = {
  HEAVY_BALL: 10,
  SUPER_HEAVY_BALL: 5,
  NEGATIVE_BALL: 3,
} as const;

// Add heavy ball configuration
export const HEAVY_BALL_CONFIG = {
  density: 0.025,         // Increased from 0.015 to 0.025 for faster dropping
  friction: 0.001,        // Very low friction (slippery)
  frictionAir: 0.0001,    // Reduced air friction for faster falling
  restitution: 0.2,       // Slightly less bouncy
  strokeColor: '#ffffff',
  strokeWidth: 4,
  glowColor: 'rgba(255, 255, 255, 0.3)',
} as const; 

// Add super heavy ball configuration
export const SUPER_HEAVY_BALL_CONFIG = {
  density: 0.075,         // 3x the heavy ball density
  friction: 0.001,        
  frictionAir: 0.0001,    
  restitution: 0.1,       // Even less bouncy
  strokeColor: '#ff0000', // Red color for super heavy
  strokeWidth: 4,
  glowColor: 'rgba(255, 0, 0, 0.3)',
} as const; 

// Update negative ball configuration
export const NEGATIVE_BALL_CONFIG = {
  density: 0.005,         // Light for fast movement
  friction: 0.00001,      // Almost no friction
  frictionAir: 0.000001,  // Minimal air resistance
  restitution: 0.98,      // Extremely bouncy
  strokeColor: '#FF1493', // Hot pink
  strokeWidth: 4,
  glowColor: 'rgba(255, 20, 147, 0.5)',
  deletionLimit: 2,       // Changed from 3 to 2 balls to delete
  initialSpeed: 8,        // Initial speed multiplier
  bounceForce: 0.03      // Force applied on bounces
} as const; 