export interface CircleProps {
  size: number;
  tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

export const CIRCLE_CONFIG = {
  1: { 
    color: 'rgba(59, 130, 246, 0.1)',   // Blue
    strokeColor: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.2)',
    radius: 16 
  },
  2: { 
    color: 'rgba(34, 197, 94, 0.1)',    // Green
    strokeColor: '#22C55E',
    glowColor: 'rgba(34, 197, 94, 0.2)',
    radius: 25 
  },
  3: { 
    color: 'rgba(239, 68, 68, 0.1)',    // Red
    strokeColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.2)',
    radius: 34 
  },
  4: { 
    color: 'rgba(234, 179, 8, 0.1)',    // Yellow
    strokeColor: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.2)',
    radius: 42 
  },
  5: { 
    color: 'rgba(168, 85, 247, 0.1)',   // Purple
    strokeColor: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.2)',
    radius: 52 
  },
  6: { 
    color: 'rgba(236, 72, 153, 0.1)',   // Pink
    strokeColor: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.2)',
    radius: 60 
  },
  7: { 
    color: 'rgba(20, 184, 166, 0.1)',   // Teal
    strokeColor: '#14B8A6',
    glowColor: 'rgba(20, 184, 166, 0.2)',
    radius: 68 
  },
  8: { 
    color: 'rgba(249, 115, 22, 0.1)',   // Orange
    strokeColor: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.2)',
    radius: 76 
  },
  9: { 
    color: 'rgba(99, 102, 241, 0.1)',   // Indigo
    strokeColor: '#6366F1',
    glowColor: 'rgba(99, 102, 241, 0.2)',
    radius: 87 
  },
  10: { 
    color: 'rgba(139, 92, 246, 0.1)',   // Violet
    strokeColor: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.2)',
    radius: 94 
  },
  11: { 
    color: 'rgba(236, 72, 153, 0.1)',   // Hot Pink
    strokeColor: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.2)',
    radius: 98 
  },
  12: { 
    color: 'rgba(6, 182, 212, 0.1)',    // Cyan
    strokeColor: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.2)',
    radius: 102 
  }
} as const; 

// Add PowerUp types
export interface PowerUpState {
  isHeavyBallActive: boolean;
}

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