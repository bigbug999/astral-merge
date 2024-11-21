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
  9: { color: '#6366F1', strokeColor: '#4338CA', radius: 87 },   // Indigo - 174px diameter
  10: { color: '#8B5CF6', strokeColor: '#6D28D9', radius: 94 },  // Violet - 188px diameter
  11: { color: '#EC4899', strokeColor: '#BE185D', radius: 98 },  // Pink - 196px diameter
  12: { color: '#06B6D4', strokeColor: '#0891B2', radius: 102 }, // Cyan - 204px diameter
} as const; 