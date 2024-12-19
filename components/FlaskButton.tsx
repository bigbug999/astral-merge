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

// Add color mapping for flask types
const FLASK_COLORS = {
  DEFAULT: {
    color: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.5)'
  },
  SHRINK: {
    color: '#4ade80',
    glowColor: 'rgba(74, 222, 128, 0.5)'
  },
  EXTRA_SHRINK: {
    color: '#4ade80',
    glowColor: 'rgba(74, 222, 128, 0.5)'
  },
  LOW_GRAVITY: {
    color: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.5)'
  },
  NO_FRICTION: {
    color: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.5)'
  }
} as const;

interface FlaskButtonProps {
  flask: Flask;
  isActive: boolean;
  onClick: () => void;
  size?: 'xs' | 'sm' | 'md';
}

export function FlaskButton({ flask, isActive, onClick, size = 'md' }: FlaskButtonProps) {
  const IconComponent = ICON_COMPONENTS[flask.icon];
  const colors = FLASK_COLORS[flask.id];

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
        boxShadow: isActive ? `0 0 12px ${colors.glowColor}` : undefined,
        border: isActive ? `1px solid ${colors.color}` : '1px solid transparent'
      }}
    >
      {IconComponent && <IconComponent className={iconSizeClasses[size]} />}
    </button>
  );
} 