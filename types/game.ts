export interface CircleProps {
  size: number;
  tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

export const CIRCLE_CONFIG = {
  1: { 
    color: 'rgba(139, 92, 246, 0.15)',    // Medium purple
    strokeColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.3)',
    radius: 16 
  },
  2: { 
    color: 'rgba(6, 182, 212, 0.15)',     // Cyan
    strokeColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.3)',
    radius: 25 
  },
  3: { 
    color: 'rgba(236, 72, 153, 0.15)',    // Pink
    strokeColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.3)',
    radius: 34 
  },
  4: { 
    color: 'rgba(59, 130, 246, 0.15)',    // Bright blue
    strokeColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    radius: 42 
  },
  5: { 
    color: 'rgba(168, 85, 247, 0.15)',    // Deep purple
    strokeColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    radius: 52 
  },
  6: { 
    color: 'rgba(14, 116, 144, 0.15)',    // Dark cyan
    strokeColor: '#0e7490',
    glowColor: 'rgba(14, 116, 144, 0.3)',
    radius: 60 
  },
  7: { 
    color: 'rgba(190, 18, 60, 0.15)',     // Rich red
    strokeColor: '#be123c',
    glowColor: 'rgba(190, 18, 60, 0.3)',
    radius: 68 
  },
  8: { 
    color: 'rgba(249, 115, 22, 0.15)',    // Bright orange
    strokeColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.35)',
    radius: 76 
  },
  9: { 
    color: 'rgba(234, 179, 8, 0.15)',     // Golden yellow
    strokeColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    radius: 87 
  },
  10: { 
    color: 'rgba(255, 215, 0, 0.15)',     // Pure gold
    strokeColor: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 0.45)',
    radius: 94 
  },
  11: { 
    color: 'rgba(217, 119, 6, 0.15)',     // Deep amber
    strokeColor: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.45)',
    radius: 98 
  },
  12: { 
    color: 'rgba(255, 177, 27, 0.15)',    // Brilliant orange-gold
    strokeColor: '#ffb11b',
    glowColor: 'rgba(255, 177, 27, 0.5)',  
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