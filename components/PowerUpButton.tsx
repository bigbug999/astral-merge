import { cn } from '@/lib/utils';
import { PowerUp } from '@/types/powerups';
import { WeightIcon } from './icons/WeightIcon';
import { SuperWeightIcon } from './icons/SuperWeightIcon';
import { UltraWeightIcon } from './icons/UltraWeightIcon';
import { NegativeBallIcon } from './icons/NegativeBallIcon';
import { SuperNegativeBallIcon } from './icons/SuperNegativeBallIcon';
import { UltraNegativeBallIcon } from './icons/UltraNegativeBallIcon';
import { TierUpIcon } from './icons/TierUpIcon';
import { SuperTierUpIcon } from './icons/SuperTierUpIcon';
import { UltraTierUpIcon } from './icons/UltraTierUpIcon';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  WeightIcon,
  SuperWeightIcon,
  UltraWeightIcon,
  NegativeBallIcon,
  SuperNegativeBallIcon,
  UltraNegativeBallIcon,
  TierUpIcon,
  SuperTierUpIcon,
  UltraTierUpIcon,
};

interface PowerUpButtonProps {
  powerUp: PowerUp;
  isActive: boolean;
  remainingUses: number;
  onClick: () => void;
}

export function PowerUpButton({ powerUp, isActive, remainingUses, onClick }: PowerUpButtonProps) {
  const IconComponent = ICON_COMPONENTS[powerUp.icon];

  // Get color based on power-up level
  const getLevelColor = (level: number, isActive: boolean, isDisabled: boolean) => {
    if (isDisabled) return 'text-zinc-600';
    if (isActive) return 'text-white';
    
    switch (level) {
      case 1: return 'text-green-400 hover:text-green-300';
      case 2: return 'text-purple-400 hover:text-purple-300';
      case 3: return 'text-orange-400 hover:text-orange-300';
      default: return 'text-green-400 hover:text-green-300';
    }
  };

  // Get background color based on power-up level
  const getLevelBgColor = (level: number, isActive: boolean, isDisabled: boolean) => {
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

  const isDisabled = remainingUses <= 0;
  const textColor = getLevelColor(powerUp.level, isActive, isDisabled);
  const bgColor = getLevelBgColor(powerUp.level, isActive, isDisabled);

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={`${powerUp.name} (${powerUp.group} Level ${powerUp.level}): ${powerUp.description}`}
      className={cn(
        "w-full aspect-square rounded-lg flex items-center justify-center transition-colors relative",
        bgColor,
        textColor
      )}
    >
      {IconComponent && <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />}
      <span className={cn(
        "absolute -top-1 -right-1 text-[9px] min-w-[14px] h-3.5 flex items-center justify-center px-0.5 rounded-full",
        isActive ? "bg-white text-black" : "bg-zinc-700"
      )}>
        {remainingUses}
      </span>
    </button>
  );
} 