import { PowerUpState } from './powerups';

export type TierType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface CircleProps {
  size: number;
  tier: TierType;
}

// Color Legend for Circle Tiers
export const MYSTICAL_COLORS = {
  // Neutral/Metallic colors (Tiers 1-4) - subtle glows
  SLATE: {
    color: 'rgba(167, 139, 250, 0.15)',       // violet-400 with some gray mix
    strokeColor: '#a78bfa',
    glowColor: 'rgba(192, 132, 252, 0.25)',   // purple-400 for slightly warmer glow
  },
  HEATHER: {
    color: 'rgba(134, 239, 172, 0.15)',     // green-300 (green-tinted)
    strokeColor: '#86ef96',
    glowColor: 'rgba(134, 239, 172, 0.25)', // Matching green glow
  },
  PEWTER: {
    color: 'rgba(226, 232, 240, 0.15)',     // slate-200 (lighter silvery)
    strokeColor: '#e2e8f0',
    glowColor: 'rgba(226, 232, 240, 0.3)',  // Brighter silvery glow
  },
  STEEL: {
    color: 'rgba(96, 165, 250, 0.15)',
    strokeColor: '#60a5fa',
    glowColor: 'rgba(147, 197, 253, 0.35)',  // Bluer glow (blue-300)
  },
};

export const TRANSITION_COLORS = {
  // Earthy colors (Tiers 5-7) - moderate glows
  TERRA_RED: {
    color: 'rgba(185, 28, 28, 0.15)',
    strokeColor: '#b91c1c',
    glowColor: 'rgba(220, 38, 38, 0.4)',     // Brighter red glow
  },
  FOREST_GREEN: {
    color: 'rgba(34, 197, 94, 0.15)',
    strokeColor: '#22c55e',
    glowColor: 'rgba(74, 222, 128, 0.4)',    // Lighter green glow
  },
  DEEP_BLUE: {
    color: 'rgba(59, 130, 246, 0.15)',
    strokeColor: '#3b82f6',
    glowColor: 'rgba(96, 165, 250, 0.4)',    // Brighter blue glow
  },
};

export const WARM_COLORS = {
  // Energy colors (Tiers 8-12) - intense glows with hue shifts
  BRIGHT_ORANGE: {
    color: 'rgba(251, 146, 60, 0.15)',
    strokeColor: '#fb923c',
    glowColor: 'rgba(253, 186, 116, 0.5)',   // Shifted toward yellow
  },
  INTENSE_ORANGE: {
    color: 'rgba(255, 138, 76, 0.15)',
    strokeColor: '#ff8a4c',
    glowColor: 'rgba(254, 215, 170, 0.55)',  // More yellow shift
  },
  ORANGE_YELLOW: {
    color: 'rgba(253, 186, 116, 0.15)',
    strokeColor: '#fdba74',
    glowColor: 'rgba(253, 224, 71, 0.6)',    // Yellow glow
  },
  BRIGHT_YELLOW: {
    color: 'rgba(253, 224, 71, 0.15)',
    strokeColor: '#fde047',
    glowColor: 'rgba(254, 240, 138, 0.65)',  // Bright yellow-white glow
  },
  WHITE_YELLOW: {
    color: 'rgba(254, 240, 138, 0.15)',
    strokeColor: '#fef08a',
    glowColor: 'rgba(255, 255, 255, 0.7)',   // Pure white glow at max
  },
};

export const CIRCLE_CONFIG: Record<TierType, {
  color: string;
  strokeColor: string;
  glowColor: string;
  radius: number;
}> = {
  1: { 
    color: MYSTICAL_COLORS.SLATE.color,
    strokeColor: MYSTICAL_COLORS.SLATE.strokeColor,
    glowColor: MYSTICAL_COLORS.SLATE.glowColor,
    radius: 16 
  },
  2: { 
    color: MYSTICAL_COLORS.HEATHER.color,
    strokeColor: MYSTICAL_COLORS.HEATHER.strokeColor,
    glowColor: MYSTICAL_COLORS.HEATHER.glowColor,
    radius: 25 
  },
  3: { 
    color: MYSTICAL_COLORS.PEWTER.color,
    strokeColor: MYSTICAL_COLORS.PEWTER.strokeColor,
    glowColor: MYSTICAL_COLORS.PEWTER.glowColor,
    radius: 34 
  },
  4: { 
    color: MYSTICAL_COLORS.STEEL.color,
    strokeColor: MYSTICAL_COLORS.STEEL.strokeColor,
    glowColor: MYSTICAL_COLORS.STEEL.glowColor,
    radius: 42 
  },
  5: { 
    color: TRANSITION_COLORS.TERRA_RED.color,
    strokeColor: TRANSITION_COLORS.TERRA_RED.strokeColor,
    glowColor: TRANSITION_COLORS.TERRA_RED.glowColor,
    radius: 52 
  },
  6: { 
    color: TRANSITION_COLORS.FOREST_GREEN.color,
    strokeColor: TRANSITION_COLORS.FOREST_GREEN.strokeColor,
    glowColor: TRANSITION_COLORS.FOREST_GREEN.glowColor,
    radius: 60 
  },
  7: { 
    color: TRANSITION_COLORS.DEEP_BLUE.color,
    strokeColor: TRANSITION_COLORS.DEEP_BLUE.strokeColor,
    glowColor: TRANSITION_COLORS.DEEP_BLUE.glowColor,
    radius: 68 
  },
  8: { 
    color: WARM_COLORS.BRIGHT_ORANGE.color,
    strokeColor: WARM_COLORS.BRIGHT_ORANGE.strokeColor,
    glowColor: WARM_COLORS.BRIGHT_ORANGE.glowColor,
    radius: 76 
  },
  9: { 
    color: WARM_COLORS.INTENSE_ORANGE.color,
    strokeColor: WARM_COLORS.INTENSE_ORANGE.strokeColor,
    glowColor: WARM_COLORS.INTENSE_ORANGE.glowColor,
    radius: 87 
  },
  10: { 
    color: WARM_COLORS.ORANGE_YELLOW.color,
    strokeColor: WARM_COLORS.ORANGE_YELLOW.strokeColor,
    glowColor: WARM_COLORS.ORANGE_YELLOW.glowColor,
    radius: 94 
  },
  11: { 
    color: WARM_COLORS.BRIGHT_YELLOW.color,
    strokeColor: WARM_COLORS.BRIGHT_YELLOW.strokeColor,
    glowColor: WARM_COLORS.BRIGHT_YELLOW.glowColor,
    radius: 98 
  },
  12: { 
    color: WARM_COLORS.WHITE_YELLOW.color,
    strokeColor: WARM_COLORS.WHITE_YELLOW.strokeColor,
    glowColor: WARM_COLORS.WHITE_YELLOW.glowColor,
    radius: 102 
  }
} as const; 

// Re-export PowerUpState for backward compatibility
export type { PowerUpState };