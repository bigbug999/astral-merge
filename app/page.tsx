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

// Reduce base scoring to start at 2 points for tier 1
const calculateScore = (tier: number, combo: number) => {
  const baseScore = Math.pow(2, tier) * 1; // Now tier 1 will be 2 points (2^1 * 1)
  const multiplier = 1 + (combo * 0.5); // Keeping the same combo multiplier
  return Math.floor(baseScore * multiplier);
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxTierSeen, setMaxTierSeen] = useState<number>(1);
  const [nextTier, setNextTier] = useState<TierType>(() => getRandomTier(maxTierSeen));

  const handleNewTier = useCallback((tier: number) => {
    setMaxTierSeen(prev => Math.max(prev, tier));
    setCombo(prev => prev + 1); // Increment combo on successful merge
    setScore(prev => prev + calculateScore(tier, combo));

    // Reset combo after a short delay if no new merges occur
    const timeoutId = setTimeout(() => {
      setCombo(0);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [combo]);

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

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (!containerRef.current) return;
    
    const { left } = containerRef.current.getBoundingClientRect();
    const relativeX = event.clientX - left;
    
    endDrag(relativeX);
  }, [endDrag]);

  // Fixed preview size of 32px diameter (16px radius)
  const PREVIEW_DIAMETER = 32;
  const getPreviewScale = (originalDiameter: number) => {
    return PREVIEW_DIAMETER / originalDiameter;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 p-4">
      <div className="w-full max-w-sm mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">Next:</span>
          <div className="w-16 h-16 border-2 border-zinc-700 rounded-lg flex items-center justify-center bg-zinc-800">
            <div 
              className="rounded-full"
              style={{
                width: CIRCLE_CONFIG[nextTier].radius * 2,
                height: CIRCLE_CONFIG[nextTier].radius * 2,
                backgroundColor: CIRCLE_CONFIG[nextTier].color,
                border: `3px solid ${CIRCLE_CONFIG[nextTier].strokeColor}`,
                boxShadow: `0 0 15px ${CIRCLE_CONFIG[nextTier].glowColor}`,
                transform: `scale(${getPreviewScale(CIRCLE_CONFIG[nextTier].radius * 2)})`,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-xl font-bold text-zinc-100">
            Score: {score}
          </div>
          {combo > 0 && (
            <div className="text-sm text-emerald-400 animate-pulse">
              Combo x{(1 + (combo * 0.5)).toFixed(1)}
            </div>
          )}
        </div>
      </div>

      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative w-full max-w-sm aspect-[2/3] border-2 border-zinc-700 rounded-lg overflow-hidden touch-none bg-zinc-800"
      />
    </div>
  );
}
