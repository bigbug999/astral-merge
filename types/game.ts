export interface CircleProps {
  size: number;
  tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

export const CIRCLE_CONFIG = {
  1: { color: '#3B82F6', radius: 24 },   // Blue - 48px
  2: { color: '#22C55E', radius: 32 },   // Green - 64px
  3: { color: '#EF4444', radius: 42 },   // Red - 84px
  4: { color: '#EAB308', radius: 56 },   // Yellow - 112px
  5: { color: '#A855F7', radius: 74 },   // Purple - 148px
  6: { color: '#EC4899', radius: 98 },   // Pink - 196px
  7: { color: '#14B8A6', radius: 128 },  // Teal - 256px
  8: { color: '#F97316', radius: 168 },  // Orange - 336px
  9: { color: '#6366F1', radius: 220 },  // Indigo - 440px
} as const; 