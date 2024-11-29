import { cn } from '@/lib/utils';
import { PowerUp } from '@/types/powerups';
import { AnvilIcon } from './icons/AnvilIcon';
import { SuperAnvilIcon } from './icons/SuperAnvilIcon';
import { UltraAnvilIcon } from './icons/UltraAnvilIcon';
import { NegativeBallIcon } from './icons/NegativeBallIcon';
import { SuperNegativeBallIcon } from './icons/SuperNegativeBallIcon';
import { UltraNegativeBallIcon } from './icons/UltraNegativeBallIcon';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  AnvilIcon,
  SuperAnvilIcon,
  UltraAnvilIcon,
  NegativeBallIcon,
  SuperNegativeBallIcon,
  UltraNegativeBallIcon,
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
      case 1: return 'text-zinc-400 hover:text-zinc-300';
      case 2: return 'text-amber-400 hover:text-amber-300';
      case 3: return 'text-fuchsia-400 hover:text-fuchsia-300';
      default: return 'text-zinc-400 hover:text-zinc-300';
    }
  };

  // Get background color based on power-up level
  const getLevelBgColor = (level: number, isActive: boolean, isDisabled: boolean) => {
    if (isDisabled) return 'bg-zinc-800';
    if (isActive) {
      switch (level) {
        case 1: return 'bg-zinc-700';
        case 2: return 'bg-amber-900';
        case 3: return 'bg-fuchsia-900';
        default: return 'bg-zinc-700';
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
        "w-12 h-12 rounded-lg flex items-center justify-center transition-colors relative",
        bgColor,
        textColor
      )}
    >
      {IconComponent && <IconComponent className="w-6 h-6" />}
      <span className={cn(
        "absolute -top-1 -right-1 text-xs px-1 rounded-full",
        isActive ? "bg-white text-black" : "bg-zinc-700"
      )}>
        {remainingUses}
      </span>
    </button>
  );
} 