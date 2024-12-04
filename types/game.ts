import { PowerUpState } from './powerups';

export type TierType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;

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

// Add new CELESTIAL_COLORS for higher tiers
export const CELESTIAL_COLORS = {
  // Celestial colors (Tiers 13-17) - ethereal glows with cosmic effects
  COSMIC_BLUE: {
    color: 'rgba(56, 189, 248, 0.15)',
    strokeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.8)',
  },
  ASTRAL_PURPLE: {
    color: 'rgba(168, 85, 247, 0.15)',
    strokeColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.8)',
  },
  NEBULA_PINK: {
    color: 'rgba(236, 72, 153, 0.15)',
    strokeColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.8)',
  },
  GALAXY_INDIGO: {
    color: 'rgba(129, 140, 248, 0.15)',
    strokeColor: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.8)',
  },
  CELESTIAL_WHITE: {
    color: 'rgba(255, 255, 255, 0.15)',
    strokeColor: '#ffffff',
    glowColor: 'rgba(255, 255, 255, 0.9)',
  },
};

export const CIRCLE_CONFIG: Record<TierType, any> = {
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
  },
  13: { 
    color: CELESTIAL_COLORS.COSMIC_BLUE.color,
    strokeColor: CELESTIAL_COLORS.COSMIC_BLUE.strokeColor,
    glowColor: CELESTIAL_COLORS.COSMIC_BLUE.glowColor,
    radius: 106 
  },
  14: { 
    color: CELESTIAL_COLORS.ASTRAL_PURPLE.color,
    strokeColor: CELESTIAL_COLORS.ASTRAL_PURPLE.strokeColor,
    glowColor: CELESTIAL_COLORS.ASTRAL_PURPLE.glowColor,
    radius: 110 
  },
  15: { 
    color: CELESTIAL_COLORS.NEBULA_PINK.color,
    strokeColor: CELESTIAL_COLORS.NEBULA_PINK.strokeColor,
    glowColor: CELESTIAL_COLORS.NEBULA_PINK.glowColor,
    radius: 114 
  },
  16: { 
    color: CELESTIAL_COLORS.GALAXY_INDIGO.color,
    strokeColor: CELESTIAL_COLORS.GALAXY_INDIGO.strokeColor,
    glowColor: CELESTIAL_COLORS.GALAXY_INDIGO.glowColor,
    radius: 118 
  },
  17: { 
    color: CELESTIAL_COLORS.CELESTIAL_WHITE.color,
    strokeColor: CELESTIAL_COLORS.CELESTIAL_WHITE.strokeColor,
    glowColor: CELESTIAL_COLORS.CELESTIAL_WHITE.glowColor,
    radius: 122 
  }
} as const; 

// Re-export PowerUpState for backward compatibility
export type { PowerUpState };