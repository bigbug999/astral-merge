declare global {
  interface Window {
    comboTimeoutId?: NodeJS.Timeout;
  }
}

'use client';

import { useRef, useState, useCallback } from 'react';
import { useMatterJs } from '@/hooks/useMatterJs';
import { CIRCLE_CONFIG } from '@/types/game';
import { PowerUpState, POWER_UPS, createInitialPowerUpState, getPowerUpsByGroup } from '@/types/powerups';
import { PowerUpButton } from '@/components/PowerUpButton';
import { cn } from '@/lib/utils';
import { ColorLegend } from '@/components/ColorLegend';
import { PowerUpDebugUI } from '@/components/PowerUpDebugUI';
import { FlaskButton } from '@/components/FlaskButton';
import { FlaskState, FLASKS, createInitialFlaskState } from '@/types/flasks';
import { FlaskIcon } from '@/components/icons/FlaskIcon';
import { FeatherIcon } from '@/components/icons/FeatherIcon';
import { SparklesIcon } from '@/components/icons/SparklesIcon';
import { BounceIcon } from '@/components/icons/BounceIcon';
import { FlaskDropdown } from '@/components/FlaskDropdown';

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

// Update the spawn height constant
const SPAWN_HEIGHT = 75; // Set to halfway between 60 and 90

// Add a helper function to get the icon component
const getFlaskIcon = (iconName: string) => {
  switch (iconName) {
    case 'FeatherIcon':
      return FeatherIcon;
    case 'SparklesIcon':
      return SparklesIcon;
    case 'BounceIcon':
      return BounceIcon;
    default:
      return FlaskIcon;
  }
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxTierSeen, setMaxTierSeen] = useState<number>(1);
  const [nextTier, setNextTier] = useState<TierType>(() => getRandomTier(maxTierSeen));
  const [powerUps, setPowerUps] = useState<PowerUpState>(createInitialPowerUpState(true));
  const [isGameOver, setIsGameOver] = useState(false);
  const [flaskState, setFlaskState] = useState<FlaskState>(createInitialFlaskState());

  const handleNewTier = useCallback((tier: number) => {
    setMaxTierSeen(prev => Math.max(prev, tier));
    setCombo(prev => prev + 1);
    setScore(prev => prev + calculateScore(tier, combo));

    // Clear any existing timeout
    if (window.comboTimeoutId) {
      clearTimeout(window.comboTimeoutId);
    }

    // Set new timeout for 4 seconds
    const timeoutId = setTimeout(() => {
      setCombo(0);
    }, 4000);

    // Store the timeout ID globally so we can clear it later
    window.comboTimeoutId = timeoutId;

    return () => {
      if (window.comboTimeoutId) {
        clearTimeout(window.comboTimeoutId);
      }
    };
  }, [combo]);

  const handleDrop = useCallback(() => {
    setNextTier(getRandomTier(maxTierSeen));
  }, [maxTierSeen]);

  const handlePowerUpUse = useCallback(() => {
    setPowerUps(prev => {
      if (prev.activePowerUpId) {
        return {
          ...prev,
          powerUps: {
            ...prev.powerUps,
            [prev.activePowerUpId]: prev.powerUps[prev.activePowerUpId] - 1
          },
          activePowerUpId: null
        };
      }
      return prev;
    });
  }, []);

  const handleGameOver = useCallback(() => {
    setIsGameOver(true);
    // Add any additional game over logic here
  }, []);

  const handlePowerUpEarned = useCallback((level: 1 | 2 | 3) => {
    setPowerUps(prev => {
      const newPowerUps = { ...prev.powerUps };
      
      // Give one of each power-up at the earned level
      Object.entries(POWER_UPS).forEach(([id, powerUp]) => {
        if (powerUp.level === level) {
          newPowerUps[id] = Math.min(
            (newPowerUps[id] || 0) + 1,
            powerUp.maxUses
          );
        }
      });
      
      return {
        ...prev,
        powerUps: newPowerUps
      };
    });
  }, []);

  const { 
    startDrag, 
    updateDrag, 
    endDrag, 
    spawnStressTestBalls, 
    engine,
    currentBall,
    debug
  } = useMatterJs(
    containerRef, 
    handleDrop, 
    handleNewTier,
    nextTier,
    powerUps,
    handlePowerUpUse,
    handleGameOver,
    flaskState,
    handlePowerUpEarned
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

  // Update the PREVIEW_DIAMETER constant to be smaller and more consistent
  const PREVIEW_DIAMETER = 24; // Smaller fixed size for all preview balls
  const PREVIEW_STROKE_WIDTH = 2; // Consistent stroke width

  // Add helper function to get combo color
  const getComboColor = (combo: number) => {
    // Get the tier based on combo count (every 2 combos = 1 tier up)
    const colorTier = Math.min(Math.floor(combo / 2) + 1, 12) as keyof typeof CIRCLE_CONFIG;
    const config = CIRCLE_CONFIG[colorTier];
    
    // For tiers 1-8, use strokeColor
    if (colorTier <= 8) {
      return config.strokeColor;
    }
    // For tiers 9-12, use color directly
    return config.color;
  };

  // Add refill power-ups function
  const handleRefillPowerUps = useCallback(() => {
    setPowerUps(createInitialPowerUpState(false));
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-900 p-4 select-none">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Game Container */}
        <div 
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full aspect-[2/3] outline outline-2 outline-zinc-700 rounded-lg overflow-hidden touch-none bg-zinc-800 mb-1 select-none"
        >
          {/* Ceiling */}
          <div className="absolute top-0 left-0 right-0 h-1" />

          {/* Preview, Score, and Flask Container */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5">
            {/* Left side group */}
            <div className="flex items-center gap-1.5">
              {/* Preview Circle */}
              <div className="w-9 h-9 border-2 border-zinc-700/50 rounded-lg flex items-center justify-center bg-zinc-800/30 backdrop-blur-md shrink-0">
                <div 
                  className="rounded-full"
                  style={{
                    width: `${PREVIEW_DIAMETER}px`,
                    height: `${PREVIEW_DIAMETER}px`,
                    backgroundColor: CIRCLE_CONFIG[nextTier].color,
                    border: `${PREVIEW_STROKE_WIDTH}px solid ${CIRCLE_CONFIG[nextTier].strokeColor}`,
                    boxShadow: `0 0 10px ${CIRCLE_CONFIG[nextTier].color.replace('0.1', '0.2')}`,
                  }}
                />
              </div>

              {/* Score Display */}
              <div className="h-9 px-1.5 w-[108px] rounded-lg border-2 border-zinc-700/50 bg-zinc-800/30 backdrop-blur-md flex flex-col justify-center">
                <div className="text-xs font-bold text-zinc-100/90">
                  {score}
                </div>
                <div 
                  className={`text-[9px] transition-colors ${combo > 0 ? 'animate-pulse' : ''}`}
                  style={{
                    color: combo > 0 ? getComboColor(combo) : 'rgba(244, 244, 245, 0.9)'
                  }}
                >
                  ×{(1 + (combo * 0.5)).toFixed(1)}
                </div>
              </div>
            </div>

            {/* Flask Dropdown */}
            <FlaskDropdown
              value={flaskState.activeFlaskId}
              onChange={(value) => setFlaskState({ activeFlaskId: value })}
            />
          </div>
        </div>

        {/* Power-up Section */}
        <div className="flex flex-col gap-4">
          {/* Combined Power-ups Row */}
          <div className="grid grid-cols-7 gap-2 w-full">
            {/* Gravity Power-ups */}
            {getPowerUpsByGroup('GRAVITY').map(powerUp => (
              <PowerUpButton
                key={powerUp.id}
                powerUp={powerUp}
                isActive={powerUps.activePowerUpId === powerUp.id}
                remainingUses={powerUps.powerUps[powerUp.id]}
                onClick={() => {
                  setPowerUps(prev => ({
                    ...prev,
                    activePowerUpId: prev.activePowerUpId === powerUp.id ? null : 
                      (prev.powerUps[powerUp.id] > 0 ? powerUp.id : null)
                  }));
                }}
              />
            ))}

            {/* Divider */}
            <div className="flex items-center justify-center">
              <div className="h-5 w-px bg-zinc-700" />
            </div>

            {/* Void Power-ups */}
            {getPowerUpsByGroup('VOID').map(powerUp => (
              <PowerUpButton
                key={powerUp.id}
                powerUp={powerUp}
                isActive={powerUps.activePowerUpId === powerUp.id}
                remainingUses={powerUps.powerUps[powerUp.id]}
                onClick={() => {
                  setPowerUps(prev => ({
                    ...prev,
                    activePowerUpId: prev.activePowerUpId === powerUp.id ? null : 
                      (prev.powerUps[powerUp.id] > 0 ? powerUp.id : null)
                  }));
                }}
              />
            ))}
          </div>

          {/* Debug UI */}
          <PowerUpDebugUI 
            currentBall={currentBall} 
            powerUps={powerUps} 
            debug={debug}
          />
        </div>

        {/* Stress Test Button */}
        <div className="w-full flex flex-col gap-2 select-none">
          <button 
            className="w-full p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 transition-colors select-none"
            onClick={() => spawnStressTestBalls(25)}
          >
            Stress Test (Spawn 25 Balls)
          </button>
          
          {/* Add Refill Power-ups Button */}
          <button 
            className="w-full p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-400 transition-colors select-none"
            onClick={handleRefillPowerUps}
          >
            Refill Power-ups (Debug)
          </button>
        </div>

        {/* Color legend */}
        <div className="w-full">
          <ColorLegend />
        </div>
      </div>

      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-zinc-800/90 p-6 rounded-lg shadow-xl border border-zinc-700 max-w-sm w-full mx-4 transform scale-100 animate-in fade-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Game Over!</h2>
            <p className="text-zinc-300 mb-6 text-center text-lg">Final Score: {score}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
