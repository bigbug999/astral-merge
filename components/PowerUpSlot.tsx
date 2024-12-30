import { cn } from '@/lib/utils';
import { PowerUp } from '@/types/powerups';
import { WeightIcon } from './icons/WeightIcon';
import { SuperWeightIcon } from './icons/SuperWeightIcon';
import { UltraWeightIcon } from './icons/UltraWeightIcon';
import { NegativeBallIcon } from './icons/NegativeBallIcon';
import { SuperNegativeBallIcon } from './icons/SuperNegativeBallIcon';
import { UltraNegativeBallIcon } from './icons/UltraNegativeBallIcon';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  WeightIcon,
  SuperWeightIcon,
  UltraWeightIcon,
  NegativeBallIcon,
  SuperNegativeBallIcon,
  UltraNegativeBallIcon,
};

interface PowerUpSlotProps {
  powerUp?: PowerUp;
  isActive: boolean;
  remainingUses: number;
  onClick?: () => void;
}

export function PowerUpSlot({ powerUp, isActive, remainingUses, onClick }: PowerUpSlotProps) {
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

  const isDisabled = powerUp ? remainingUses <= 0 : false;
  const textColor = getLevelColor(powerUp?.level, isActive, isDisabled);
  const bgColor = getLevelBgColor(powerUp?.level, isActive, isDisabled);
  const IconComponent = powerUp ? ICON_COMPONENTS[powerUp.icon] : null;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={powerUp ? `${powerUp.name}: ${powerUp.description}` : 'Empty Slot'}
      className={cn(
        "w-full aspect-square rounded-lg flex items-center justify-center transition-colors relative",
        !powerUp ? "bg-zinc-800/50 border-2 border-dashed border-zinc-700/50" : bgColor,
        textColor
      )}
    >
      {IconComponent ? (
        <>
          <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className={cn(
            "absolute -top-1 -right-1 text-[9px] min-w-[14px] h-3.5 flex items-center justify-center px-0.5 rounded-full",
            isActive ? "bg-white text-black" : "bg-zinc-700"
          )}>
            {remainingUses}
          </span>
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