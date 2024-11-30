import { cn } from '@/lib/utils';
import { Flask } from '@/types/flasks';
import { FeatherIcon } from './icons/FeatherIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { BounceIcon } from './icons/BounceIcon';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  FeatherIcon,
  SparklesIcon,
  BounceIcon,
};

interface FlaskButtonProps {
  flask: Flask;
  isActive: boolean;
  onClick: () => void;
  size?: 'xs' | 'sm' | 'md';
}

export function FlaskButton({ flask, isActive, onClick, size = 'md' }: FlaskButtonProps) {
  const IconComponent = ICON_COMPONENTS[flask.icon];

  const sizeClasses = {
    xs: "w-9 h-9",
    sm: "w-10 h-10",
    md: "w-12 h-12"
  };

  const iconSizeClasses = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6"
  };

  return (
    <button
      onClick={onClick}
      title={`${flask.name}: ${flask.description}`}
      className={cn(
        "rounded-lg flex items-center justify-center transition-colors relative",
        sizeClasses[size],
        isActive ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300"
      )}
      style={{
        boxShadow: isActive ? `0 0 12px ${flask.visual.glowColor}` : undefined,
        border: isActive ? `1px solid ${flask.visual.color}` : '1px solid transparent'
      }}
    >
      {IconComponent && <IconComponent className={iconSizeClasses[size]} />}
    </button>
  );
} 