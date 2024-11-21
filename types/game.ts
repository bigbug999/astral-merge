export interface CircleProps {
  size: number;
  tier: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

export const CIRCLE_CONFIG = {
  1: { color: '#3B82F6', strokeColor: '#1D4ED8', radius: 16 },   // Blue - 32px diameter
  2: { color: '#22C55E', strokeColor: '#15803D', radius: 25 },   // Green - 50px diameter
  3: { color: '#EF4444', strokeColor: '#B91C1C', radius: 34 },   // Red - 68px diameter
  4: { color: '#EAB308', strokeColor: '#A16207', radius: 42 },   // Yellow - 84px diameter
  5: { color: '#A855F7', strokeColor: '#7E22CE', radius: 52 },   // Purple - 104px diameter
  6: { color: '#EC4899', strokeColor: '#BE185D', radius: 60 },   // Pink - 120px diameter
  7: { color: '#14B8A6', strokeColor: '#0F766E', radius: 68 },   // Teal - 136px diameter
  8: { color: '#F97316', strokeColor: '#C2410C', radius: 76 },   // Orange - 152px diameter
  9: { color: '#6366F1', strokeColor: '#4338CA', radius: 87 },   // Indigo - 174px diameter
  10: { color: '#8B5CF6', strokeColor: '#6D28D9', radius: 94 },  // Violet - 188px diameter
  11: { color: '#EC4899', strokeColor: '#BE185D', radius: 98 },  // Pink - 196px diameter
  12: { color: '#06B6D4', strokeColor: '#0891B2', radius: 102 }, // Cyan - 204px diameter
} as const; 