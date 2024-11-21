export interface CircleProps {
  size: number;
  tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

export const CIRCLE_CONFIG = {
  1: { color: '#3B82F6', strokeColor: '#1D4ED8', radius: 24 },   // Blue
  2: { color: '#22C55E', strokeColor: '#15803D', radius: 32 },   // Green
  3: { color: '#EF4444', strokeColor: '#B91C1C', radius: 42 },   // Red
  4: { color: '#EAB308', strokeColor: '#A16207', radius: 56 },   // Yellow
  5: { color: '#A855F7', strokeColor: '#7E22CE', radius: 74 },   // Purple
  6: { color: '#EC4899', strokeColor: '#BE185D', radius: 98 },   // Pink
  7: { color: '#14B8A6', strokeColor: '#0F766E', radius: 128 },  // Teal
  8: { color: '#F97316', strokeColor: '#C2410C', radius: 168 },  // Orange
  9: { color: '#6366F1', strokeColor: '#4338CA', radius: 220 },  // Indigo
} as const; 