'use client';

import { useRef, useState, useCallback } from 'react';
import { useMatterJs } from '@/hooks/useMatterJs';
import { CIRCLE_CONFIG } from '@/types/game';

type TierType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// Helper function to get random tier with weights
const getRandomTier = (maxTierSeen: number): TierType => {
  // Adjust weights based on maxTierSeen, capped at tier 4
  const weights = {
    1: 50,  // 50% chance for tier 1
    2: maxTierSeen >= 2 ? 25 : 0,  // 25% chance if unlocked
    3: maxTierSeen >= 3 ? 15 : 0,  // 15% chance if unlocked
    4: maxTierSeen >= 4 ? 10 : 0,  // 10% chance if unlocked
    5: 0,   // Never spawn tier 5 or higher
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const [tier, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return Number(tier) as TierType;
    }
  }
  
  return 1; // Fallback to tier 1
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [maxTierSeen, setMaxTierSeen] = useState<number>(1);
  const [nextTier, setNextTier] = useState<TierType>(() => getRandomTier(maxTierSeen));

  const handleNewTier = useCallback((tier: number) => {
    setMaxTierSeen(prev => Math.max(prev, tier));
  }, []);

  const handleDrop = useCallback(() => {
    setNextTier(getRandomTier(maxTierSeen));
  }, [maxTierSeen]);

  const { startDrag, updateDrag, endDrag } = useMatterJs(
    containerRef, 
    handleDrop, 
    handleNewTier,
    nextTier
  );

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (!containerRef.current) return;
    
    const { left, width } = containerRef.current.getBoundingClientRect();
    const relativeX = event.clientX - left;
    
    if (relativeX >= 0 && relativeX <= width) {
      startDrag(relativeX);
    }
  }, [startDrag]);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!containerRef.current) return;
    
    const { left } = containerRef.current.getBoundingClientRect();
    const relativeX = event.clientX - left;
    updateDrag(relativeX);
  }, [updateDrag]);

  const handlePointerUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // Fixed preview size of 32px diameter (16px radius)
  const PREVIEW_DIAMETER = 32;
  const getPreviewScale = (originalDiameter: number) => {
    return PREVIEW_DIAMETER / originalDiameter;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Next:</span>
          <div className="w-16 h-16 border-2 border-foreground/30 rounded-lg flex items-center justify-center">
            <div 
              className="rounded-full"
              style={{
                width: CIRCLE_CONFIG[nextTier].radius * 2,
                height: CIRCLE_CONFIG[nextTier].radius * 2,
                backgroundColor: CIRCLE_CONFIG[nextTier].color,
                border: `2px solid ${CIRCLE_CONFIG[nextTier].strokeColor}`, // Fixed border width for preview
                transform: `scale(${getPreviewScale(CIRCLE_CONFIG[nextTier].radius * 2)})`,
              }}
            />
          </div>
        </div>

        <div className="text-xl font-bold">
          Score: {score}
        </div>
      </div>

      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative w-full max-w-sm aspect-[2/3] border-2 border-foreground rounded-lg overflow-hidden touch-none"
      />
    </div>
  );
}
