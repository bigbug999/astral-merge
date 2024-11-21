'use client';

import { useRef, useState, useCallback } from 'react';
import { useMatterJs } from '@/hooks/useMatterJs';
import { CIRCLE_CONFIG } from '@/types/game';

type TierType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// Helper function to get random tier with weights
const getRandomTier = (maxTierSeen: number): TierType => {
  // Adjust weights based on maxTierSeen
  const weights = {
    1: 50,  // 50% chance for tier 1
    2: maxTierSeen >= 2 ? 25 : 0,  // 25% chance if unlocked
    3: maxTierSeen >= 3 ? 15 : 0,  // 15% chance if unlocked
    4: maxTierSeen >= 4 ? 7 : 0,   // 7% chance if unlocked
    5: maxTierSeen >= 5 ? 3 : 0,   // 3% chance if unlocked
    6: 0,   // Never randomly spawn tier 6 or higher
    7: 0,
    8: 0,
    9: 0,
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
  const [currentTier, setCurrentTier] = useState<TierType>(1);
  const [nextTier, setNextTier] = useState<TierType>(1);
  const [maxTierSeen, setMaxTierSeen] = useState<number>(1);

  const handleDrop = useCallback(() => {
    setCurrentTier(nextTier);
    setNextTier(getRandomTier(maxTierSeen));
  }, [nextTier, maxTierSeen]);

  // Update maxTierSeen when a new tier is created (from merging)
  const handleNewTier = useCallback((tier: number) => {
    setMaxTierSeen(prev => Math.max(prev, tier));
  }, []);

  const { startDrag, updateDrag, endDrag } = useMatterJs(containerRef, handleDrop, handleNewTier);

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
                border: `${Math.max(3, CIRCLE_CONFIG[nextTier].radius * 0.1)}px solid ${CIRCLE_CONFIG[nextTier].strokeColor}`,
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
