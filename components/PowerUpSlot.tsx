import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { PowerUp } from '@/types/powerups';
import { WeightIcon } from './icons/WeightIcon';
import { SuperWeightIcon } from './icons/SuperWeightIcon';
import { UltraWeightIcon } from './icons/UltraWeightIcon';
import { NegativeBallIcon } from './icons/NegativeBallIcon';
import { SuperNegativeBallIcon } from './icons/SuperNegativeBallIcon';
import { UltraNegativeBallIcon } from './icons/UltraNegativeBallIcon';
import { FeatherIcon } from './icons/FeatherIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { StormIcon } from './icons/StormIcon';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  WeightIcon,
  SuperWeightIcon,
  UltraWeightIcon,
  NegativeBallIcon,
  SuperNegativeBallIcon,
  UltraNegativeBallIcon,
  FeatherIcon,
  SparklesIcon,
  StormIcon,
};

interface PowerUpSlotProps {
  powerUp?: PowerUp;
  isActive: boolean;
  remainingUses: number;
  cooldownEndTime?: number[];
  effectEndTime?: number;
  onClick?: () => void;
}

export function PowerUpSlot({ 
  powerUp, 
  isActive, 
  remainingUses, 
  cooldownEndTime,
  effectEndTime,
  onClick 
}: PowerUpSlotProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isEffect, setIsEffect] = useState(false);

  useEffect(() => {
    if (!powerUp?.effects?.duration) return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      if (effectEndTime && effectEndTime > now) {
        setTimeLeft(Math.ceil((effectEndTime - now) / 1000));
        setIsEffect(true);
      } else if (cooldownEndTime?.length && cooldownEndTime[0] > now) {
        // Use the earliest cooldown timestamp
        setTimeLeft(Math.ceil((cooldownEndTime[0] - now) / 1000));
        setIsEffect(false);
      } else {
        setTimeLeft(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [powerUp, cooldownEndTime, effectEndTime]);

  // Get color based on power-up level if it exists
  const getLevelColor = (level: number | undefined, isActive: boolean, isDisabled: boolean) => {
    if (isDisabled) return 'text-zinc-600';
    if (isActive) return 'text-white';
    if (!level) return 'text-zinc-600';
    
    switch (level) {
      case 1: return 'text-green-400 hover:text-green-300';
      case 2: return 'text-purple-400 hover:text-purple-300';
      case 3: return 'text-orange-400 hover:text-orange-300';
      default: return 'text-green-400 hover:text-green-300';
    }
  };

  // Get background color based on power-up level
  const getLevelBgColor = (level: number | undefined, isActive: boolean, isDisabled: boolean) => {
    if (isDisabled) return 'bg-zinc-800';
    if (isActive) {
      switch (level) {
        case 1: return 'bg-green-900';
        case 2: return 'bg-purple-900';
        case 3: return 'bg-orange-900';
        default: return 'bg-green-900';
      }
    }
    return 'bg-zinc-800';
  };

  const now = Date.now();
  const isDisabled = powerUp ? (remainingUses <= 0 || (cooldownEndTime?.length && cooldownEndTime[0] > now)) : false;
  const textColor = getLevelColor(powerUp?.level, isActive, isDisabled);
  const bgColor = getLevelBgColor(powerUp?.level, isActive, isDisabled);
  const IconComponent = powerUp ? ICON_COMPONENTS[powerUp.icon] : null;

  // Format cooldown for description
  const cooldownText = powerUp?.effects?.cooldown 
    ? ` (${Math.floor(powerUp.effects.cooldown / 1000)}s cooldown per charge)`
    : '';

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={powerUp ? `${powerUp.name}: ${powerUp.description}${cooldownText}` : 'Empty Slot'}
      className={cn(
        "w-full aspect-square rounded-lg flex flex-col items-center justify-center transition-colors relative overflow-hidden",
        !powerUp ? "bg-zinc-800/50 border-2 border-dashed border-zinc-700/50" : bgColor,
        textColor
      )}
    >
      {timeLeft > 0 && (
        <div 
          className={cn(
            "absolute inset-0 bg-current opacity-10",
            isEffect ? "animate-pulse" : ""
          )}
          style={{
            clipPath: `inset(${100 - (timeLeft / (isEffect ? 30 : 60)) * 100}% 0 0 0)`
          }}
        />
      )}
      
      {IconComponent ? (
        <>
          <div className="flex-1 flex items-center justify-center">
            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          
          {/* Charges dots */}
          <div className="absolute bottom-1 flex gap-1 justify-center">
            {[...Array(powerUp.maxUses)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  i < remainingUses ? "bg-white" : "bg-zinc-700"
                )}
              />
            ))}
          </div>

          {timeLeft > 0 && (
            <span className="absolute top-1 text-[10px] font-medium">
              {timeLeft}s
            </span>
          )}
        </>
      ) : (
        <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-zinc-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      )}
    </button>
  );
} 