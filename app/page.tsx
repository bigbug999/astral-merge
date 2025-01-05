declare global {
  interface Window {
    comboTimeoutId?: NodeJS.Timeout;
  }
}

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useMatterJs } from '@/hooks/useMatterJs';
import { CIRCLE_CONFIG } from '@/types/game';
import { PowerUp, PowerUpState, POWER_UPS, createInitialPowerUpState, getPowerUpsByGroup } from '@/types/powerups';
import { PowerUpButton } from '@/components/PowerUpButton';
import { cn } from '@/lib/utils';
import { ColorLegend } from '@/components/ColorLegend';
import { PowerUpDebugUI } from '@/components/PowerUpDebugUI';
import { FlaskButton } from '@/components/FlaskButton';
import { FlaskState, FLASK_SIZES, FLASK_EFFECTS, createInitialFlaskState, FlaskSizeId, FlaskEffectId } from '@/types/flasks';
import { FlaskIcon } from '@/components/icons/FlaskIcon';
import { FlaskRoundIcon } from '@/components/icons/FlaskRoundIcon';
import { FlaskConicalIcon } from '@/components/icons/FlaskConicalIcon';
import { ChemistryFlaskIcon } from '@/components/icons/ChemistryFlaskIcon';
import { FeatherIcon } from '@/components/icons/FeatherIcon';
import { SparklesIcon } from '@/components/icons/SparklesIcon';
import { BounceIcon } from '@/components/icons/BounceIcon';
import { StormIcon } from '@/components/icons/StormIcon';
import { WeightIcon } from '@/components/icons/WeightIcon';
import { SuperWeightIcon } from '@/components/icons/SuperWeightIcon';
import { UltraWeightIcon } from '@/components/icons/UltraWeightIcon';
import { NegativeBallIcon } from '@/components/icons/NegativeBallIcon';
import { SuperNegativeBallIcon } from '@/components/icons/SuperNegativeBallIcon';
import { UltraNegativeBallIcon } from '@/components/icons/UltraNegativeBallIcon';
import { FlaskDropdown } from '@/components/FlaskDropdown';
import FlaskEffects from '@/components/FlaskEffects';
import { TestTubeIcon } from '@/components/icons/TestTubeIcon';
import { PowerUpSelectionModal } from '@/components/PowerUpSelectionModal';
import { PowerUpSlot } from '@/components/PowerUpSlot';
import { FlaskItem } from '@/types/flasks';

type TierType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// Add this type near the top of the file
type SelectedItem = PowerUp | FlaskItem;

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
    case 'StormIcon':
      return StormIcon;
    default:
      return FlaskIcon;
  }
};

// Update the getComboColor function
const getComboColor = (combo: number) => {
  if (combo === 0) return 'rgba(244, 244, 245, 0.9)'; // Default color
  
  // Create a cycling hue based on combo count
  // Each combo will shift the hue by 30 degrees (12 combos = full rainbow)
  const hue = (combo * 30) % 360;
  
  // Increase saturation and brightness as combo increases
  const saturation = Math.min(100, 70 + (combo * 2)); // Start at 70%, max 100%
  const lightness = Math.min(75, 45 + (combo * 1.5)); // Start at 45%, max 75%
  const alpha = Math.min(1, 0.9 + (combo * 0.01)); // Slight increase in opacity
  
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
};

// Add level configuration
const LEVEL_CONFIG = {
  BASE_XP: 1000,
  XP_INCREASE_RATE: 2,
  POWER_UPS_PER_SELECTION: 3
};

// Calculate required XP for next level
const calculateRequiredXP = (level: number) => {
  return Math.floor(LEVEL_CONFIG.BASE_XP * Math.pow(LEVEL_CONFIG.XP_INCREASE_RATE, level - 1));
};

// Get random power-ups for selection
const getRandomPowerUps = (count: number, maxLevel: number, currentSlots: (string | null)[]) => {
  // Get all available power-ups that aren't already in slots
  const availablePowerUps = Object.values(POWER_UPS)
    .filter(p => !currentSlots.includes(p.id));
  
  // If no power-ups are available, return empty array
  if (availablePowerUps.length === 0) {
    return [];
  }
  
  // Return random selection from what's available
  const shuffled = [...availablePowerUps].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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
  const [showStartMenu, setShowStartMenu] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [modalView, setModalView] = useState<'menu' | 'collection'>('menu');
  const [selectedItem, setSelectedItem] = useState<{
    section: 'size' | 'effect' | 'gravity' | 'void';
    id: string;
    name: string;
    description: string;
  } | null>(null);
  const [level, setLevel] = useState(1);
  const [currentExp, setCurrentExp] = useState(0);
  const [showPowerUpSelection, setShowPowerUpSelection] = useState(false);
  const [availablePowerUps, setAvailablePowerUps] = useState<PowerUp[]>([]);

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

  const handleNewTier = useCallback((tier: number) => {
    setMaxTierSeen(prev => Math.max(prev, tier));
    setCombo(prev => prev + 1);
    
    // Calculate score and XP
    const scoreGain = calculateScore(tier, combo);
    const xpGain = Math.floor(scoreGain * 0.5); // XP is 50% of score
    
    setScore(prev => prev + scoreGain);
    
    // Recharge flask effects on tier 7+ merges
    if (tier >= 7) {
      setPowerUps(prev => {
        const newPowerUps = { ...prev.powerUps };
        
        // Find all flask slots
        prev.slots.forEach(slotId => {
          if (slotId?.startsWith('FLASK_')) {
            // Set uses to max (1)
            newPowerUps[slotId] = 1;
          }
        });
        
        return {
          ...prev,
          powerUps: newPowerUps
        };
      });
    }

    setCurrentExp(prev => {
      // If all slots are filled, don't accumulate more XP
      if (powerUps.slots.every(slot => slot !== null)) {
        return 0;
      }

      const newExp = prev + xpGain;
      const requiredExp = calculateRequiredXP(level);
      
      // Level up if we have enough XP
      if (newExp >= requiredExp) {
        // Get random power-ups for selection
        const powerUpOptions = getRandomPowerUps(LEVEL_CONFIG.POWER_UPS_PER_SELECTION, Math.ceil(level / 3), powerUps.slots);
        
        // If no power-ups are available, don't level up
        if (powerUpOptions.length === 0) {
          return prev;
        }

        setAvailablePowerUps(powerUpOptions);
        setShowPowerUpSelection(true);
        
        // Only increment level once
        const nextLevel = level + 1;
        setLevel(nextLevel);
        
        // Calculate excess XP based on the current level's requirement
        return newExp - requiredExp;
      }
      return newExp;
    });

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
  }, [combo, level, powerUps.slots]);

  const { 
    startDrag, 
    updateDrag, 
    endDrag, 
    spawnStressTestBalls, 
    engine,
    currentBall,
    debug,
    resetEngine
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

  const handleNewGame = useCallback(() => {
    // Reset the physics engine first
    resetEngine();
    
    // Then reset all state, but keep the selected flask size
    setScore(0);
    setCombo(0);
    setMaxTierSeen(1);
    setNextTier(getRandomTier(1));
    setPowerUps(createInitialPowerUpState(true));
    setIsGameOver(false);
    setFlaskState(prev => ({
      ...createInitialFlaskState(),
      size: prev.size // Preserve the selected size
    }));
    setShowStartMenu(false);
    setIsPaused(false);
  }, [resetEngine]);

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

  // Add refill power-ups function
  const handleRefillPowerUps = useCallback(() => {
    setPowerUps(createInitialPowerUpState(false));
  }, []);

  // First, add this effect to set up non-passive touch events
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const options = { passive: false };

    const touchStartHandler = (e: TouchEvent) => {
      // Don't prevent default for touches on the UI area
      const touch = e.touches[0];
      const touchY = touch.clientY;
      const { top } = container.getBoundingClientRect();
      const relativeY = touchY - top;

      // Only handle touch events below the UI area
      if (relativeY > 60) {
        e.preventDefault();
        const { left } = container.getBoundingClientRect();
        const relativeX = touch.clientX - left;
        startDrag(relativeX);
      }
    };

    const touchMoveHandler = (e: TouchEvent) => {
      const touch = e.touches[0];
      const touchY = touch.clientY;
      const { top } = container.getBoundingClientRect();
      const relativeY = touchY - top;

      if (relativeY > 60) {
        e.preventDefault();
        const { left } = container.getBoundingClientRect();
        const relativeX = touch.clientX - left;
        updateDrag(relativeX);
      }
    };

    const touchEndHandler = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const touchY = touch.clientY;
      const { top } = container.getBoundingClientRect();
      const relativeY = touchY - top;

      if (relativeY > 60) {
        e.preventDefault();
        const { left } = container.getBoundingClientRect();
        const relativeX = touch.clientX - left;
        endDrag(relativeX);
      }
    };

    container.addEventListener('touchstart', touchStartHandler, options);
    container.addEventListener('touchmove', touchMoveHandler, options);
    container.addEventListener('touchend', touchEndHandler, options);

    return () => {
      container.removeEventListener('touchstart', touchStartHandler);
      container.removeEventListener('touchmove', touchMoveHandler);
      container.removeEventListener('touchend', touchEndHandler);
    };
  }, [startDrag, updateDrag, endDrag]);

  // Update containerProps to have a more specific touch-none area
  const containerProps = {
    ref: containerRef,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    className: "relative w-full aspect-[2/3] outline outline-2 outline-zinc-700 rounded-lg overflow-hidden bg-zinc-800 mb-1 select-none"
  };

  // Update the handlePowerUpSelect function
  const handlePowerUpSelect = useCallback((selection: SelectedItem) => {
    setPowerUps(prev => {
      // Find first valid empty slot
      let firstEmptySlot = -1;
      for (let i = 0; i < prev.slots.length; i++) {
        // Skip if this slot is covered by a flask from previous slot
        if (i > 0 && prev.slots[i - 1]?.startsWith('FLASK_')) {
          continue;
        }
        // Skip if this slot would cover a non-empty slot (for flasks)
        if ('type' in selection && selection.type === 'flask' && 
            i < prev.slots.length - 1 && prev.slots[i + 1] !== null) {
          continue;
        }
        // Found valid empty slot
        if (prev.slots[i] === null) {
          firstEmptySlot = i;
          break;
        }
      }

      if (firstEmptySlot === -1) return prev;

      const newSlots = [...prev.slots];
      const newPowerUps = { ...prev.powerUps };

      if ('type' in selection && selection.type === 'flask') {
        const flaskId = `FLASK_${selection.id}`;
        newSlots[firstEmptySlot] = flaskId;
        newPowerUps[flaskId] = selection.maxUses || 1;
      } else {
        newSlots[firstEmptySlot] = selection.id;
        newPowerUps[selection.id] = selection.maxUses;
      }

      return {
        ...prev,
        slots: newSlots,
        powerUps: newPowerUps
      };
    });
    
    setShowPowerUpSelection(false);
  }, []);

  // Add an effect to clear expired flask effects
  useEffect(() => {
    const interval = setInterval(() => {
      setFlaskState(prev => {
        if (prev.activeUntil && Date.now() >= prev.activeUntil) {
          return {
            ...prev,
            effect: 'DEFAULT',
            activeUntil: null
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-900 p-4 select-none">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Game Container with UI Overlay */}
        <div className="relative">
          {/* Game Container */}
          <div {...containerProps}>
            {/* Grid Effect Layer */}
            <FlaskEffects 
              flaskState={flaskState}
              containerRef={containerRef}
            />
            
            {/* Game Canvas Area */}
            <div className="absolute inset-0 z-10">
              {/* Matter.js renders here */}
            </div>

            {/* Touch Prevention Layer */}
            <div className="absolute inset-0 touch-none pointer-events-none z-20" />
          </div>

          {/* Score and Controls Bar - Positioned absolutely over game container */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5 z-50">
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
              <div className="h-9 px-1.5 w-[140px] rounded-lg border-2 border-zinc-700/50 bg-zinc-800/30 backdrop-blur-md flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-zinc-100/90">{score}</span>
                    <span 
                      className={`text-xs font-bold ${combo > 0 ? 'animate-pulse' : ''}`}
                      style={{ color: getComboColor(combo) }}
                    >
                      ×{(1 + (combo * 0.5)).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-400">
                    {powerUps.slots.every(slot => slot !== null) ? 'MAX' : `Level ${level}`}
                  </span>
                </div>
                <div className="h-1 bg-zinc-700 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="h-full bg-white/90 transition-all duration-300 ease-out"
                    style={{ 
                      width: powerUps.slots.every(slot => slot !== null) 
                        ? '100%' 
                        : `${Math.min((currentExp / calculateRequiredXP(level)) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Flask Size and Pause Buttons */}
            <div className="pointer-events-auto flex gap-2">
              {/* Selected Flask Size Icon */}
              <div className="h-9 px-2.5 flex items-center gap-1.5 rounded-lg border-2 border-zinc-700/50 bg-zinc-800/30 backdrop-blur-md text-zinc-100">
                {flaskState.size === 'DEFAULT' && <TestTubeIcon className="w-5 h-5" />}
                {flaskState.size === 'SHRINK' && <FlaskConicalIcon className="w-5 h-5" />}
                {flaskState.size === 'EXTRA_SHRINK' && <FlaskRoundIcon className="w-5 h-5" />}
              </div>

              {/* Pause Button */}
              <button
                onClick={() => setIsPaused(true)}
                className="h-9 px-2.5 flex items-center gap-1.5 rounded-lg border-2 border-zinc-700/50 bg-zinc-800/30 backdrop-blur-md hover:bg-zinc-700/30 transition-colors text-zinc-100 text-sm font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Rest of the UI (Power-ups, Debug UI, etc.) */}
        <div className="w-full flex flex-col gap-4">
          {/* Combined Power-ups Row */}
          <div className="grid grid-cols-6 gap-2 w-full px-0">
            {powerUps.slots.map((slotId, index) => {
              let item: SelectedItem | undefined;
              let isDoubleWidth = false; // Add this flag
              
              if (slotId?.startsWith('FLASK_')) {
                const flaskId = slotId.replace('FLASK_', '') as FlaskEffectId;
                const flaskEffect = FLASK_EFFECTS[flaskId];
                item = {
                  id: flaskId,
                  type: 'flask',
                  name: flaskEffect.name,
                  description: flaskEffect.description,
                  icon: flaskEffect.icon,
                  maxUses: 1,
                  activeUntil: flaskState.effect === flaskId ? flaskState.activeUntil : null
                };
                isDoubleWidth = true; // Set double width for flasks
              } else if (slotId) {
                item = POWER_UPS[slotId];
              }

              // Skip rendering empty slots that would be covered by double-width items
              if (index > 0 && powerUps.slots[index - 1]?.startsWith('FLASK_')) {
                return null;
              }

              return (
                <PowerUpSlot
                  key={index}
                  powerUp={item}
                  isActive={powerUps.activePowerUpId === slotId}
                  remainingUses={slotId ? powerUps.powerUps[slotId] : 0}
                  isDoubleWidth={isDoubleWidth}
                  onClick={() => {
                    if (slotId) {
                      if (slotId.startsWith('FLASK_')) {
                        const flaskId = slotId.replace('FLASK_', '') as FlaskEffectId;
                        if (powerUps.powerUps[slotId] > 0) {
                          // Set flask effect with 60 second timer
                          setFlaskState(prev => ({
                            ...prev,
                            effect: flaskId,
                            activeUntil: Date.now() + 60000 // 60 seconds from now
                          }));
                          
                          // Reduce remaining uses
                          setPowerUps(prev => ({
                            ...prev,
                            powerUps: {
                              ...prev.powerUps,
                              [slotId]: prev.powerUps[slotId] - 1
                            }
                          }));
                        }
                      }
                      setPowerUps(prev => ({
                        ...prev,
                        activePowerUpId: prev.activePowerUpId === slotId ? null : 
                          (prev.powerUps[slotId] > 0 ? slotId : null)
                      }));
                    }
                  }}
                />
              );
            })}
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

          {/* Add this new button */}
          <button 
            className="w-full p-2 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 hover:text-purple-400 transition-colors select-none"
            onClick={() => {
              const powerUpOptions = getRandomPowerUps(LEVEL_CONFIG.POWER_UPS_PER_SELECTION, Math.ceil(level / 3), powerUps.slots);
              setAvailablePowerUps(powerUpOptions);
              setShowPowerUpSelection(true);
            }}
          >
            Trigger Level Up (Debug)
          </button>
        </div>

        {/* Color legend */}
        <div className="w-full">
          <ColorLegend />
        </div>
      </div>

      {/* Menu Modal - Used for both Start and Pause */}
      {(showStartMenu || isPaused) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-zinc-800/90 p-6 rounded-lg shadow-xl border border-zinc-700 max-w-sm w-full mx-4 transform scale-100 animate-in fade-in duration-200">
            {modalView === 'menu' ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                  {showStartMenu ? 'Astral Merge' : 'Game Paused'}
                </h2>
                
                <div className="space-y-3">
                  {showStartMenu ? (
                    <>
                      <button
                        onClick={handleNewGame}
                        className="w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors font-semibold border-2 border-zinc-700"
                      >
                        New Game
                      </button>
                      
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {Object.entries(FLASK_SIZES).map(([id, flask]) => {
                          const IconComponent = id === 'DEFAULT' ? TestTubeIcon :
                                            id === 'SHRINK' ? FlaskConicalIcon :
                                            FlaskRoundIcon;
                          return (
                            <button
                              key={id}
                              onClick={() => setFlaskState(prev => ({ ...prev, size: id as FlaskSizeId }))}
                              className={cn(
                                "p-3 rounded-lg border transition-colors flex flex-col items-center gap-1.5",
                                flaskState.size === id
                                  ? "bg-zinc-700/80 border-zinc-500 text-white"
                                  : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300"
                              )}
                            >
                              <IconComponent className="w-5 h-5" />
                              <span className="text-xs font-medium">
                                {id === 'DEFAULT' ? 'Default Size' :
                                 id === 'SHRINK' ? 'Large Size' :
                                 'Extra Large'}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setModalView('collection')}
                        className="w-full px-4 py-3 border border-zinc-600 hover:bg-zinc-700/50 text-white rounded-lg transition-colors font-semibold mt-3"
                      >
                        Collection
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsPaused(false)}
                        className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-semibold"
                      >
                        Resume Game
                      </button>
                      
                      <button
                        onClick={handleNewGame}
                        className="w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors font-semibold border-2 border-zinc-700"
                      >
                        New Game
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <button
                    onClick={() => setModalView('menu')}
                    className="p-1.5 hover:bg-zinc-700/50 rounded-lg transition-colors text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-bold text-white">Collection</h2>
                </div>

                <div className="space-y-4">
                  {/* Flask Sizes */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Flask Sizes</h3>
                    <div className="grid grid-cols-6 gap-1.5">
                      {[...Array(6)].map((_, index) => {
                        const entry = Object.entries(FLASK_SIZES)
                          .filter(([id]) => ['DEFAULT', 'SHRINK', 'EXTRA_SHRINK'].includes(id))[index];
                        
                        return (
                          <div key={index} className="relative">
                            <div 
                              className={cn(
                                "w-10 h-10 bg-zinc-700/50 rounded-lg flex items-center justify-center hover:bg-zinc-600/50 transition-colors border border-zinc-600/50 cursor-pointer",
                                selectedItem?.section === 'size' && selectedItem?.id === entry?.[0] && "bg-zinc-600/50 border-zinc-500/50"
                              )}
                              onClick={() => entry && setSelectedItem(prev => 
                                prev?.section === 'size' && prev.id === entry[0] ? null : {
                                  section: 'size',
                                  id: entry[0],
                                  name: entry[1].name,
                                  description: entry[1].description
                                }
                              )}
                            >
                              {entry ? (
                                <>
                                  {entry[0] === 'DEFAULT' && <TestTubeIcon className="w-4 h-4 text-white" />}
                                  {entry[0] === 'SHRINK' && <FlaskConicalIcon className="w-4 h-4 text-white" />}
                                  {entry[0] === 'EXTRA_SHRINK' && <FlaskRoundIcon className="w-4 h-4 text-white" />}
                                </>
                              ) : (
                                <div className="font-medium text-zinc-500 text-lg">?</div>
                              )}
                            </div>
                            {selectedItem?.section === 'size' && selectedItem?.id === entry?.[0] && (
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 p-2 bg-zinc-800 rounded-lg border border-zinc-600/50 shadow-xl z-10">
                                <div className="text-white text-xs font-medium mb-0.5 text-center">{selectedItem.name}</div>
                                <div className="text-zinc-300 text-[10px] text-center leading-tight">{selectedItem.description}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Flask Effects */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Flask Effects</h3>
                    <div className="grid grid-cols-6 gap-1.5">
                      {[...Array(6)].map((_, index) => {
                        const entry = Object.entries(FLASK_EFFECTS)[index];
                        
                        return (
                          <div key={index} className="relative">
                            <div 
                              className={cn(
                                "w-10 h-10 bg-zinc-700/50 rounded-lg flex items-center justify-center hover:bg-zinc-600/50 transition-colors border border-zinc-600/50 cursor-pointer",
                                selectedItem?.section === 'effect' && selectedItem?.id === entry?.[0] && "bg-zinc-600/50 border-zinc-500/50"
                              )}
                              onClick={() => entry && setSelectedItem(prev => 
                                prev?.section === 'effect' && prev.id === entry[0] ? null : {
                                  section: 'effect',
                                  id: entry[0],
                                  name: entry[1].name,
                                  description: entry[1].description
                                }
                              )}
                            >
                              {entry ? (
                                <>
                                  {entry[0] === 'DEFAULT' && <FlaskIcon className="w-4 h-4 text-white" />}
                                  {entry[0] === 'LOW_GRAVITY' && <FeatherIcon className="w-4 h-4 text-white" />}
                                  {entry[0] === 'NO_FRICTION' && <SparklesIcon className="w-4 h-4 text-white" />}
                                  {entry[0] === 'STORM' && <StormIcon className="w-4 h-4 text-white" />}
                                </>
                              ) : (
                                <div className="font-medium text-zinc-500 text-lg">?</div>
                              )}
                            </div>
                            {selectedItem?.section === 'effect' && selectedItem?.id === entry?.[0] && (
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 p-2 bg-zinc-800 rounded-lg border border-zinc-600/50 shadow-xl z-10">
                                <div className="text-white text-xs font-medium mb-0.5 text-center">{selectedItem.name}</div>
                                <div className="text-zinc-300 text-[10px] text-center leading-tight">{selectedItem.description}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Power-ups */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Power-ups</h3>
                    
                    {/* Gravity Power-ups */}
                    <div className="mb-3">
                      <h4 className="text-md font-medium text-white mb-1.5">Gravity</h4>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[...Array(6)].map((_, index) => {
                          const entry = Object.entries(POWER_UPS)
                            .filter(([_, powerUp]) => powerUp.group === 'GRAVITY')[index];
                          
                          return (
                            <div key={index} className="relative">
                              <div 
                                className={cn(
                                  "w-10 h-10 bg-zinc-700/50 rounded-lg flex items-center justify-center hover:bg-zinc-600/50 transition-colors border border-zinc-600/50 cursor-pointer",
                                  selectedItem?.section === 'gravity' && selectedItem?.id === entry?.[0] && "bg-zinc-600/50 border-zinc-500/50"
                                )}
                                onClick={() => entry && setSelectedItem(prev => 
                                  prev?.section === 'gravity' && prev.id === entry[0] ? null : {
                                    section: 'gravity',
                                    id: entry[0],
                                    name: entry[1].name,
                                    description: entry[1].description
                                  }
                                )}
                              >
                                {entry ? (
                                  <>
                                    {entry[0] === 'HEAVY_BALL' && <WeightIcon className="w-4 h-4 text-white" />}
                                    {entry[0] === 'SUPER_HEAVY_BALL' && <SuperWeightIcon className="w-4 h-4 text-white" />}
                                    {entry[0] === 'ULTRA_HEAVY_BALL' && <UltraWeightIcon className="w-4 h-4 text-white" />}
                                  </>
                                ) : (
                                  <div className="font-medium text-zinc-500 text-lg">?</div>
                                )}
                              </div>
                              {selectedItem?.section === 'gravity' && selectedItem?.id === entry?.[0] && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 p-2 bg-zinc-800 rounded-lg border border-zinc-600/50 shadow-xl z-10">
                                  <div className="text-white text-xs font-medium mb-0.5 text-center">{selectedItem.name}</div>
                                  <div className="text-zinc-300 text-[10px] text-center leading-tight">{selectedItem.description}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Void Power-ups */}
                    <div>
                      <h4 className="text-md font-medium text-white mb-1.5">Void</h4>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[...Array(6)].map((_, index) => {
                          const entry = Object.entries(POWER_UPS)
                            .filter(([_, powerUp]) => powerUp.group === 'VOID')[index];
                          
                          return (
                            <div key={index} className="relative">
                              <div 
                                className={cn(
                                  "w-10 h-10 bg-zinc-700/50 rounded-lg flex items-center justify-center hover:bg-zinc-600/50 transition-colors border border-zinc-600/50 cursor-pointer",
                                  selectedItem?.section === 'void' && selectedItem?.id === entry?.[0] && "bg-zinc-600/50 border-zinc-500/50"
                                )}
                                onClick={() => entry && setSelectedItem(prev => 
                                  prev?.section === 'void' && prev.id === entry[0] ? null : {
                                    section: 'void',
                                    id: entry[0],
                                    name: entry[1].name,
                                    description: entry[1].description
                                  }
                                )}
                              >
                                {entry ? (
                                  <>
                                    {entry[0] === 'VOID_BALL' && <NegativeBallIcon className="w-4 h-4 text-white" />}
                                    {entry[0] === 'SUPER_VOID_BALL' && <SuperNegativeBallIcon className="w-4 h-4 text-white" />}
                                    {entry[0] === 'ULTRA_VOID_BALL' && <UltraNegativeBallIcon className="w-4 h-4 text-white" />}
                                  </>
                                ) : (
                                  <div className="font-medium text-zinc-500 text-lg">?</div>
                                )}
                              </div>
                              {selectedItem?.section === 'void' && selectedItem?.id === entry?.[0] && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-32 p-2 bg-zinc-800 rounded-lg border border-zinc-600/50 shadow-xl z-10">
                                  <div className="text-white text-xs font-medium mb-0.5 text-center">{selectedItem.name}</div>
                                  <div className="text-zinc-300 text-[10px] text-center leading-tight">{selectedItem.description}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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

      {/* Add PowerUpSelectionModal */}
      <PowerUpSelectionModal
        isOpen={showPowerUpSelection}
        onClose={() => setShowPowerUpSelection(false)}
        onSelect={handlePowerUpSelect}
        availablePowerUps={availablePowerUps}
        powerUps={powerUps}
      />
    </div>
  );
}
