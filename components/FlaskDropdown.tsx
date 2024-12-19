import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FlaskConicalIcon } from './icons/FlaskConicalIcon';
import { FlaskIcon } from './icons/FlaskIcon';
import { FeatherIcon } from './icons/FeatherIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ShrinkIcon } from './icons/ShrinkIcon';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  FlaskConicalIcon,
  FlaskIcon,
  FeatherIcon,
  SparklesIcon,
  ShrinkIcon,
};

interface FlaskOption {
  id: FlaskSizeId | FlaskEffectId;
  name: string;
  description: string;
  icon: 'FlaskConicalIcon' | 'FlaskIcon' | 'FeatherIcon' | 'SparklesIcon' | 'BounceIcon' | 'ShrinkIcon';
}

interface FlaskDropdownProps {
  label: string;
  value: FlaskSizeId | FlaskEffectId;
  options: Record<string, FlaskOption>;
  onChange: (value: FlaskSizeId | FlaskEffectId) => void;
}

export function FlaskDropdown({ label, value, options, onChange }: FlaskDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = options[value] || Object.values(options)[0];
  const IconComponent = ICON_COMPONENTS[currentOption.icon];

  // Update click handler to be more robust
  const handleButtonClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Add touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleOptionClick = (e: React.MouseEvent | React.TouchEvent, optionId: FlaskSizeId | FlaskEffectId) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(optionId);
    setIsOpen(false);
  };

  return (
    <div 
      ref={dropdownRef} 
      className="relative h-9"
      onTouchStart={handleTouchStart}
      onClick={handleButtonClick}
    >
      <button
        type="button"
        className={cn(
          "h-full px-2.5 rounded-lg border-2 flex items-center gap-2",
          "bg-zinc-800/30 backdrop-blur-md",
          "hover:bg-zinc-800/50 transition-all duration-200",
          isOpen 
            ? "border-zinc-600 shadow-lg" 
            : "border-zinc-700/50"
        )}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <IconComponent className="w-5 h-5 text-zinc-400" />
        <span className="text-xs text-zinc-400">{label}</span>
        <svg 
          className={cn(
            "w-4 h-4 text-zinc-400 transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1 w-48 rounded-lg border-2 border-zinc-700 bg-zinc-800/95 backdrop-blur-md shadow-lg z-50"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {Object.values(options).map((option) => {
            const OptionIcon = ICON_COMPONENTS[option.icon];
            return (
              <button
                key={option.id}
                type="button"
                onClick={(e) => handleOptionClick(e, option.id)}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerMove={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className={cn(
                  "w-full px-3 py-1.5 flex items-center gap-2 text-left",
                  "hover:bg-zinc-700/50 transition-colors",
                  "group cursor-pointer touch-none",
                  option.id === value && "bg-zinc-700"
                )}
              >
                <div className="flex items-center gap-2 pointer-events-none">
                  <OptionIcon className={cn(
                    "w-5 h-5",
                    option.id === value ? "text-zinc-100" : "text-zinc-400",
                    "group-hover:text-zinc-100"
                  )} />
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-xs",
                      option.id === value ? "text-zinc-100" : "text-zinc-400",
                      "group-hover:text-zinc-100"
                    )}>
                      {option.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                      {option.description}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
} 