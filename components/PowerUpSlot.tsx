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
};

interface PowerUpSlotProps {
  powerUp?: PowerUp | FlaskItem;
  isActive: boolean;
  remainingUses: number;
  onClick: () => void;
}

export function PowerUpSlot({ powerUp, isActive, remainingUses, onClick }: PowerUpSlotProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [progress, setProgress] = useState(100);
  
  const getColors = () => {
    if (!powerUp) return {
      text: 'text-zinc-600',
      bg: 'bg-zinc-800/50'
    };

    if (isDisabled) return {
      text: 'text-zinc-600',
      bg: 'bg-zinc-800'
    };

    if ('type' in powerUp && powerUp.type === 'flask') {
      return {
        text: isActive ? 'text-white' : 'text-blue-400 hover:text-blue-300',
        bg: isActive ? 'bg-blue-900/50' : 'bg-zinc-800'
      };
    }

    // Power-up colors based on level
    const level = (powerUp as PowerUp).level;
    return {
      text: isActive ? 'text-white' : 
        level === 1 ? 'text-green-400 hover:text-green-300' :
        level === 2 ? 'text-purple-400 hover:text-purple-300' :
        'text-orange-400 hover:text-orange-300',
      bg: isActive ? 
        level === 1 ? 'bg-green-900/50' :
        level === 2 ? 'bg-purple-900/50' :
        'bg-orange-900/50' 
        : 'bg-zinc-800'
    };
  };

  const isDisabled = remainingUses <= 0;
  const IconComponent = powerUp ? ICON_COMPONENTS[powerUp.icon] : null;
  const { text, bg } = getColors();

  useEffect(() => {
    if (powerUp?.type === 'flask' && powerUp.activeUntil) {
      const updateTimer = () => {
        const now = Date.now();
        const total = 60000;
        const elapsed = powerUp.activeUntil - now;
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

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={powerUp ? `${powerUp.name}: ${powerUp.description}` : 'Empty Slot'}
      className={cn(
        "w-full aspect-square rounded-lg flex items-center justify-center transition-colors relative",
        !powerUp ? "bg-zinc-800/50 border-2 border-dashed border-zinc-700/50" : bg,
        text
      )}
    >
      {/* Circular Progress Indicator */}
      {timeLeft && (
        <svg 
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            className="stroke-blue-500/20 fill-none"
            cx="50"
            cy="50"
            r="45"
            strokeWidth="10"
          />
          <circle
            className="stroke-blue-500 fill-none transition-all duration-100"
            cx="50"
            cy="50"
            r="45"
            strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
          />
        </svg>
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
      {powerUp && !timeLeft && renderUsageDots()}
    </button>
  );
} 