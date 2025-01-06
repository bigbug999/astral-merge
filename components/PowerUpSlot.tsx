import { cn } from '@/lib/utils';
import { PowerUp } from '@/types/powerups';
import { FlaskItem } from '@/types/flasks';
import { WeightIcon } from './icons/WeightIcon';
import { SuperWeightIcon } from './icons/SuperWeightIcon';
import { UltraWeightIcon } from './icons/UltraWeightIcon';
import { NegativeBallIcon } from './icons/NegativeBallIcon';
import { SuperNegativeBallIcon } from './icons/SuperNegativeBallIcon';
import { UltraNegativeBallIcon } from './icons/UltraNegativeBallIcon';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { FlaskIcon } from './icons/FlaskIcon';
import { FeatherIcon } from './icons/FeatherIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { BounceIcon } from './icons/BounceIcon';
import { StormIcon } from './icons/StormIcon';
import { TierUpIcon } from './icons/TierUpIcon';
import { SuperTierUpIcon } from './icons/SuperTierUpIcon';
import { UltraTierUpIcon } from './icons/UltraTierUpIcon';
import { useEffect, useState } from 'react';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  WeightIcon,
  SuperWeightIcon,
  UltraWeightIcon,
  NegativeBallIcon,
  SuperNegativeBallIcon,
  UltraNegativeBallIcon,
  TestTubeIcon,
  FlaskIcon,
  FeatherIcon,
  SparklesIcon,
  BounceIcon,
  StormIcon,
  TierUpIcon,
  SuperTierUpIcon,
  UltraTierUpIcon,
};

interface PowerUpSlotProps {
  powerUp?: PowerUp | FlaskItem;
  isActive: boolean;
  remainingUses: number;
  onClick: () => void;
  isDoubleWidth?: boolean;
}

export function PowerUpSlot({ powerUp, isActive, remainingUses, onClick, isDoubleWidth }: PowerUpSlotProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [progress, setProgress] = useState(100);
  
  const isFlaskItem = (item: PowerUp | FlaskItem): item is FlaskItem => {
    return 'type' in item && item.type === 'flask';
  };
  
  const getColors = () => {
    if (!powerUp) return {
      text: 'text-zinc-600',
      bg: 'bg-zinc-800/50'
    };

    if (isDisabled) return {
      text: 'text-zinc-600',
      bg: 'bg-zinc-800'
    };

    if (isFlaskItem(powerUp)) {
      return {
        text: isActive ? 'text-white' : 'text-blue-400 hover:text-blue-300',
        bg: isActive ? 'bg-blue-900/50' : 'bg-zinc-800'
      };
    }

    // Power-up colors based on level
    return {
      text: isActive ? 'text-white' : 
        powerUp.level === 1 ? 'text-green-400 hover:text-green-300' :
        powerUp.level === 2 ? 'text-purple-400 hover:text-purple-300' :
        'text-orange-400 hover:text-orange-300',
      bg: isActive ? 
        powerUp.level === 1 ? 'bg-green-900/50' :
        powerUp.level === 2 ? 'bg-purple-900/50' :
        'bg-orange-900/50' 
        : 'bg-zinc-800'
    };
  };

  const isDisabled = remainingUses <= 0;
  const IconComponent = powerUp ? ICON_COMPONENTS[powerUp.icon] : null;
  const { text, bg } = getColors();

  useEffect(() => {
    if (powerUp && isFlaskItem(powerUp) && powerUp.activeUntil !== null) {
      const updateTimer = () => {
        const now = Date.now();
        const total = 60000;
        const elapsed = powerUp.activeUntil! - now;
        const remaining = Math.ceil(elapsed / 1000);
        
        if (remaining > 0) {
          setTimeLeft(remaining);
          setProgress((elapsed / total) * 100);
        } else {
          setTimeLeft(null);
          setProgress(0);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 50);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
      setProgress(0);
    }
  }, [powerUp]);

  // Helper to render usage dots
  const renderUsageDots = () => {
    const maxDots = powerUp?.maxUses || 0;
    const currentDots = remainingUses;
    
    return (
      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
        {[...Array(maxDots)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1 h-1 rounded-full",
              i < currentDots ? "bg-white" : "bg-zinc-600"
            )}
          />
        ))}
      </div>
    );
  };

  // Helper to render usage indicator for flasks
  const renderUsageIndicator = () => {
    if (!powerUp) return null;
    
    if (isFlaskItem(powerUp)) {
      return (
        <div className="absolute bottom-1 left-0 right-0 flex justify-center">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              remainingUses > 0 ? "bg-blue-400" : "bg-zinc-600"
            )}
          />
        </div>
      );
    }
    
    // Existing usage dots for regular power-ups
    return renderUsageDots();
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={powerUp ? `${powerUp.name}: ${powerUp.description}` : 'Empty Slot'}
      className={cn(
        "h-[56px] rounded-lg flex items-center justify-center transition-colors relative overflow-hidden",
        isDoubleWidth ? "col-span-2 w-full" : "w-[56px]",
        !powerUp 
          ? "bg-zinc-800/50 border-2 border-dashed border-zinc-700/50" 
          : cn(bg, "border-2", 
              isFlaskItem(powerUp)
                ? isActive ? "border-blue-500/50" : "border-blue-500/20"
                : isActive 
                  ? powerUp.level === 1 ? "border-green-500/50"
                  : powerUp.level === 2 ? "border-purple-500/50"
                  : "border-orange-500/50"
                  : "border-zinc-700/50"
            ),
        text
      )}
    >
      {/* Linear Progress Bar */}
      {timeLeft && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/20 rounded-full">
          <div 
            className="h-full bg-blue-500 transition-all duration-100 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Icon */}
      {IconComponent ? (
        <div className="relative flex flex-col items-center">
          <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
          {timeLeft && (
            <span className="text-[10px] font-medium mt-0.5 text-blue-300">
              {timeLeft}s
            </span>
          )}
        </div>
      ) : (
        <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-zinc-600 relative z-10">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      )}

      {/* Usage Dots */}
      {renderUsageIndicator()}
    </button>
  );
} 