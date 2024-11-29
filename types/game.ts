import { PowerUpState } from './powerups';

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

// Re-export PowerUpState for backward compatibility
export type { PowerUpState };